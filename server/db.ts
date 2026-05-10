import { createClient } from '@libsql/client';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const url = process.env.TURSO_DATABASE_URL || `file:${path.resolve(__dirname, 'hanyu.sqlite')}`;
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({
      url,
      authToken,
});

// Khởi tạo schema
async function initializeDatabase() {
      await db.execute(`
    CREATE TABLE IF NOT EXISTS decks (
      id TEXT PRIMARY KEY,
      level TEXT,
      description TEXT,
      count INTEGER
    )
  `);

      await db.execute(`
    CREATE TABLE IF NOT EXISTS words (
      id TEXT PRIMARY KEY,
      deckId TEXT,
      word TEXT,
      pinyin TEXT,
      meaning TEXT,
      example TEXT,
      hanViet TEXT,
      FOREIGN KEY(deckId) REFERENCES decks(id)
    )
  `);

      await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT DEFAULT 'user'
    )
  `);

      await db.execute(`
    CREATE TABLE IF NOT EXISTS user_progress (
      userId TEXT,
      wordId TEXT,
      status TEXT, -- 'learned', 'not_learned', 'urgent'
      isStarred INTEGER DEFAULT 0,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(userId, wordId),
      FOREIGN KEY(userId) REFERENCES users(id),
      FOREIGN KEY(wordId) REFERENCES words(id)
    )
  `);

      await db.execute(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      message TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

      await db.execute(`
    CREATE TABLE IF NOT EXISTS notification_reactions (
      userId TEXT,
      notificationId TEXT,
      reactionType TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(userId, notificationId),
      FOREIGN KEY(userId) REFERENCES users(id),
      FOREIGN KEY(notificationId) REFERENCES notifications(id) ON DELETE CASCADE
    )
  `);

      await db.execute(`
    CREATE TABLE IF NOT EXISTS shuffle_topics (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      count INTEGER DEFAULT 0,
      icon TEXT
    )
  `);

      await db.execute(`
    CREATE TABLE IF NOT EXISTS shuffle_sentences (
      id TEXT PRIMARY KEY,
      topicId TEXT,
      vietnamese TEXT NOT NULL,
      chinese TEXT NOT NULL, -- JSON array of words
      pinyin TEXT, -- JSON array of pinyins
      correctOrder TEXT NOT NULL, -- JSON array of words in correct order
      FOREIGN KEY(topicId) REFERENCES shuffle_topics(id) ON DELETE CASCADE
    )
  `);

      await db.execute(`
    CREATE TABLE IF NOT EXISTS shuffle_progress (
      userId TEXT,
      topicId TEXT,
      sentenceId TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(userId, sentenceId),
      FOREIGN KEY(userId) REFERENCES users(id),
      FOREIGN KEY(topicId) REFERENCES shuffle_topics(id) ON DELETE CASCADE,
      FOREIGN KEY(sentenceId) REFERENCES shuffle_sentences(id) ON DELETE CASCADE
    )
  `);

      try {
            await db.execute('ALTER TABLE shuffle_sentences ADD COLUMN pinyin TEXT');
      } catch (e) {
            // Column might already exist, ignore
      }

      try {
            await db.execute('ALTER TABLE user_progress ADD COLUMN isStarred INTEGER DEFAULT 0');
      } catch (e) {
            // Column might already exist
      }

      // Mock Data để seed
      const mockDecks = [
            { id: '1', level: "HSK 1", description: "Từ vựng cơ bản cho người mới", count: 300 },
            { id: '2', level: "HSK 2", description: "Mở rộng giao tiếp cơ bản", count: 300 },
            { id: '3', level: "HSK 3", description: "Giao tiếp trung cấp", count: 600 },
            { id: '4', level: "HSK 4", description: "Hiểu đoạn hội thoại dài", count: 1200 },
            { id: '5', level: "HSK 5", description: "Đọc hiểu nâng cao", count: 2500 },
            { id: '6', level: "HSK 6", description: "Thành thạo gần như bản xứ", count: 5000 }
      ];

      const mockWords: Record<string, any[]> = {
            '1': [
                  { id: 'w1', word: '爱', pinyin: 'ài', meaning: 'yêu, thích', example: '我爱你 (Wǒ ài nǐ) - Tôi yêu bạn.', hanViet: 'Ái' },
                  { id: 'w2', word: '吧', pinyin: 'ba', meaning: 'nhé, đi, thôi (đề nghị)', example: '我们一起去学校吧 (Wǒmen yìqǐ qù xuéxiào ba) - Chúng ta cùng đi đến trường nhé.', hanViet: 'Ba' },
                  { id: 'w3', word: '八', pinyin: 'bā', meaning: 'số tám', example: '我家有八个人 (Wǒ jiā yǒu bā gè rén) - Gia đình tôi có tám người.', hanViet: 'Bát' },
                  { id: 'w4', word: '爸爸', pinyin: 'bàba', meaning: 'bố, ba', example: '我爸爸是一名医生 (Wǒ bàba shì yì míng yīshēng) - Bố tôi là một bác sĩ.', hanViet: 'Ba ba' },
                  { id: 'w5', word: '百', pinyin: 'bǎi', meaning: 'một trăm', example: '这本书一百块钱 (Zhè běn shū yībǎi kuài qián) - Quyển sách này giá một trăm đồng.', hanViet: 'Bách' },
                  { id: 'w6', word: '白天', pinyin: 'báitiān', meaning: 'ban ngày', example: '他白天去上学，晚上去工作 (Tā báitiān qù shàngxué, wǎnshang qù gōngzuò) - Ban ngày anh ấy đi học, buổi tối đi làm.', hanViet: 'Bạch thiên' },
                  { id: 'w7', word: '半', pinyin: 'bàn', meaning: 'một nửa, rưỡi', example: '现在是早上八点半 (Xiànzài shì zǎoshang bā diǎn bàn) - Bây giờ là tám giờ rưỡi sáng.', hanViet: 'Bán' },
                  { id: 'w8', word: '包子', pinyin: 'bāozi', meaning: 'bánh bao', example: '我今天早上吃了一个包子 (Wǒ jīntiān zǎoshang chī le yí gè bāozi) - Sáng nay tôi đã ăn một cái bánh bao.', hanViet: 'Bao tử' },
                  { id: 'w9', word: '杯子', pinyin: 'bēizi', meaning: 'cái cốc', example: '桌子上有一个漂亮的杯子 (Zhuōzi shàng yǒu yí gè piàoliang de bēizi) - Trên bàn có một cái cốc rất đẹp.', hanViet: 'Bôi tử' },
                  { id: 'w10', word: '本', pinyin: 'běn', meaning: 'quyển, cuốn (lượng từ)', example: '我想买一本汉语书 (Wǒ xiǎng mǎi yì běn Hànyǔ shū) - Tôi muốn mua một quyển sách tiếng Trung.', hanViet: 'Bản' },
                  { id: 'w11', word: '边', pinyin: 'biān', meaning: 'bên, phía', example: '我的家在学校旁边 (Wǒ de jiā zài xuéxiào pángbiān) - Nhà tôi ở bên cạnh trường học.', hanViet: 'Biên' },
                  { id: 'w12', word: '病', pinyin: 'bìng', meaning: 'bệnh, bị bệnh', example: '我的朋友今天生病了 (Wǒ de péngyou jīntiān shēngbìng le) - Bạn của tôi hôm nay bị ốm rồi.', hanViet: 'Bệnh' },
                  { id: 'w13', word: '不', pinyin: 'bù', meaning: 'không', example: '我明天不去北京 (Wǒ míngtiān bú qù Běijīng) - Ngày mai tôi không đi Bắc Kinh.', hanViet: 'Bất' },
                  { id: 'w14', word: '不客气', pinyin: 'bú kèqi', meaning: 'không có gì, đừng khách sáo', example: 'A: 谢谢你的帮助！ B: 不客气。 (A: Xièxie nǐ de bāngzhù! B: Bú kèqi.) - A: Cảm ơn sự giúp đỡ của bạn! B: Không có gì.', hanViet: 'Bất khách khí' },
                  { id: 'w15', word: '不要', pinyin: 'bú yào', meaning: 'đừng, không muốn', example: '我不要买这个苹果 (Wǒ bú yào mǎi zhège píngguǒ) - Tôi không muốn mua quả táo này.', hanViet: 'Bất yếu' },
                  { id: 'w16', word: '菜', pinyin: 'cài', meaning: 'món ăn, rau', example: '妈妈做的中国菜很好吃 (Māma zuò de Zhōngguó cài hěn hǎochī) - Món ăn Trung Quốc mẹ làm rất ngon.', hanViet: 'Thái' },
                  { id: 'w17', word: '茶', pinyin: 'chá', meaning: 'trà', example: '我爸爸每天早上都喜欢喝茶 (Wǒ bàba měitiān zǎoshang dōu xǐhuan hē chá) - Bố tôi sáng nào cũng thích uống trà.', hanViet: 'Trà' },
                  { id: 'w18', word: '唱', pinyin: 'chàng', meaning: 'hát', example: '她正在唱一首中文歌 (Tā zhèngzài chàng yì shǒu Zhōngwén gē) - Cô ấy đang hát một bài hát tiếng Trung.', hanViet: 'Xướng' },
                  { id: 'w19', word: '超市', pinyin: 'chāoshì', meaning: 'siêu thị', example: '下午我妈妈去超市买水果 (Xiàwǔ wǒ māma qù chāoshì mǎi shuǐguǒ) - Buổi chiều mẹ tôi đi siêu thị mua trái cây.', hanViet: 'Siêu thị' },
                  { id: 'w20', word: '车', pinyin: 'chē', meaning: 'xe', example: '那辆黑色的车是我的 (Nà liàng hēisè de chē shì wǒ de) - Chiếc xe màu đen kia là của tôi.', hanViet: 'Xa' },
                  { id: 'w21', word: '吃', pinyin: 'chī', meaning: 'ăn', example: '我们现在去饭店吃饭吧 (Wǒmen xiànzài qù fàndiàn chīfàn ba) - Bây giờ chúng ta ra nhà hàng ăn cơm đi.', hanViet: 'Cật' },
                  { id: 'w22', word: '穿', pinyin: 'chuān', meaning: 'mặc', example: '今天很冷，你要多穿衣服 (Jīntiān hěn lěng, nǐ yào duō chuān yīfu) - Hôm nay rất lạnh, bạn phải mặc nhiều quần áo vào.', hanViet: 'Xuyên' },
                  { id: 'w23', word: '出租车', pinyin: 'chūzūchē', meaning: 'xe taxi', example: '我们坐出租车去火车站吧 (Wǒmen zuò chūzūchē qù huǒchēzhàn ba) - Chúng ta đi taxi đến ga tàu đi.', hanViet: 'Xuất tô xa' },
                  { id: 'w24', word: '大', pinyin: 'dà', meaning: 'to, lớn', example: '他的房间非常大 (Tā de fángjiān fēicháng dà) - Căn phòng của anh ấy rất lớn.', hanViet: 'Đại' },
                  { id: 'w25', word: '打电话', pinyin: 'dǎ diànhuà', meaning: 'gọi điện thoại', example: '我晚上给妈妈打电话 (Wǒ wǎnshang gěi māma dǎ diànhuà) - Buổi tối tôi sẽ gọi điện thoại cho mẹ.', hanViet: 'Đả điện thoại' },
                  { id: 'w26', word: '大家', pinyin: 'dàjiā', meaning: 'mọi người', example: '大家都很喜欢这位老师 (Dàjiā dōu hěn xǐhuan zhè wèi lǎoshī) - Mọi người đều rất thích vị giáo viên này.', hanViet: 'Đại gia' },
                  { id: 'w27', word: '到', pinyin: 'dào', meaning: 'đến', example: '明天下午我会到北京 (Míngtiān xiàwǔ wǒ huì dào Běijīng) - Chiều ngày mai tôi sẽ đến Bắc Kinh.', hanViet: 'Đáo' },
                  { id: 'w28', word: '大学', pinyin: 'dàxué', meaning: 'đại học', example: '我的哥哥在北京大学学习 (Wǒ de gēge zài Běijīng Dàxué xuéxí) - Anh trai tôi học ở Đại học Bắc Kinh.', hanViet: 'Đại học' },
                  { id: 'w29', word: '大学生', pinyin: 'dàxuéshēng', meaning: 'sinh viên', example: '他今年二十岁，是一个大学生 (Tā jīnnián èrshí suì, shì yí gè dàxuéshēng) - Năm nay anh ấy 20 tuổi, là một sinh viên đại học.', hanViet: 'Đại học sinh' },
                  { id: 'w30', word: '的', pinyin: 'de', meaning: 'của (trợ từ)', example: '那本红色的书是我的 (Nà běn hóngsè de shū shì wǒ de) - Quyển sách màu đỏ kia là của tôi.', hanViet: 'Đích' },
                  { id: 'w31', word: '第', pinyin: 'dì', meaning: 'thứ (số thứ tự)', example: '这是我第一次去北京 (Zhè shì wǒ dì yī cì qù Běijīng) - Đây là lần đầu tiên tôi đi Bắc Kinh.', hanViet: 'Đệ' },
                  { id: 'w32', word: '店', pinyin: 'diàn', meaning: 'cửa hàng', example: '我们去那家店买衣服吧 (Wǒmen qù nà jiā diàn mǎi yīfu ba) - Chúng ta đến cửa hàng kia mua quần áo đi.', hanViet: 'Điếm' },
                  { id: 'w33', word: '点', pinyin: 'diǎn', meaning: 'giờ', example: '现在是下午三点 (Xiànzài shì xiàwǔ sān diǎn) - Bây giờ là ba giờ chiều.', hanViet: 'Điểm' },
                  { id: 'w34', word: '电话', pinyin: 'diànhuà', meaning: 'điện thoại', example: '我的电话坏了 (Wǒ de diànhuà huài le) - Điện thoại của tôi hỏng rồi.', hanViet: 'Điện thoại' },
                  { id: 'w35', word: '电脑', pinyin: 'diànnǎo', meaning: 'máy tính', example: '爸爸给我买了一台新电脑 (Bàba gěi wǒ mǎi le yì tái xīn diànnǎo) - Bố đã mua cho tôi một chiếc máy tính mới.', hanViet: 'Điện não' },
                  { id: 'w36', word: '电视', pinyin: 'diànshì', meaning: 'tivi', example: '晚上我们全家一起看电视 (Wǎnshang wǒmen quánjiā yìqǐ kàn diànshì) - Buổi tối cả nhà chúng tôi cùng nhau xem tivi.', hanViet: 'Điện thị' },
                  { id: 'w37', word: '电影', pinyin: 'diànyǐng', meaning: 'phim', example: '这部中国电影很好看 (Zhè bù Zhōngguó diànyǐng hěn hǎokàn) - Bộ phim Trung Quốc này rất hay.', hanViet: 'Điện ảnh' },
                  { id: 'w38', word: '电影院', pinyin: 'diànyǐngyuàn', meaning: 'rạp chiếu phim', example: '周末我和朋友去电影院 (Zhōumò wǒ hé péngyou qù diànyǐngyuàn) - Cuối tuần tôi và bạn bè đi rạp chiếu phim.', hanViet: 'Điện ảnh viện' },
                  { id: 'w39', word: '弟弟', pinyin: 'dìdi', meaning: 'em trai', example: '我的弟弟是一个小学生 (Wǒ de dìdi shì yí gè xiǎoxuéshēng) - Em trai tôi là một học sinh tiểu học.', hanViet: 'Đệ đệ' },
                  { id: 'w40', word: '东西', pinyin: 'dōngxi', meaning: 'đồ vật, đồ đạc', example: '妈妈去超市买了很多东西 (Māma qù chāoshì mǎi le hěn duō dōngxi) - Mẹ đi siêu thị mua rất nhiều đồ.', hanViet: 'Đông tây' },
                  { id: 'w41', word: '都', pinyin: 'dōu', meaning: 'đều', example: '我们都是越南人 (Wǒmen dōu shì Yuènán rén) - Chúng tôi đều là người Việt Nam.', hanViet: 'Đô' },
                  { id: 'w42', word: '读', pinyin: 'dú', meaning: 'đọc', example: '我每天早上都读汉语书 (Wǒ měitiān zǎoshang dōu dú Hànyǔ shū) - Mỗi sáng tôi đều đọc sách tiếng Trung.', hanViet: 'Độc' },
                  { id: 'w43', word: '对', pinyin: 'duì', meaning: 'đúng, đối với', example: '你说的对，我同意 (Nǐ shuō de duì, wǒ tóngyì) - Bạn nói đúng, tôi đồng ý.', hanViet: 'Đối' },
                  { id: 'w44', word: '对不起', pinyin: 'duìbuqǐ', meaning: 'xin lỗi', example: '对不起，我今天迟到了 (Duìbuqǐ, wǒ jīntiān chídào le) - Xin lỗi, hôm nay tôi đến muộn rồi.', hanViet: 'Đối bất khởi' },
                  { id: 'w45', word: '多', pinyin: 'duō', meaning: 'nhiều', example: '今天来上课的人很多 (Jīntiān lái shàngkè de rén hěn duō) - Hôm nay người đến lớp học rất nhiều.', hanViet: 'Đa' },
                  { id: 'w46', word: '多少', pinyin: 'duōshao', meaning: 'bao nhiêu', example: '请问，这个苹果多少钱？ (Qǐngwèn, zhège píngguǒ duōshao qián?) - Xin hỏi, quả táo này bao nhiêu tiền?', hanViet: 'Đa thiểu' },
                  { id: 'w47', word: '读书', pinyin: 'dúshū', meaning: 'đọc sách, học tập', example: '他喜欢在房间里读书 (Tā xǐhuan zài fángjiān lǐ dúshū) - Anh ấy thích đọc sách trong phòng.', hanViet: 'Độc thư' },
                  { id: 'w48', word: '二', pinyin: 'èr', meaning: 'số hai', example: '这件衣服二十块钱 (Zhè jiàn yīfu èrshí kuài qián) - Bộ quần áo này hai mươi đồng.', hanViet: 'Nhị' },
                  { id: 'w49', word: '儿子', pinyin: 'érzi', meaning: 'con trai', example: '我的儿子今年五岁了 (Wǒ de érzi jīnnián wǔ suì le) - Con trai tôi năm nay năm tuổi rồi.', hanViet: 'Nhi tử' },
                  { id: 'w50', word: '饭', pinyin: 'fàn', meaning: 'cơm, bữa ăn', example: '我们去饭店吃饭吧 (Wǒmen qù fàndiàn chī fàn ba) - Chúng ta ra nhà hàng ăn cơm nhé.', hanViet: 'Phạn' },
                  { id: 'w51', word: '饭店', pinyin: 'fàndiàn', meaning: 'nhà hàng', example: '这家饭店的菜很好吃 (Zhè jiā fàndiàn de cài hěn hǎochī) - Đồ ăn của nhà hàng này rất ngon.', hanViet: 'Phạn điếm' },
                  { id: 'w52', word: '房间', pinyin: 'fángjiān', meaning: 'phòng', example: '你的房间很漂亮 (Nǐ de fángjiān hěn piàoliang) - Căn phòng của bạn rất đẹp.', hanViet: 'Phòng gian' },
                  { id: 'w53', word: '非常', pinyin: 'fēicháng', meaning: 'rất, vô cùng', example: '今天天气非常热 (Jīntiān tiānqì fēicháng rè) - Hôm nay thời tiết vô cùng nóng.', hanViet: 'Phi thường' },
                  { id: 'w54', word: '飞机', pinyin: 'fēijī', meaning: 'máy bay', example: '明天我坐飞机去北京 (Míngtiān wǒ zuò fēijī qù Běijīng) - Ngày mai tôi ngồi máy bay đi Bắc Kinh.', hanViet: 'Phi cơ' },
                  { id: 'w55', word: '分', pinyin: 'fēn', meaning: 'phút', example: '现在是八点十分 (Xiànzài shì bā diǎn shí fēn) - Bây giờ là tám giờ mười phút.', hanViet: 'Phân' },
                  { id: 'w56', word: '分钟', pinyin: 'fēnzhōng', meaning: 'phút (khoảng thời gian)', example: '请等我五分钟 (Qǐng děng wǒ wǔ fēnzhōng) - Xin hãy đợi tôi năm phút.', hanViet: 'Phân chung' },
                  { id: 'w57', word: '高兴', pinyin: 'gāoxìng', meaning: 'vui vẻ', example: '认识你我很高兴 (Rènshi nǐ wǒ hěn gāoxìng) - Quen biết bạn tôi rất vui.', hanViet: 'Cao hứng' },
                  { id: 'w58', word: '个', pinyin: 'gè', meaning: 'cái, con, người (lượng từ)', example: '我有一个好朋友 (Wǒ yǒu yí gè hǎo péngyou) - Tôi có một người bạn tốt.', hanViet: 'Cá' },
                  { id: 'w59', word: '歌', pinyin: 'gē', meaning: 'bài hát', example: '她唱的歌很好听 (Tā chàng de gē hěn hǎotīng) - Bài hát cô ấy hát rất hay.', hanViet: 'Ca' },
                  { id: 'w60', word: '哥哥', pinyin: 'gēge', meaning: 'anh trai', example: '我的哥哥是一名医生 (Wǒ de gēge shì yì míng yīshēng) - Anh trai tôi là một bác sĩ.', hanViet: 'Ca ca' },
                  { id: 'w61', word: '给', pinyin: 'gěi', meaning: 'cho', example: '请给我一杯水 (Qǐng gěi wǒ yì bēi shuǐ) - Xin cho tôi một cốc nước.', hanViet: 'Cấp' },
                  { id: 'w62', word: '公司', pinyin: 'gōngsī', meaning: 'công ty', example: '我在一家公司工作 (Wǒ zài yì jiā gōngsī gōngzuò) - Tôi làm việc ở một công ty.', hanViet: 'Công tư' },
                  { id: 'w63', word: '工作', pinyin: 'gōngzuò', meaning: 'làm việc', example: '我爸爸每天去工作 (Wǒ bàba měitiān qù gōngzuò) - Bố tôi mỗi ngày đều đi làm.', hanViet: 'Công tác' },
                  { id: 'w64', word: '狗', pinyin: 'gǒu', meaning: 'chó', example: '我家有一只小狗 (Wǒ jiā yǒu yì zhǐ xiǎo gǒu) - Nhà tôi có một chú chó nhỏ.', hanViet: 'Cẩu' },
                  { id: 'w65', word: '贵', pinyin: 'guì', meaning: 'đắt', example: '这件衣服太贵了 (Zhè jiàn yīfu tài guì le) - Bộ quần áo này đắt quá.', hanViet: 'Quý' },
                  { id: 'w66', word: '国', pinyin: 'guó', meaning: 'quốc gia', example: '你是哪国人？ (Nǐ shì nǎ guó rén?) - Bạn là người nước nào?', hanViet: 'Quốc' },
                  { id: 'w67', word: '还', pinyin: 'hái', meaning: 'còn, vẫn', example: '我还有一个苹果 (Wǒ hái yǒu yí gè píngguǒ) - Tôi vẫn còn một quả táo.', hanViet: 'Hoàn' },
                  { id: 'w68', word: '孩子', pinyin: 'háizi', meaning: 'đứa trẻ', example: '这个孩子很可爱 (Zhège háizi hěn kě\'ài) - Đứa trẻ này rất đáng yêu.', hanViet: 'Hài tử' },
                  { id: 'w69', word: '汉语', pinyin: 'Hànyǔ', meaning: 'tiếng Trung', example: '我在学校学习汉语 (Wǒ zài xuéxiào xuéxí Hànyǔ) - Tôi học tiếng Trung ở trường.', hanViet: 'Hán ngữ' },
                  { id: 'w70', word: '汉字', pinyin: 'Hànzì', meaning: 'chữ Hán', example: '这个汉字怎么写？ (Zhège Hànzì zěnme xiě?) - Chữ Hán này viết thế nào?', hanViet: 'Hán tự' },
                  { id: 'w71', word: '号', pinyin: 'hào', meaning: 'số', example: '今天是几月几号？ (Jīntiān shì jǐ yuè jǐ hào?) - Hôm nay là ngày mấy tháng mấy?', hanViet: 'Hiệu' },
                  { id: 'w72', word: '好', pinyin: 'hǎo', meaning: 'tốt', example: '今天天气很好 (Jīntiān tiānqì hěn hǎo) - Thời tiết hôm nay rất tốt.', hanViet: 'Hảo' },
                  { id: 'w73', word: '好吃', pinyin: 'hǎochī', meaning: 'ngon', example: '妈妈做的菜很好吃 (Māma zuò de cài hěn hǎochī) - Món mẹ nấu rất ngon.', hanViet: 'Hảo cật' },
                  { id: 'w74', word: '好看', pinyin: 'hǎokàn', meaning: 'đẹp, hay', example: '这部电影很好看 (Zhè bù diànyǐng hěn hǎokàn) - Bộ phim này rất hay.', hanViet: 'Hảo khán' },
                  { id: 'w75', word: '好听', pinyin: 'hǎotīng', meaning: 'hay (nghe)', example: '这首歌很好听 (Zhè shǒu gē hěn hǎotīng) - Bài hát này rất hay.', hanViet: 'Hảo thính' },
                  { id: 'w76', word: '好玩儿', pinyin: 'hǎowánr', meaning: 'thú vị, vui', example: '这个地方很好玩儿 (Zhège dìfang hěn hǎowánr) - Nơi này rất thú vị.', hanViet: 'Hảo ngoạn nhi' },
                  { id: 'w77', word: '和', pinyin: 'hé', meaning: 'và', example: '我和我朋友一起去 (Wǒ hé wǒ péngyou yìqǐ qù) - Tôi và bạn tôi cùng đi.', hanViet: 'Hòa' },
                  { id: 'w78', word: '喝', pinyin: 'hē', meaning: 'uống', example: '我想喝一杯茶 (Wǒ xiǎng hē yì bēi chá) - Tôi muốn uống một cốc trà.', hanViet: 'Hát' },
                  { id: 'w79', word: '很', pinyin: 'hěn', meaning: 'rất', example: '我今天很忙 (Wǒ jīntiān hěn máng) - Hôm nay tôi rất bận.', hanViet: 'Ngận' },
                  { id: 'w80', word: '后', pinyin: 'hòu', meaning: 'sau', example: '饭后我们去散步 (Fàn hòu wǒmen qù sànbù) - Sau bữa ăn chúng ta đi dạo.', hanViet: 'Hậu' },
                  { id: 'w81', word: '回', pinyin: 'huí', meaning: 'quay về', example: '我下午回家 (Wǒ xiàwǔ huí jiā) - Buổi chiều tôi về nhà.', hanViet: 'Hồi' },
                  { id: 'w82', word: '会', pinyin: 'huì', meaning: 'biết, sẽ', example: '我会说一点儿汉语 (Wǒ huì shuō yìdiǎnr Hànyǔ) - Tôi biết nói một chút tiếng Trung.', hanViet: 'Hội' },
                  { id: 'w83', word: '火车', pinyin: 'huǒchē', meaning: 'tàu hỏa', example: '我们坐火车去北京 (Wǒmen zuò huǒchē qù Běijīng) - Chúng tôi ngồi tàu hỏa đi Bắc Kinh.', hanViet: 'Hỏa xa' },
                  { id: 'w84', word: '几', pinyin: 'jǐ', meaning: 'mấy', example: '你的家有几口人？ (Nǐ de jiā yǒu jǐ kǒu rén?) - Nhà bạn có mấy người?', hanViet: 'Kỉ' },
                  { id: 'w85', word: '家', pinyin: 'jiā', meaning: 'nhà', example: '欢迎来我家玩 (Huānyíng lái wǒ jiā wán) - Hoan nghênh đến nhà tôi chơi.', hanViet: 'Gia' },
                  { id: 'w86', word: '见', pinyin: 'jiàn', meaning: 'gặp', example: '明天见！ (Míngtiān jiàn!) - Ngày mai gặp!', hanViet: 'Kiến' },
                  { id: 'w87', word: '件', pinyin: 'jiàn', meaning: 'cái, chiếc (đồ)', example: '这件衣服很漂亮 (Zhè jiàn yīfu hěn piàoliang) - Chiếc áo này rất đẹp.', hanViet: 'Kiện' },
                  { id: 'w88', word: '叫', pinyin: 'jiào', meaning: 'gọi, tên là', example: '你叫什么名字？ (Nǐ jiào shénme míngzi?) - Bạn tên là gì?', hanViet: 'Khiếu' },
                  { id: 'w89', word: '饺子', pinyin: 'jiǎozi', meaning: 'sủi cảo', example: '我喜欢吃饺子 (Wǒ xǐhuan chī jiǎozi) - Tôi thích ăn sủi cảo.', hanViet: 'Giáo tử' },
                  { id: 'w90', word: '家人', pinyin: 'jiārén', meaning: 'người nhà', example: '我的家人都在越南 (Wǒ de jiārén dōu zài Yuènán) - Người nhà của tôi đều ở Việt Nam.', hanViet: 'Gia nhân' },
                  { id: 'w91', word: '鸡蛋', pinyin: 'jīdàn', meaning: 'trứng gà', example: '早上我吃了一个鸡蛋 (Zǎoshang wǒ chī le yí gè jīdàn) - Buổi sáng tôi đã ăn một quả trứng gà.', hanViet: 'Kê đản' },
                  { id: 'w92', word: '姐姐', pinyin: 'jiějie', meaning: 'chị gái', example: '我的姐姐是一名老师 (Wǒ de jiějie shì yì míng lǎoshī) - Chị gái tôi là một giáo viên.', hanViet: 'Tỷ tỷ' },
                  { id: 'w93', word: '今年', pinyin: 'jīnnián', meaning: 'năm nay', example: '今年我二十岁 (Jīnnián wǒ èrshí suì) - Năm nay tôi 20 tuổi.', hanViet: 'Kim niên' },
                  { id: 'w94', word: '今天', pinyin: 'jīntiān', meaning: 'hôm nay', example: '今天天气很好 (Jīntiān tiānqì hěn hǎo) - Hôm nay thời tiết rất tốt.', hanViet: 'Kim thiên' },
                  { id: 'w95', word: '九', pinyin: 'jiǔ', meaning: 'chín', example: '我有九本中文书 (Wǒ yǒu jiǔ běn Zhōngwén shū) - Tôi có chín quyển sách tiếng Trung.', hanViet: 'Cửu' },
                  { id: 'w96', word: '觉得', pinyin: 'juéde', meaning: 'cảm thấy', example: '我觉得有点儿冷 (Wǒ juéde yǒudiǎnr lěng) - Tôi cảm thấy hơi lạnh.', hanViet: 'Giác đắc' },
                  { id: 'w97', word: '开', pinyin: 'kāi', meaning: 'mở', example: '请开门 (Qǐng kāi mén) - Xin hãy mở cửa.', hanViet: 'Khai' },
                  { id: 'w98', word: '开车', pinyin: 'kāichē', meaning: 'lái xe', example: '我爸爸会开车 (Wǒ bàba huì kāichē) - Bố tôi biết lái xe.', hanViet: 'Khai xa' },
                  { id: 'w99', word: '看', pinyin: 'kàn', meaning: 'nhìn, xem', example: '我在看书 (Wǒ zài kàn shū) - Tôi đang đọc sách.', hanViet: 'Khán' },
                  { id: 'w100', word: '看病', pinyin: 'kànbìng', meaning: 'khám bệnh', example: '明天我要去看病 (Míngtiān wǒ yào qù kànbìng) - Ngày mai tôi phải đi khám bệnh.', hanViet: 'Khán bệnh' },
                  { id: 'w101', word: '看见', pinyin: 'kànjiàn', meaning: 'nhìn thấy', example: '我看见他了 (Wǒ kànjiàn tā le) - Tôi nhìn thấy anh ấy rồi.', hanViet: 'Khán kiến' },
                  { id: 'w102', word: '课', pinyin: 'kè', meaning: 'bài học', example: '今天我们没有课 (Jīntiān wǒmen méi yǒu kè) - Hôm nay chúng tôi không có tiết học.', hanViet: 'Khóa' },
                  { id: 'w103', word: '可以', pinyin: 'kěyǐ', meaning: 'có thể', example: '我可以坐这儿吗？ (Wǒ kěyǐ zuò zhèr ma?) - Tôi có thể ngồi đây không?', hanViet: 'Khả dĩ' },
                  { id: 'w104', word: '口', pinyin: 'kǒu', meaning: 'miệng, nhân khẩu', example: '我家有五口人 (Wǒ jiā yǒu wǔ kǒu rén) - Nhà tôi có năm người.', hanViet: 'Khẩu' },
                  { id: 'w105', word: '块', pinyin: 'kuài', meaning: 'đồng (tiền)', example: '这块手表多少钱？ (Zhè kuài shǒubiǎo duōshao qián?) - Chiếc đồng hồ này bao nhiêu tiền?', hanViet: 'Khối' },
                  { id: 'w106', word: '来', pinyin: 'lái', meaning: 'đến', example: '他昨天来我家 (Tā zuótiān lái wǒ jiā) - Hôm qua anh ấy đến nhà tôi.', hanViet: 'Lai' },
                  { id: 'w107', word: '老师', pinyin: 'lǎoshī', meaning: 'giáo viên', example: '他是我们的汉语老师 (Tā shì wǒmen de Hànyǔ lǎoshī) - Thầy ấy là giáo viên tiếng Trung của chúng tôi.', hanViet: 'Lão sư' },
                  { id: 'w108', word: '了', pinyin: 'le', meaning: 'rồi', example: '我吃饭了 (Wǒ chīfàn le) - Tôi ăn cơm rồi.', hanViet: 'Liễu' },
                  { id: 'w109', word: '冷', pinyin: 'lěng', meaning: 'lạnh', example: '今天天气很冷 (Jīntiān tiānqì hěn lěng) - Hôm nay thời tiết rất lạnh.', hanViet: 'Lãnh' },
                  { id: 'w110', word: '里', pinyin: 'lǐ', meaning: 'bên trong', example: '书在包里 (Shū zài bāo lǐ) - Sách ở trong cặp.', hanViet: 'Lý' },
                  { id: 'w111', word: '两', pinyin: 'liǎng', meaning: 'hai', example: '我有两个苹果 (Wǒ yǒu liǎng gè píngguǒ) - Tôi có hai quả táo.', hanViet: 'Lưỡng' },
                  { id: 'w112', word: '零', pinyin: 'líng', meaning: 'không', example: '现在是零度 (Xiànzài shì líng dù) - Bây giờ là không độ.', hanViet: 'Linh' },
                  { id: 'w113', word: '六', pinyin: 'liù', meaning: 'sáu', example: '我买六本书 (Wǒ mǎi liù běn shū) - Tôi mua sáu quyển sách.', hanViet: 'Lục' },
                  { id: 'w114', word: '吗', pinyin: 'ma', meaning: 'không (nghi vấn)', example: '你是学生吗？ (Nǐ shì xuéshēng ma?) - Bạn là học sinh phải không?', hanViet: 'Ma' },
                  { id: 'w115', word: '卖', pinyin: 'mài', meaning: 'bán', example: '这家店卖什么？ (Zhè jiā diàn mài shénme?) - Cửa hàng này bán gì?', hanViet: 'Mại' },
                  { id: 'w116', word: '买', pinyin: 'mǎi', meaning: 'mua', example: '我想买衣服 (Wǒ xiǎng mǎi yīfu) - Tôi muốn mua quần áo.', hanViet: 'Mãi' },
                  { id: 'w117', word: '妈妈', pinyin: 'māma', meaning: 'mẹ', example: '我爱我的妈妈 (Wǒ ài wǒ de māma) - Tôi yêu mẹ của tôi.', hanViet: 'Ma ma' },
                  { id: 'w118', word: '忙', pinyin: 'máng', meaning: 'bận', example: '你今天忙吗？ (Nǐ jīntiān máng ma?) - Hôm nay bạn bận không?', hanViet: 'Mang' },
                  { id: 'w119', word: '猫', pinyin: 'māo', meaning: 'mèo', example: '我的小猫很可爱 (Wǒ de xiǎo māo hěn kě\'ài) - Chú mèo con của tôi rất đáng yêu.', hanViet: 'Miêu' },
                  { id: 'w120', word: '没关系', pinyin: 'méi guānxi', meaning: 'không sao', example: 'A: 对不起。B: 没关系。 (A: Duìbuqǐ. B: Méi guānxi.) - A: Xin lỗi. B: Không sao.', hanViet: 'Một quan hệ' },
                  { id: 'w121', word: '妹妹', pinyin: 'mèimei', meaning: 'em gái', example: '我妹妹喜欢看电视 (Wǒ mèimei xǐhuan kàn diànshì) - Em gái tôi thích xem tivi.', hanViet: 'Muội muội' },
                  { id: 'w122', word: '没事', pinyin: 'méishì', meaning: 'không có việc gì', example: '我今天下午没事 (Wǒ jīntiān xiàwǔ méishì) - Chiều nay tôi không có việc gì.', hanViet: 'Một sự' },
                  { id: 'w123', word: '没', pinyin: 'méi', meaning: 'không', example: '我没有钱 (Wǒ méiyǒu qián) - Tôi không có tiền.', hanViet: 'Một' },
                  { id: 'w124', word: '们', pinyin: 'men', meaning: 'số nhiều', example: '我们是好朋友 (Wǒmen shì hǎo péngyou) - Chúng tôi là bạn tốt.', hanViet: 'Môn' },
                  { id: 'w125', word: '面包', pinyin: 'miànbāo', meaning: 'bánh mì', example: '我喜欢吃面包 (Wǒ xǐhuan chī miànbāo) - Tôi thích ăn bánh mì.', hanViet: 'Miến bao' },
                  { id: 'w126', word: '面条儿', pinyin: 'miàntiáor', meaning: 'mì', example: '中午我们吃面条儿 (Zhōngwǔ wǒmen chī miàntiáor) - Buổi trưa chúng ta ăn mì.', hanViet: 'Miến điều nhi' },
                  { id: 'w127', word: '米饭', pinyin: 'mǐfàn', meaning: 'cơm', example: '我不喜欢吃米饭 (Wǒ bù xǐhuan chī mǐfàn) - Tôi không thích ăn cơm.', hanViet: 'Mễ phạn' },
                  { id: 'w128', word: '明年', pinyin: 'míngnián', meaning: 'năm sau', example: '明年我去中国学习 (Míngnián wǒ qù Zhōngguó xuéxí) - Năm sau tôi đi Trung Quốc học.', hanViet: 'Minh niên' },
                  { id: 'w129', word: '明天', pinyin: 'míngtiān', meaning: 'ngày mai', example: '明天是星期一 (Míngtiān shì xīngqīyī) - Ngày mai là thứ hai.', hanViet: 'Minh thiên' },
                  { id: 'w130', word: '名字', pinyin: 'míngzi', meaning: 'tên', example: '你的名字很好听 (Nǐ de míngzi hěn hǎotīng) - Tên của bạn rất hay.', hanViet: 'Danh tự' },
                  { id: 'w131', word: '那', pinyin: 'nà', meaning: 'kia', example: '那是我的书 (Nà shì wǒ de shū) - Kia là sách của tôi.', hanViet: 'Na' },
                  { id: 'w132', word: '哪', pinyin: 'nǎ', meaning: 'nào', example: '你是哪国人？ (Nǐ shì nǎ guó rén?) - Bạn là người nước nào?', hanViet: 'Nạ' },
                  { id: 'w133', word: '那边', pinyin: 'nàbiān', meaning: 'bên kia', example: '医院在那边 (Yīyuàn zài nàbiān) - Bệnh viện ở bên kia.', hanViet: 'Na biên' },
                  { id: 'w134', word: '那个', pinyin: 'nàge', meaning: 'cái kia', example: '那个杯子是我的 (Nàge bēizi shì wǒ de) - Cái cốc kia là của tôi.', hanViet: 'Na cá' },
                  { id: 'w135', word: '哪个', pinyin: 'nǎge', meaning: 'cái nào', example: '你喜欢哪个？ (Nǐ xǐhuan nǎge?) - Bạn thích cái nào?', hanViet: 'Nạ cá' },
                  { id: 'w136', word: '那里', pinyin: 'nàlǐ', meaning: 'ở kia', example: '他在那里工作 (Tā zài nàlǐ gōngzuò) - Anh ấy làm việc ở kia.', hanViet: 'Na lý' },
                  { id: 'w137', word: '哪里', pinyin: 'nǎlǐ', meaning: 'ở đâu', example: '你要去哪里？ (Nǐ yào qù nǎlǐ?) - Bạn muốn đi đâu?', hanViet: 'Nạ lý' },
                  { id: 'w138', word: '男', pinyin: 'nán', meaning: 'nam', example: '他是一个男孩 (Tā shì yí gè nánhái) - Cậu ấy là một cậu bé.', hanViet: 'Nam' },
                  { id: 'w139', word: '男朋友', pinyin: 'nánpéngyou', meaning: 'bạn trai', example: '我的男朋友很高 (Wǒ de nánpéngyou hěn gāo) - Bạn trai tôi rất cao.', hanViet: 'Nam bằng hữu' },
                  { id: 'w140', word: '那儿', pinyin: 'nàr', meaning: 'ở kia', example: '我们在那儿吃饭 (Wǒmen zài nàr chīfàn) - Chúng tôi ăn cơm ở kia.', hanViet: 'Na nhi' },
                  { id: 'w141', word: '哪儿', pinyin: 'nǎr', meaning: 'ở đâu', example: '你要去哪儿？ (Nǐ yào qù nǎr?) - Bạn muốn đi đâu?', hanViet: 'Nạ nhi' },
                  { id: 'w142', word: '那些', pinyin: 'nàxiē', meaning: 'những cái đó', example: '那些东西是我的 (Nàxiē dōngxi shì wǒ de) - Những món đồ đó là của tôi.', hanViet: 'Na ta' },
                  { id: 'w143', word: '哪些', pinyin: 'nǎxiē', meaning: 'những cái nào', example: '哪些书是你的？ (Nǎxiē shū shì nǐ de?) - Những quyển sách nào là của bạn?', hanViet: 'Nạ ta' },
                  { id: 'w144', word: '呢', pinyin: 'ne', meaning: 'trợ từ nghi vấn / nhấn mạnh', example: '你呢？ (Nǐ ne?) - Còn bạn thì sao?', hanViet: 'Ni' },
                  { id: 'w145', word: '能', pinyin: 'néng', meaning: 'có thể', example: '你能帮我吗？ (Nǐ néng bāng wǒ ma?) - Bạn có thể giúp tôi không?', hanViet: 'Năng' },
                  { id: 'w146', word: '你', pinyin: 'nǐ', meaning: 'bạn', example: '你是我的朋友 (Nǐ shì wǒ de péngyou) - Bạn là bạn của tôi.', hanViet: 'Nhĩ' },
                  { id: 'w147', word: '你好', pinyin: 'nǐ hǎo', meaning: 'xin chào', example: '老师，你好！ (Lǎoshī, nǐ hǎo!) - Chào thầy/cô!', hanViet: 'Nhĩ hảo' },
                  { id: 'w148', word: '年', pinyin: 'nián', meaning: 'năm', example: '我学习了一年汉语 (Wǒ xuéxí le yì nián Hànyǔ) - Tôi đã học tiếng Trung được một năm.', hanViet: 'Niên' },
                  { id: 'w149', word: '你们', pinyin: 'nǐmen', meaning: 'các bạn', example: '你们好！ (Nǐmen hǎo!) - Chào các bạn!', hanViet: 'Nhĩ môn' },
                  { id: 'w150', word: '您', pinyin: 'nín', meaning: 'ngài, ông/bà (kính ngữ)', example: '您好，请进 (Nín hǎo, qǐng jìn) - Xin chào ngài, mời vào.', hanViet: 'Nhẫm' },
                  { id: 'w151', word: '牛奶', pinyin: 'niúnǎi', meaning: 'sữa', example: '我每天早上喝牛奶 (Wǒ měitiān zǎoshang hē niúnǎi) - Mỗi sáng tôi đều uống sữa.', hanViet: 'Ngưu nãi' },
                  { id: 'w152', word: '女', pinyin: 'nǚ', meaning: 'nữ', example: '她是一个女孩 (Tā shì yí gè nǚhái) - Cô ấy là một cô bé.', hanViet: 'Nữ' },
                  { id: 'w153', word: '女儿', pinyin: 'nǚ’ér', meaning: 'con gái', example: '我的女儿很漂亮 (Wǒ de nǚ\'ér hěn piàoliang) - Con gái tôi rất xinh đẹp.', hanViet: 'Nữ nhi' },
                  { id: 'w154', word: '男朋友', pinyin: 'nǚpéngyou', meaning: 'bạn gái', example: '他没有女朋友 (Tā méi yǒu nǚpéngyou) - Anh ấy không có bạn gái.', hanViet: 'Nữ bằng hữu' },
                  { id: 'w155', word: '女士', pinyin: 'nǚshì', meaning: 'quý bà, phụ nữ', example: '这位女士是谁？ (Zhè wèi nǚshì shì shéi?) - Người phụ nữ này là ai?', hanViet: 'Nữ sĩ' },
                  { id: 'w156', word: '朋友', pinyin: 'péngyou', meaning: 'bạn bè', example: '我有很多朋友 (Wǒ yǒu hěn duō péngyou) - Tôi có rất nhiều bạn bè.', hanViet: 'Bằng hữu' },
                  { id: 'w157', word: '便宜', pinyin: 'piányi', meaning: 'rẻ', example: '这件衣服很便宜 (Zhè jiàn yīfu hěn piányi) - Bộ quần áo này rất rẻ.', hanViet: 'Tiện nghi' },
                  { id: 'w158', word: '漂亮', pinyin: 'piàoliang', meaning: 'xinh đẹp', example: '你的家很漂亮 (Nǐ de jiā hěn piàoliang) - Nhà của bạn rất đẹp.', hanViet: 'Phiêu lượng' },
                  { id: 'w159', word: '苹果', pinyin: 'píngguǒ', meaning: 'táo', example: '我喜欢吃苹果 (Wǒ xǐhuan chī píngguǒ) - Tôi thích ăn táo.', hanViet: 'Bình quả' },
                  { id: 'w160', word: '七', pinyin: 'qī', meaning: 'bảy', example: '现在是七点 (Xiànzài shì qī diǎn) - Bây giờ là bảy giờ.', hanViet: 'Thất' },
                  { id: 'w161', word: '前', pinyin: 'qián', meaning: 'trước', example: '我在学校前面等你 (Wǒ zài xuéxiào qiánmiàn děng nǐ) - Tôi đợi bạn ở phía trước trường học.', hanViet: 'Tiền' },
                  { id: 'w162', word: '钱', pinyin: 'qián', meaning: 'tiền', example: '这个多少钱？ (Zhège duōshao qián?) - Cái này bao nhiêu tiền?', hanViet: 'Tiền' },
                  { id: 'w163', word: '千', pinyin: 'qiān', meaning: 'nghìn', example: '这台电脑一千块 (Zhè tái diànnǎo yìqiān kuài) - Chiếc máy tính này một nghìn tệ.', hanViet: 'Thiên' },
                  { id: 'w164', word: '起床', pinyin: 'qǐchuáng', meaning: 'thức dậy', example: '我每天六点起床 (Wǒ měitiān liù diǎn qǐchuáng) - Tôi thức dậy lúc sáu giờ mỗi ngày.', hanViet: 'Khởi sàng' },
                  { id: 'w165', word: '请', pinyin: 'qǐng', meaning: 'mời, xin', example: '请坐 (Qǐng zuò) - Mời ngồi.', hanViet: 'Thỉnh' },
                  { id: 'w166', word: '请问', pinyin: 'qǐngwèn', meaning: 'xin hỏi', example: '请问，医院在哪里？ (Qǐngwèn, yīyuàn zài nǎlǐ?) - Xin hỏi, bệnh viện ở đâu?', hanViet: 'Thỉnh vấn' },
                  { id: 'w167', word: '去', pinyin: 'qù', meaning: 'đi', example: '我要去超市 (Wǒ yào qù chāoshì) - Tôi phải đi siêu thị.', hanViet: 'Khứ' },
                  { id: 'w168', word: '去年', pinyin: 'qùnián', meaning: 'năm ngoái', example: '去年我在北京学习 (Qùnián wǒ zài Běijīng xuéxí) - Năm ngoái tôi học ở Bắc Kinh.', hanViet: 'Khứ niên' },
                  { id: 'w169', word: '热', pinyin: 'rè', meaning: 'nóng', example: '今天很热 (Jīntiān hěn rè) - Hôm nay rất nóng.', hanViet: 'Nhiệt' },
                  { id: 'w170', word: '人', pinyin: 'rén', meaning: 'người', example: '商店里有很多的人 (Shāngdiàn lǐ yǒu hěn duō de rén) - Trong cửa hàng có rất nhiều người.', hanViet: 'Nhân' },
                  { id: 'w171', word: '认识', pinyin: 'rènshi', meaning: 'quen biết', example: '认识你我很高兴 (Rènshi nǐ wǒ hěn gāoxìng) - Rất vui được làm quen với bạn.', hanViet: 'Nhận thức' },
                  { id: 'w172', word: '日', pinyin: 'rì', meaning: 'ngày', example: '今天是十月一日 (Jīntiān shì shí yuè yī rì) - Hôm nay là ngày 1 tháng 10.', hanViet: 'Nhật' },
                  { id: 'w173', word: '三', pinyin: 'sān', meaning: 'ba', example: '我有三本书 (Wǒ yǒu sān běn shū) - Tôi có ba quyển sách.', hanViet: 'Tam' },
                  { id: 'w174', word: '上', pinyin: 'shàng', meaning: 'trên, lên', example: '桌子上有一个杯子 (Zhuōzi shàng yǒu yí gè bēizi) - Trên bàn có một cái cốc.', hanViet: 'Thượng' },
                  { id: 'w175', word: '上班', pinyin: 'shàngbān', meaning: 'đi làm', example: '我八点去上班 (Wǒ bā diǎn qù shàngbān) - Tôi đi làm lúc tám giờ.', hanViet: 'Thượng ban' },
                  { id: 'w176', word: '商店', pinyin: 'shāngdiàn', meaning: 'cửa hàng', example: '我去商店买东西 (Wǒ qù shāngdiàn mǎi dōngxi) - Tôi đi cửa hàng mua đồ.', hanViet: 'Thương điếm' },
                  { id: 'w177', word: '上课', pinyin: 'shàngkè', meaning: 'lên lớp, học', example: '我们正在上课 (Wǒmen zhèngzài shàngkè) - Chúng tôi đang học bài.', hanViet: 'Thượng khóa' },
                  { id: 'w178', word: '上午', pinyin: 'shàngwǔ', meaning: 'buổi sáng', example: '今天上午我很忙 (Jīntiān shàngwǔ wǒ hěn máng) - Sáng nay tôi rất bận.', hanViet: 'Thượng ngọ' },
                  { id: 'w179', word: '上学', pinyin: 'shàngxué', meaning: 'đi học', example: '他每天早上七点去上学 (Tā měitiān zǎoshang qī diǎn qù shàngxué) - Cậu ấy đi học lúc bảy giờ sáng mỗi ngày.', hanViet: 'Thượng học' },
                  { id: 'w180', word: '少', pinyin: 'shǎo', meaning: 'ít', example: '我的钱很少 (Wǒ de qián hěn shǎo) - Tiền của tôi rất ít.', hanViet: 'Thiểu' },
                  { id: 'w181', word: '谁', pinyin: 'shéi', meaning: 'ai', example: '那个人是谁？ (Nàge rén shì shéi?) - Người kia là ai?', hanViet: 'Thùy' },
                  { id: 'w182', word: '生病', pinyin: 'shēngbìng', meaning: 'bị bệnh', example: '我朋友今天生病了 (Wǒ péngyou jīntiān shēngbìng le) - Bạn tôi hôm nay bị ốm rồi.', hanViet: 'Sinh bệnh' },
                  { id: 'w183', word: '什么', pinyin: 'shénme', meaning: 'cái gì', example: '这是什么？ (Zhè shì shénme?) - Đây là cái gì?', hanViet: 'Thập ma' },
                  { id: 'w184', word: '十', pinyin: 'shí', meaning: 'mười', example: '这个苹果十块钱 (Zhège píngguǒ shí kuài qián) - Quả táo này mười tệ.', hanViet: 'Thập' },
                  { id: 'w185', word: '事', pinyin: 'shì', meaning: 'việc', example: '你找我有什么事？ (Nǐ zhǎo wǒ yǒu shénme shì?) - Bạn tìm tôi có việc gì?', hanViet: 'Sự' },
                  { id: 'w186', word: '是', pinyin: 'shì', meaning: 'là', example: '我是越南人 (Wǒ shì Yuènán rén) - Tôi là người Việt Nam.', hanViet: 'Thị' },
                  { id: 'w187', word: '时候', pinyin: 'shíhou', meaning: 'lúc, thời điểm', example: '你什么时候去北京？ (Nǐ shénme shíhou qù Běijīng?) - Khi nào bạn đi Bắc Kinh?', hanViet: 'Thời hậu' },
                  { id: 'w188', word: '时间', pinyin: 'shíjiān', meaning: 'thời gian', example: '我现在没有时间 (Wǒ xiànzài méiyǒu shíjiān) - Bây giờ tôi không có thời gian.', hanViet: 'Thời gian' },
                  { id: 'w189', word: '手机', pinyin: 'shǒujī', meaning: 'điện thoại di động', example: '这是我的新手机 (Zhè shì wǒ de xīn shǒujī) - Đây là chiếc điện thoại mới của tôi.', hanViet: 'Thủ cơ' },
                  { id: 'w190', word: '书', pinyin: 'shū', meaning: 'sách', example: '我喜欢看书 (Wǒ xǐhuan kàn shū) - Tôi thích đọc sách.', hanViet: 'Thư' },
                  { id: 'w191', word: '书店', pinyin: 'shūdiàn', meaning: 'hiệu sách', example: '我去书店买一本书 (Wǒ qù shūdiàn mǎi yì běn shū) - Tôi đi hiệu sách mua một quyển sách.', hanViet: 'Thư điếm' },
                  { id: 'w192', word: '睡', pinyin: 'shuì', meaning: 'ngủ', example: '他正在睡觉 (Tā zhèngzài shuìjiào) - Anh ấy đang ngủ.', hanViet: 'Thụy' },
                  { id: 'w193', word: '水', pinyin: 'shuǐ', meaning: 'nước', example: '请给我一杯水 (Qǐng gěi wǒ yì bēi shuǐ) - Xin cho tôi một ly nước.', hanViet: 'Thủy' },
                  { id: 'w194', word: '水果', pinyin: 'shuǐguǒ', meaning: 'trái cây', example: '我想去买点儿水果 (Wǒ xiǎng qù mǎi diǎnr shuǐguǒ) - Tôi muốn đi mua chút trái cây.', hanViet: 'Thủy quả' },
                  { id: 'w195', word: '睡觉', pinyin: 'shuìjiào', meaning: 'đi ngủ', example: '现在十点了，我要去睡觉了 (Xiànzài shí diǎn le, wǒ yào qù shuìjiào le) - Bây giờ mười giờ rồi, tôi phải đi ngủ đây.', hanViet: 'Thụy giác' },
                  { id: 'w196', word: '说', pinyin: 'shuō', meaning: 'nói', example: '你会说汉语吗？ (Nǐ huì shuō Hànyǔ ma?) - Bạn có biết nói tiếng Trung không?', hanViet: 'Thuyết' },
                  { id: 'w197', word: '说话', pinyin: 'shuōhuà', meaning: 'nói chuyện', example: '请不要说话 (Qǐng búyào shuōhuà) - Xin đừng nói chuyện.', hanViet: 'Thuyết thoại' },
                  { id: 'w198', word: '四', pinyin: 'sì', meaning: 'bốn', example: '我们有四个苹果 (Wǒmen yǒu sì gè píngguǒ) - Chúng tôi có bốn quả táo.', hanViet: 'Tứ' },
                  { id: 'w199', word: '岁', pinyin: 'suì', meaning: 'tuổi', example: '我弟弟今年八岁 (Wǒ dìdi jīnnián bā suì) - Em trai tôi năm nay tám tuổi.', hanViet: 'Tuế' },
                  { id: 'w200', word: '他', pinyin: 'tā', meaning: 'anh ấy', example: '他是我的老师 (Tā shì wǒ de lǎoshī) - Anh ấy là thầy giáo của tôi.', hanViet: 'Tha' },
                  { id: 'w201', word: '它', pinyin: 'tā', meaning: 'nó (đồ vật / con vật)', example: '我有一只小狗，它很可爱 (Wǒ yǒu yì zhǐ xiǎo gǒu, tā hěn kě\'ài) - Tôi có một chú chó nhỏ, nó rất đáng yêu.', hanViet: 'Tha' },
                  { id: 'w202', word: '她', pinyin: 'tā', meaning: 'cô ấy', example: '她很漂亮 (Tā hěn piàoliang) - Cô ấy rất xinh đẹp.', hanViet: 'Tha' },
                  { id: 'w203', word: '太', pinyin: 'tài', meaning: 'quá, rất', example: '天气太热了 (Tiānqì tài rè le) - Thời tiết nóng quá.', hanViet: 'Thái' },
                  { id: 'w204', word: '他们', pinyin: 'tāmen', meaning: 'họ', example: '他们都在看书 (Tāmen dōu zài kàn shū) - Họ đều đang đọc sách.', hanViet: 'Tha môn' },
                  { id: 'w205', word: '它们', pinyin: 'tāmen', meaning: 'chúng nó (đồ vật / con vật)', example: '这些书是新的，它们很好看 (Zhèxiē shū shì xīn de, tāmen hěn hǎokàn) - Những cuốn sách này là sách mới, chúng rất hay.', hanViet: 'Tha môn' },
                  { id: 'w206', word: '她们', pinyin: 'tāmen', meaning: 'họ (nữ)', example: '她们是我的好朋友 (Tāmen shì wǒ de hǎo péngyou) - Các cô ấy là bạn tốt của tôi.', hanViet: 'Tha môn' },
                  { id: 'w207', word: '天', pinyin: 'tiān', meaning: 'trời, ngày', example: '我明天去北京 (Wǒ míngtiān qù Běijīng) - Ngày mai tôi đi Bắc Kinh.', hanViet: 'Thiên' },
                  { id: 'w208', word: '天气', pinyin: 'tiānqì', meaning: 'thời tiết', example: '今天天气很好 (Jīntiān tiānqì hěn hǎo) - Thời tiết hôm nay rất đẹp.', hanViet: 'Thiên khí' },
                  { id: 'w209', word: '听', pinyin: 'tīng', meaning: 'nghe', example: '我喜欢听音乐 (Wǒ xǐhuan tīng yīnyuè) - Tôi thích nghe nhạc.', hanViet: 'Thính' },
                  { id: 'w210', word: '听见', pinyin: 'tīngjiàn', meaning: 'nghe thấy', example: '你听见我说话吗？ (Nǐ tīngjiàn wǒ shuōhuà ma?) - Bạn có nghe thấy tôi nói không?', hanViet: 'Thính kiến' },
                  { id: 'w211', word: '同学', pinyin: 'tóngxué', meaning: 'bạn học', example: '她是我的同学 (Tā shì wǒ de tóngxué) - Bạn ấy là bạn học của tôi.', hanViet: 'Đồng học' },
                  { id: 'w212', word: '外', pinyin: 'wài', meaning: 'bên ngoài', example: '外面在下雨 (Wàimiàn zài xià yǔ) - Bên ngoài trời đang mưa.', hanViet: 'Ngoại' },
                  { id: 'w213', word: '外边', pinyin: 'wàibian', meaning: 'phía ngoài', example: '外边很冷 (Wàibian hěn lěng) - Phía ngoài rất lạnh.', hanViet: 'Ngoại biên' },
                  { id: 'w214', word: '玩', pinyin: 'wán', meaning: 'chơi', example: '我们在公园里玩 (Wǒmen zài gōngyuán lǐ wán) - Chúng tôi chơi trong công viên.', hanViet: 'Ngoạn' },
                  { id: 'w215', word: '晚', pinyin: 'wǎn', meaning: 'muộn, tối', example: '今天我回家很晚 (Jīntiān wǒ huí jiā hěn wǎn) - Hôm nay tôi về nhà rất muộn.', hanViet: 'Vãn' },
                  { id: 'w216', word: '晚饭', pinyin: 'wǎnfàn', meaning: 'bữa tối', example: '我们正在吃晚饭 (Wǒmen zhèngzài chī wǎnfàn) - Chúng tôi đang ăn bữa tối.', hanViet: 'Vãn phạn' },
                  { id: 'w217', word: '晚上', pinyin: 'wǎnshang', meaning: 'buổi tối', example: '今天晚上你想吃什么？ (Jīntiān wǎnshang nǐ xiǎng chī shénme?) - Tối nay bạn muốn ăn gì?', hanViet: 'Vãn thượng' },
                  { id: 'w218', word: '喂', pinyin: 'wèi', meaning: 'alo (khi nghe điện thoại)', example: '喂，请问你找谁？ (Wèi, qǐngwèn nǐ zhǎo shéi?) - Alo, xin hỏi bạn tìm ai?', hanViet: 'Vị' },
                  { id: 'w219', word: '问', pinyin: 'wèn', meaning: 'hỏi', example: '我可以问你一个问题吗？ (Wǒ kěyǐ wèn nǐ yí gè wèntí ma?) - Tôi có thể hỏi bạn một câu được không?', hanViet: 'Vấn' },
                  { id: 'w220', word: '问题', pinyin: 'wèntí', meaning: 'vấn đề, câu hỏi', example: '没问题！ (Méi wèntí!) - Không vấn đề gì!', hanViet: 'Vấn đề' },
                  { id: 'w221', word: '我', pinyin: 'wǒ', meaning: 'tôi', example: '我是越南人 (Wǒ shì Yuènán rén) - Tôi là người Việt Nam.', hanViet: 'Ngã' },
                  { id: 'w222', word: '我们', pinyin: 'wǒmen', meaning: 'chúng tôi', example: '我们去吃饭吧 (Wǒmen qù chīfàn ba) - Chúng ta đi ăn thôi.', hanViet: 'Ngã môn' },
                  { id: 'w223', word: '五', pinyin: 'wǔ', meaning: 'số năm', example: '我有五块钱 (Wǒ yǒu wǔ kuài qián) - Tôi có 5 đồng.', hanViet: 'Ngũ' },
                  { id: 'w224', word: '午饭', pinyin: 'wǔfàn', meaning: 'bữa trưa', example: '今天午饭很好吃 (Jīntiān wǔfàn hěn hǎochī) - Bữa trưa hôm nay rất ngon.', hanViet: 'Ngọ phạn' },
                  { id: 'w225', word: '下', pinyin: 'xià', meaning: 'dưới, xuống', example: '小猫在桌子下面 (Xiǎo māo zài zhuōzi xiàmiàn) - Con mèo ở dưới cái bàn.', hanViet: 'Hạ' },
                  { id: 'w226', word: '下雨', pinyin: 'xià yǔ', meaning: 'mưa', example: '外面下雨了 (Wàimiàn xià yǔ le) - Bên ngoài trời mưa rồi.', hanViet: 'Hạ vũ' },
                  { id: 'w227', word: '下班', pinyin: 'xiàbān', meaning: 'tan làm', example: '我五点半下班 (Wǒ wǔ diǎn bàn xiàbān) - Tôi tan làm lúc 5 rưỡi.', hanViet: 'Hạ ban' },
                  { id: 'w228', word: '下课', pinyin: 'xiàkè', meaning: 'tan học', example: '我们下课了 (Wǒmen xiàkè le) - Chúng tôi tan học rồi.', hanViet: 'Hạ khóa' },
                  { id: 'w229', word: '想', pinyin: 'xiǎng', meaning: 'muốn, nghĩ', example: '我想去中国 (Wǒ xiǎng qù Zhōngguó) - Tôi muốn đi Trung Quốc.', hanViet: 'Tưởng' },
                  { id: 'w230', word: '先生', pinyin: 'xiānsheng', meaning: 'ông, ngài', example: '王先生，你好！ (Wáng xiānsheng, nǐ hǎo!) - Chào Vương tiên sinh!', hanViet: 'Tiên sinh' },
                  { id: 'w231', word: '现在', pinyin: 'xiànzài', meaning: 'bây giờ', example: '现在几点了？ (Xiànzài jǐ diǎn le?) - Bây giờ mấy giờ rồi?', hanViet: 'Hiện tại' },
                  { id: 'w232', word: '小', pinyin: 'xiǎo', meaning: 'nhỏ', example: '这个苹果太小了 (Zhège píngguǒ tài xiǎo le) - Quả táo này nhỏ quá.', hanViet: 'Tiểu' },
                  { id: 'w233', word: '小朋友', pinyin: 'xiǎopéngyǒu', meaning: 'trẻ em', example: '小朋友，你几岁了？ (Xiǎopéngyǒu, nǐ jǐ suì le?) - Cháu ơi, cháu mấy tuổi rồi?', hanViet: 'Tiểu bằng hữu' },
                  { id: 'w234', word: '小时', pinyin: 'xiǎoshí', meaning: 'giờ', example: '我学习了三个小时 (Wǒ xuéxí le sān gè xiǎoshí) - Tôi đã học ba tiếng đồng hồ.', hanViet: 'Tiểu thời' },
                  { id: 'w235', word: '小学', pinyin: 'xiǎoxué', meaning: 'tiểu học', example: '我的弟弟在小学上学 (Wǒ de dìdi zài xiǎoxué shàngxué) - Em trai tôi học ở trường tiểu học.', hanViet: 'Tiểu học' },
                  { id: 'w236', word: '小学生', pinyin: 'xiǎoxuéshēng', meaning: 'học sinh tiểu học', example: '他是一名小学生 (Tā shì yì míng xiǎoxuéshēng) - Em ấy là một học sinh tiểu học.', hanViet: 'Tiểu học sinh' },
                  { id: 'w237', word: '下午', pinyin: 'xiàwǔ', meaning: 'buổi chiều', example: '下午我去看电影 (Xiàwǔ wǒ qù kàn diànyǐng) - Buổi chiều tôi đi xem phim.', hanViet: 'Hạ ngọ' },
                  { id: 'w238', word: '写', pinyin: 'xiě', meaning: 'viết', example: '我会写汉字 (Wǒ huì xiě Hànzì) - Tôi biết viết chữ Hán.', hanViet: 'Tả' },
                  { id: 'w239', word: '些', pinyin: 'xiē', meaning: 'một ít', example: '我想买些苹果 (Wǒ xiǎng mǎi xiē píngguǒ) - Tôi muốn mua một ít táo.', hanViet: 'Ta' },
                  { id: 'w240', word: '谢谢', pinyin: 'xièxie', meaning: 'cảm ơn', example: '谢谢你的帮助 (Xièxie nǐ de bāngzhù) - Cảm ơn sự giúp đỡ của bạn.', hanViet: 'Tạ tạ' },
                  { id: 'w241', word: '喜欢', pinyin: 'xǐhuan', meaning: 'thích', example: '我喜欢吃中国菜 (Wǒ xǐhuan chī Zhōngguó cài) - Tôi thích ăn món ăn Trung Quốc.', hanViet: 'Hỉ hoan' },
                  { id: 'w242', word: '新', pinyin: 'xīn', meaning: 'mới', example: '这是我的新衣服 (Zhè shì wǒ de xīn yīfu) - Đây là quần áo mới của tôi.', hanViet: 'Tân' },
                  { id: 'w243', word: '星期', pinyin: 'xīngqī', meaning: 'tuần', example: '一个星期有七天 (Yí gè xīngqī yǒu qī tiān) - Một tuần có bảy ngày.', hanViet: 'Tinh kỳ' },
                  { id: 'w244', word: '星期日', pinyin: 'xīngqīrì', meaning: 'chủ nhật', example: '明天是星期日 (Míngtiān shì xīngqīrì) - Ngày mai là chủ nhật.', hanViet: 'Tinh kỳ nhật' },
                  { id: 'w245', word: '星期天', pinyin: 'xīngqītiān', meaning: 'chủ nhật', example: '星期天我们去公园玩 (Xīngqītiān wǒmen qù gōngyuán wán) - Chủ nhật chúng tôi đi công viên chơi.', hanViet: 'Tinh kỳ thiên' },
                  { id: 'w246', word: '休息', pinyin: 'xiūxi', meaning: 'nghỉ ngơi', example: '你太累了，休息一下吧 (Nǐ tài lèi le, xiūxi yíxià ba) - Bạn mệt quá rồi, nghỉ ngơi một chút đi.', hanViet: 'Hưu tức' },
                  { id: 'w247', word: '学', pinyin: 'xué', meaning: 'học', example: '他在学汉语 (Tā zài xué Hànyǔ) - Cậu ấy đang học tiếng Trung.', hanViet: 'Học' },
                  { id: 'w248', word: '雪', pinyin: 'xuě', meaning: 'tuyết', example: '下雪了 (Xià xuě le) - Tuyết rơi rồi.', hanViet: 'Tuyết' },
                  { id: 'w249', word: '学生', pinyin: 'xuéshēng', meaning: 'học sinh', example: '我是学生 (Wǒ shì xuéshēng) - Tôi là học sinh.', hanViet: 'Học sinh' },
                  { id: 'w250', word: '学习', pinyin: 'xuéxí', meaning: 'học tập', example: '我们每天都在学校学习 (Wǒmen měitiān dōu zài xuéxiào xuéxí) - Chúng tôi học ở trường mỗi ngày.', hanViet: 'Học tập' },
                  { id: 'w251', word: '学校', pinyin: 'xuéxiào', meaning: 'trường học', example: '我们的学校很大 (Wǒmen de xuéxiào hěn dà) - Trường của chúng tôi rất lớn.', hanViet: 'Học hiệu' },
                  { id: 'w252', word: '要', pinyin: 'yào', meaning: 'muốn, cần', example: '我要去超市买东西 (Wǒ yào qù chāoshì mǎi dōngxi) - Tôi cần đi siêu thị mua đồ.', hanViet: 'Yếu' },
                  { id: 'w253', word: '也', pinyin: 'yě', meaning: 'cũng', example: '我也是越南人 (Wǒ yě shì Yuènán rén) - Tôi cũng là người Việt Nam.', hanViet: 'Dã' },
                  { id: 'w254', word: '一', pinyin: 'yī', meaning: 'số một', example: '给我一杯水 (Gěi wǒ yì bēi shuǐ) - Cho tôi một ly nước.', hanViet: 'Nhất' },
                  { id: 'w255', word: '一半', pinyin: 'yíbàn', meaning: 'một nửa', example: '这个苹果分你一半 (Zhège píngguǒ fēn nǐ yíbàn) - Quả táo này chia cho bạn một nửa.', hanViet: 'Nhất bán' },
                  { id: 'w256', word: '一点儿', pinyin: 'yìdiǎnr', meaning: 'một chút', example: '我会说一点儿汉语 (Wǒ huì shuō yìdiǎnr Hànyǔ) - Tôi biết nói một chút tiếng Trung.', hanViet: 'Nhất điểm nhi' },
                  { id: 'w257', word: '衣服', pinyin: 'yīfu', meaning: 'quần áo', example: '这件衣服很漂亮 (Zhè jiàn yīfu hěn piàoliang) - Bộ quần áo này rất đẹp.', hanViet: 'Y phục' },
                  { id: 'w258', word: '医生', pinyin: 'yīshēng', meaning: 'bác sĩ', example: '我爸爸是一名医生 (Wǒ bàba shì yì míng yīshēng) - Bố tôi là một bác sĩ.', hanViet: 'Y sinh' },
                  { id: 'w259', word: '一下', pinyin: 'yíxià', meaning: 'một chút, một lát', example: '请等一下 (Qǐng děng yíxià) - Xin đợi một lát.', hanViet: 'Nhất hạ' },
                  { id: 'w260', word: '一些', pinyin: 'yìxiē', meaning: 'một vài', example: '我想买一些水果 (Wǒ xiǎng mǎi yìxiē shuǐguǒ) - Tôi muốn mua một vài loại trái cây.', hanViet: 'Nhất ta' },
                  { id: 'w261', word: '医院', pinyin: 'yīyuàn', meaning: 'bệnh viện', example: '他去医院看病了 (Tā qù yīyuàn kànbìng le) - Anh ấy đã đi bệnh viện khám bệnh rồi.', hanViet: 'Y viện' },
                  { id: 'w262', word: '椅子', pinyin: 'yǐzi', meaning: 'cái ghế', example: '请坐在椅子上 (Qǐng zuò zài yǐzi shàng) - Mời ngồi lên ghế.', hanViet: 'Y tử' },
                  { id: 'w263', word: '有', pinyin: 'yǒu', meaning: 'có', example: '我有很多朋友 (Wǒ yǒu hěn duō péngyou) - Tôi có rất nhiều bạn bè.', hanViet: 'Hữu' },
                  { id: 'w264', word: '有的', pinyin: 'yǒude', meaning: 'một số', example: '有的人喜欢看书 (Yǒude rén xǐhuan kàn shū) - Một số người thích đọc sách.', hanViet: 'Hữu đích' },
                  { id: 'w265', word: '有些', pinyin: 'yǒuxiē', meaning: 'một vài', example: '我有些累了 (Wǒ yǒuxiē lèi le) - Tôi hơi mệt rồi.', hanViet: 'Hữu ta' },
                  { id: 'w266', word: '有（一）点儿', pinyin: 'yǒu (yì)diǎnr', meaning: 'hơi, có chút', example: '今天有点儿冷 (Jīntiān yǒudiǎnr lěng) - Hôm nay hơi lạnh.', hanViet: 'Hữu nhất điểm nhi' },
                  { id: 'w267', word: '雨', pinyin: 'yǔ', meaning: 'mưa', example: '今天下大雨 (Jīntiān xià dà yǔ) - Hôm nay trời mưa lớn.', hanViet: 'Vũ' },
                  { id: 'w268', word: '元', pinyin: 'yuán', meaning: 'đồng (đơn vị tiền tệ)', example: '这杯茶十元 (Zhè bēi chá shí yuán) - Cốc trà này 10 đồng.', hanViet: 'Nguyên' },
                  { id: 'w269', word: '月', pinyin: 'yuè', meaning: 'tháng', example: '一年有十二个月 (Yì nián yǒu shí\'èr gè yuè) - Một năm có 12 tháng.', hanViet: 'Nguyệt' },
                  { id: 'w270', word: '再', pinyin: 'zài', meaning: 'lại, thêm', example: '我明天再来 (Wǒ míngtiān zài lái) - Ngày mai tôi lại đến.', hanViet: 'Tái' },
                  { id: 'w271', word: '在', pinyin: 'zài', meaning: 'ở, đang', example: '我在家 (Wǒ zài jiā) - Tôi ở nhà.', hanViet: 'Tại' },
                  { id: 'w272', word: '再见', pinyin: 'zàijiàn', meaning: 'tạm biệt', example: '老师，再见！ (Lǎoshī, zàijiàn!) - Chào tạm biệt thầy/cô!', hanViet: 'Tái kiến' },
                  { id: 'w273', word: '早', pinyin: 'zǎo', meaning: 'sớm', example: '今天你来得很早 (Jīntiān nǐ lái de hěn zǎo) - Hôm nay bạn đến rất sớm.', hanViet: 'Tảo' },
                  { id: 'w274', word: '早饭', pinyin: 'zǎofàn', meaning: 'bữa sáng', example: '我吃早饭了 (Wǒ chī zǎofàn le) - Tôi đã ăn sáng rồi.', hanViet: 'Tảo phạn' },
                  { id: 'w275', word: '早上', pinyin: 'zǎoshang', meaning: 'buổi sáng', example: '早上好！ (Zǎoshang hǎo!) - Chào buổi sáng!', hanViet: 'Tảo thượng' },
                  { id: 'w276', word: '怎么', pinyin: 'zěnme', meaning: 'thế nào', example: '这个字怎么写？ (Zhège zì zěnme xiě?) - Chữ này viết thế nào?', hanViet: 'Chẩm ma' },
                  { id: 'w277', word: '怎么样', pinyin: 'zěnmeyàng', meaning: 'thế nào, ra sao', example: '今天天气怎么样？ (Jīntiān tiānqì zěnmeyàng?) - Thời tiết hôm nay thế nào?', hanViet: 'Chẩm ma dạng' },
                  { id: 'w278', word: '找', pinyin: 'zhǎo', meaning: 'tìm', example: '你在找什么？ (Nǐ zài zhǎo shénme?) - Bạn đang tìm gì vậy?', hanViet: 'Trảo' },
                  { id: 'w279', word: '这', pinyin: 'zhè', meaning: 'này', example: '这是我的书 (Zhè shì wǒ de shū) - Đây là sách của tôi.', hanViet: 'Giá' },
                  { id: 'w280', word: '这边', pinyin: 'zhèbiān', meaning: 'bên này', example: '请走这边 (Qǐng zǒu zhèbiān) - Mời đi bên này.', hanViet: 'Giá biên' },
                  { id: 'w281', word: '这个', pinyin: 'zhège', meaning: 'cái này', example: '这个苹果很大 (Zhège píngguǒ hěn dà) - Quả táo này rất to.', hanViet: 'Giá cá' },
                  { id: 'w282', word: '这里', pinyin: 'zhèlǐ', meaning: 'ở đây', example: '这里是北京 (Zhèlǐ shì Běijīng) - Đây là Bắc Kinh.', hanViet: 'Giá lý' },
                  { id: 'w283', word: '真', pinyin: 'zhēn', meaning: 'thật, rất', example: '你真漂亮 (Nǐ zhēn piàoliang) - Bạn thật xinh đẹp.', hanViet: 'Chân' },
                  { id: 'w284', word: '正在', pinyin: 'zhèngzài', meaning: 'đang', example: '他正在睡觉 (Tā zhèngzài shuìjiào) - Anh ấy đang ngủ.', hanViet: 'Chính tại' },
                  { id: 'w285', word: '这儿', pinyin: 'zhèr', meaning: 'chỗ này, ở đây', example: '我在这儿等你 (Wǒ zài zhèr děng nǐ) - Tôi đợi bạn ở đây.', hanViet: 'Giá nhi' },
                  { id: 'w286', word: '这些', pinyin: 'zhèxiē', meaning: 'những cái này', example: '这些书都是我的 (Zhèxiē shū dōu shì wǒ de) - Những quyển sách này đều là của tôi.', hanViet: 'Giá ta' },
                  { id: 'w287', word: '只', pinyin: 'zhǐ', meaning: 'con (dùng cho động vật)', example: '我有一只小狗 (Wǒ yǒu yì zhǐ xiǎo gǒu) - Tôi có một chú chó nhỏ.', hanViet: 'Chích' },
                  { id: 'w288', word: '知道', pinyin: 'zhīdào', meaning: 'biết', example: '我不知道 (Wǒ bù zhīdào) - Tôi không biết.', hanViet: 'Tri đạo' },
                  { id: 'w289', word: '中国', pinyin: 'Zhōngguó', meaning: 'Trung Quốc', example: '我是中国人 (Wǒ shì Zhōngguó rén) - Tôi là người Trung Quốc.', hanViet: 'Trung Quốc' },
                  { id: 'w290', word: '中文', pinyin: 'Zhōngwén', meaning: 'tiếng Trung', example: '我会说一点儿中文 (Wǒ huì shuō yìdiǎnr Zhōngwén) - Tôi biết nói một chút tiếng Trung.', hanViet: 'Trung Văn' },
                  { id: 'w291', word: '中午', pinyin: 'zhōngwǔ', meaning: 'buổi trưa', example: '中午我们吃米饭 (Zhōngwǔ wǒmen chī mǐfàn) - Buổi trưa chúng tôi ăn cơm.', hanViet: 'Trung ngọ' },
                  { id: 'w292', word: '中学', pinyin: 'zhōngxué', meaning: 'trường trung học', example: '这是我们中学 (Zhè shì wǒmen zhōngxué) - Đây là trường trung học của chúng tôi.', hanViet: 'Trung học' },
                  { id: 'w293', word: '中学生', pinyin: 'zhōngxuéshēng', meaning: 'học sinh trung học', example: '他是一个中学生 (Tā shì yí gè zhōngxuéshēng) - Em ấy là học sinh trung học.', hanViet: 'Trung học sinh' },
                  { id: 'w294', word: '住', pinyin: 'zhù', meaning: 'ở, cư trú', example: '你住在哪里？ (Nǐ zhù zài nǎlǐ?) - Bạn sống ở đâu?', hanViet: 'Trú' },
                  { id: 'w295', word: '桌子', pinyin: 'zhuōzi', meaning: 'cái bàn', example: '桌子上有一本书 (Zhuōzi shàng yǒu yì běn shū) - Trên bàn có một quyển sách.', hanViet: 'Trác tử' },
                  { id: 'w296', word: '字', pinyin: 'zì', meaning: 'chữ, ký tự', example: '这个字我不认识 (Zhège zì wǒ bú rènshi) - Tôi không biết chữ này.', hanViet: 'Tự' },
                  { id: 'w297', word: '坐', pinyin: 'zuò', meaning: 'ngồi', example: '请坐在这儿 (Qǐng zuò zài zhèr) - Xin mời ngồi ở đây.', hanViet: 'Tọa' },
                  { id: 'w298', word: '做', pinyin: 'zuò', meaning: 'làm', example: '你在做什么？ (Nǐ zài zuò shénme?) - Bạn đang làm gì vậy?', hanViet: 'Tố' },
                  { id: 'w299', word: '做饭', pinyin: 'zuò fàn', meaning: 'nấu ăn', example: '妈妈正在做饭 (Māma zhèngzài zuò fàn) - Mẹ đang nấu ăn.', hanViet: 'Tố phạn' },
                  { id: 'w300', word: '昨天', pinyin: 'zuótiān', meaning: 'hôm qua', example: '昨天我去商店了 (Zuótiān wǒ qù shāngdiàn le) - Hôm qua tôi đã đi cửa hàng.', hanViet: 'Tạc thiên' }

            ],
      };

      // Seed database (Upsert)
      for (const deck of mockDecks) {
            await db.execute({
                  sql: 'INSERT INTO decks (id, level, description, count) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET level=excluded.level, description=excluded.description, count=excluded.count',
                  args: [deck.id, deck.level, deck.description, deck.count]
            });

            const words = mockWords[deck.id] || [];
            for (const word of words) {
                  await db.execute({
                        sql: 'INSERT INTO words (id, deckId, word, pinyin, meaning, example, hanViet) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET deckId=excluded.deckId, word=excluded.word, pinyin=excluded.pinyin, meaning=excluded.meaning, example=excluded.example, hanViet=excluded.hanViet',
                        args: [word.id, deck.id, word.word, word.pinyin, word.meaning, word.example, word.hanViet || null]
                  });
            }
      }
      console.log('Database initialized and seeded with flashcard data.');
}

initializeDatabase().catch(console.error);

export default db;

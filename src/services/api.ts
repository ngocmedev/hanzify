import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

// Mock Data
const mockUser = {
  id: 'flazi-001',
  name: 'Hanzify',
  username: 'hanzify.me',
  bio: 'Học tiếng Trung vui vẻ cùng Hanzify! 🐼✨',
  avatar: 'https://picsum.photos/seed/flazi/200/200',
  coverImage: 'https://picsum.photos/seed/flazi-cover/1200/400',
  stats: {
    followers: '12.5K',
    following: '128',
    likes: '45K'
  }
};

const mockProfile = {
  sections: [
    {
      id: 's1',
      title: 'Khóa học nổi bật',
      type: 'grid',
      items: [
        { id: 'i1', title: 'Từ Vựng Tiếng Trung', description: 'Lộ trình từ con số 0', icon: 'BookOpen', link: '#' },
        { id: 'i2', title: 'Luyện Thi HSK 1-3', description: 'Chinh phục chứng chỉ nhanh chóng', icon: 'GraduationCap', link: '#' },
        { id: 'i3', title: 'Phát Âm Chuẩn 21 Ngày', description: 'Sửa ngọng, luyện giọng hay', icon: 'Mic', link: '#' }
      ]
    },
    {
      id: 's2',
      title: 'MINI GAMES',
      type: 'list',
      items: [
        { id: 'i4', title: 'Ebook 500 Chữ Hán Cơ Bản', description: 'Tải ngay bản PDF', icon: 'Download', link: '#' },
        { id: 'i5', title: 'Flashcards Từ Vựng HSK 1', description: 'Học qua hình ảnh sinh động', icon: 'Layers', link: '#' }
      ]
    }
  ],
  socials: [
    { id: 'fb', platform: 'Facebook', url: 'https://facebook.com', icon: 'Facebook' },
    { id: 'tt', platform: 'TikTok', url: 'https://tiktok.com', icon: 'Music2' },
    { id: 'yt', platform: 'YouTube', url: 'https://youtube.com', icon: 'Youtube' },
    { id: 'ig', platform: 'Instagram', url: 'https://instagram.com', icon: 'Instagram' }
  ]
};

const mockPosts = [
  { id: 'p1', title: 'Cách nhớ 10 chữ Hán mỗi ngày', date: '2024-03-20', image: 'https://picsum.photos/seed/post1/400/300' },
  { id: 'p2', title: 'Top 5 app học tiếng Trung tốt nhất', date: '2024-03-18', image: 'https://picsum.photos/seed/post2/400/300' },
  { id: 'p3', title: 'Phân biệt "Bù" và "Méi"', date: '2024-03-15', image: 'https://picsum.photos/seed/post3/400/300' }
];

const mockDecks = [
  { id: '1', level: "HSK 1", description: "Từ vựng cơ bản cho người mới", count: 150 },
  { id: '2', level: "HSK 2", description: "Mở rộng giao tiếp cơ bản", count: 300 },
  { id: '3', level: "HSK 3", description: "Giao tiếp trung cấp", count: 600 },
  { id: '4', level: "HSK 4", description: "Hiểu đoạn hội thoại dài", count: 1200 },
  { id: '5', level: "HSK 5", description: "Đọc hiểu nâng cao", count: 2500 },
  { id: '6', level: "HSK 6", description: "Thành thạo gần như bản xứ", count: 5000 }
];

const mockWords: Record<string, any[]> = {
  '1': [
    { id: 'w1', word: '我', pinyin: 'wǒ', meaning: 'tôi, mình', example: '我是学生 (Wǒ shì xuésheng) - Tôi là học sinh.', hanViet: 'Ngã' },
    { id: 'w2', word: '你', pinyin: 'nǐ', meaning: 'bạn, anh, chị', example: '你好 (Nǐ hǎo) - Chào bạn.', hanViet: 'Nhĩ' },
    { id: 'w3', word: '好', pinyin: 'hǎo', meaning: 'tốt, khỏe', example: '很好 (Hěn hǎo) - Rất tốt.', hanViet: 'Hảo' },
    { id: 'w4', word: '是', pinyin: 'shì', meaning: 'là', example: '他是我的老师 (Tā shì wǒ de lǎoshī) - Ông ấy là thầy giáo của tôi.', hanViet: 'Thị' },
    { id: 'w5', word: '不', pinyin: 'bù', meaning: 'không', example: '我不去 (Wǒ bù qù) - Tôi không đi.', hanViet: 'Bất' },
    { id: 'w6', word: '谢谢', pinyin: 'xièxie', meaning: 'cảm ơn', example: '谢谢你 (Xièxie nǐ) - Cảm ơn bạn.', hanViet: 'Tạ tạ' },
    { id: 'w15', word: '爱', pinyin: 'ài', meaning: 'yêu, thích', example: '我爱你 (Wǒ ài nǐ) - Tôi yêu bạn.', hanViet: 'Ái' },
    { id: 'w16', word: '爸爸', pinyin: 'bàba', meaning: 'bố, ba', example: '我爸爸是医生 (Wǒ bàba shì yīshēng) - Bố tôi là bác sĩ.', hanViet: 'Ba ba' },
    { id: 'w17', word: '妈妈', pinyin: 'māma', meaning: 'mẹ, má', example: '我妈妈很漂亮 (Wǒ māma hěn piàoliang) - Mẹ tôi rất xinh đẹp.', hanViet: 'Ma ma' },
    { id: 'w18', word: '杯子', pinyin: 'bēizi', meaning: 'cái cốc', example: '这是一个杯子 (Zhè shì yīgè bēizi) - Đây là một cái cốc.', hanViet: 'Bôi tử' },
    { id: 'w19', word: '北京', pinyin: 'Běijīng', meaning: 'Bắc Kinh', example: '我去北京 (Wǒ qù Běijīng) - Tôi đi Bắc Kinh.', hanViet: 'Bắc Kinh' }
  ],
  '2': [
    { id: 'w7', word: '准备', pinyin: 'zhǔnbèi', meaning: 'chuẩn bị', example: '你准备好了吗？ (Nǐ zhǔnbèi hǎo le ma?) - Bạn đã chuẩn bị xong chưa?', hanViet: 'Chuẩn bị' },
    { id: 'w8', word: '开始', pinyin: 'kāishǐ', meaning: 'bắt đầu', example: '我们现在开始吧 (Wǒmen xiànzài kāishǐ ba) - Chúng ta bắt đầu ngay thôi.', hanViet: 'Khai thủy' },
  ]
};

// Mock Shuffle Game data removed since we are fetching from DB

const mockQuizTopics = [
  { id: 'q1', title: 'City', description: 'Các từ vựng trong chủ đề City', count: 52, icon: 'Building2' },
  { id: 'q2', title: 'Countryside', description: 'Các từ vựng trong chủ đề Countryside', count: 51, icon: 'Trees' },
  { id: 'q3', title: 'Education', description: 'Các từ vựng trong chủ đề Education', count: 51, icon: 'GraduationCap' },
  { id: 'q4', title: 'Environment', description: 'Các từ vựng trong chủ đề Environment', count: 45, icon: 'Leaf' },
  { id: 'q5', title: 'Health', description: 'Các từ vựng trong chủ đề Health', count: 30, icon: 'HeartPulse' },
  { id: 'q6', title: 'Hobby', description: 'Các từ vựng trong chủ đề Hobby', count: 25, icon: 'Gamepad2' },
];

const mockQuizzes: Record<string, any[]> = {
  'q1': [
    {
      id: 'qz1',
      context: '城市保护其文化遗产。',
      question: "“遗产”是什么意思？",
      options: ['Du lịch', 'Di sản', 'Văn phòng', 'Kinh tế'],
      correctAnswer: 'Di sản'
    },
    {
      id: 'qz2',
      context: '她是一个非常有才华的音乐家。',
      question: "“才华”是什么意思？",
      options: ['Tài năng', 'Chăm chỉ', 'Nổi tiếng', 'Giàu có'],
      correctAnswer: 'Tài năng'
    },
  ]
};

// API Simulation
export const api = {
  getUser: () => new Promise((resolve) => setTimeout(() => resolve({ data: mockUser }), 500)),
  getProfile: () => new Promise((resolve) => {
    const profileWithLink = JSON.parse(JSON.stringify(mockProfile));
    // Update links
    profileWithLink.sections[0].items[0].link = '/basic-chinese';

    // Shuffle Game
    profileWithLink.sections[1].items[0].title = 'Sắp xếp câu';
    profileWithLink.sections[1].items[0].description = 'Luyện tập cấu trúc câu tiếng Trung';
    profileWithLink.sections[1].items[0].icon = 'Gamepad2';
    profileWithLink.sections[1].items[0].link = '/shuffle';

    // Flashcards
    profileWithLink.sections[1].items[1].link = '/flashcards';

    // Add Quiz Minigame
    profileWithLink.sections[1].items.push({
      id: 'i6',
      title: 'Minigame: Quiz',
      description: 'Thử thách kiến thức tiếng Trung',
      icon: 'Brain',
      link: '/quiz'
    });

    setTimeout(() => resolve({ data: profileWithLink }), 800);
  }),
  getPosts: () => new Promise((resolve) => setTimeout(() => resolve({ data: mockPosts }), 600)),
  getDecks: async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const res = await axios.get('${API_URL}/user/decks', {
          headers: { Authorization: `Bearer ${token}` }
        });
        return res;
      } catch (err) {
        return axios.get('/api/decks');
      }
    }
    return axios.get('/api/decks');
  },
  getDeckById: (id: string) => axios.get(`/api/decks/${id}`),
  getWordsByDeckId: (id: string) => axios.get(`/api/decks/${id}/words`),
  getShuffleTopics: () => axios.get('${API_URL}/shuffle-topics'),
  getUserShuffleTopics: async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const res = await axios.get('${API_URL}/user/shuffle-topics', {
          headers: { Authorization: `Bearer ${token}` }
        });
        return res;
      } catch (err) {
        return axios.get('${API_URL}/shuffle-topics');
      }
    }
    return axios.get('${API_URL}/shuffle-topics');
  },
  markShuffleSentenceCompleted: async (topicId: string, sentenceId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    return axios.post('${API_URL}/user/shuffle-progress', { topicId, sentenceId }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  resetShuffleProgress: async (topicId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    return axios.delete(`${API_URL}/user/shuffle-progress/${topicId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  getUncompletedSentencesByTopicId: async (id: string) => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        return await axios.get(`${API_URL}/user/shuffle-topics/${id}/sentences/uncompleted`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        return axios.get(`${API_URL}/shuffle-topics/${id}/sentences`);
      }
    }
    return axios.get(`${API_URL}/shuffle-topics/${id}/sentences`);
  },
  getSentencesByTopicId: (id: string) => axios.get(`${API_URL}/shuffle-topics/${id}/sentences`),
  getQuizTopics: () => new Promise((resolve) => setTimeout(() => resolve({ data: mockQuizTopics }), 500)),
  getQuizzesByTopicId: (id: string) => new Promise((resolve) => {
    setTimeout(() => resolve({ data: mockQuizzes[id] || [] }), 400);
  }),
  getNotifications: async () => {
    const token = localStorage.getItem('token');
    if (token) {
      return axios.get('${API_URL}/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
    }
    return { data: [] };
  },
  createNotification: async (message: string) => {
    const token = localStorage.getItem('token');
    return axios.post('${API_URL}/admin/notifications', { message }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  updateNotification: async (id: string, message: string) => {
    const token = localStorage.getItem('token');
    return axios.put(`${API_URL}/admin/notifications/${id}`, { message }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  deleteNotification: async (id: string) => {
    const token = localStorage.getItem('token');
    return axios.delete(`${API_URL}/admin/notifications/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  reactToNotification: async (id: string, reactionType: string | null) => {
    const token = localStorage.getItem('token');
    return axios.post(`${API_URL}/notifications/${id}/react`, { reactionType }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Admin - Shuffle Game
  getAdminShuffleSentences: async () => {
    const token = localStorage.getItem('token');
    return axios.get('${API_URL}/admin/shuffle-sentences', {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  createShuffleTopic: async (data: any) => {
    const token = localStorage.getItem('token');
    return axios.post('${API_URL}/admin/shuffle-topics', data, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  updateShuffleTopic: async (id: string, data: any) => {
    const token = localStorage.getItem('token');
    return axios.put(`${API_URL}/admin/shuffle-topics/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  deleteShuffleTopic: async (id: string) => {
    const token = localStorage.getItem('token');
    return axios.delete(`${API_URL}/admin/shuffle-topics/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  createShuffleSentence: async (data: any) => {
    const token = localStorage.getItem('token');
    return axios.post('${API_URL}/admin/shuffle-sentences', data, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  updateShuffleSentence: async (id: string, data: any) => {
    const token = localStorage.getItem('token');
    return axios.put(`${API_URL}/admin/shuffle-sentences/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  deleteShuffleSentence: async (id: string) => {
    const token = localStorage.getItem('token');
    return axios.delete(`${API_URL}/admin/shuffle-sentences/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
};

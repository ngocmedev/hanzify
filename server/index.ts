import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from './db.js';

const app = express();
const port = process.env.PORT || 3002;
const JWT_SECRET = 'flazi-secret-key-for-auth';

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Auth - Register
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Thiếu thông tin đăng ký (username, email, password)' });
  }

  try {
    const { rows } = await db.execute({ sql: 'SELECT * FROM users WHERE username = ? OR email = ?', args: [username, email] });
    if (rows.length > 0) {
      return res.status(400).json({ error: 'Tên đăng nhập hoặc email đã tồn tại' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const id = crypto.randomUUID();
    
    await db.execute({ sql: 'INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)', args: [id, username, email, hashedPassword] });

    res.status(201).json({ message: 'Đăng ký thành công' });
  } catch (err: any) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Auth - Login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Thiếu username hoặc password' });
  }

  try {
    const { rows } = await db.execute({ sql: 'SELECT * FROM users WHERE username = ?', args: [username] });
    const user = rows[0] as any;
    if (!user) {
      return res.status(400).json({ error: 'Tài khoản hoặc mật khẩu không đúng' });
    }

    const isMatch = bcrypt.compareSync(password, user.password as string);
    if (!isMatch) {
      return res.status(400).json({ error: 'Tài khoản hoặc mật khẩu không đúng' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ message: 'Đăng nhập thành công', token, username: user.username, id: user.id, role: user.role });
  } catch (err: any) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Middleware to verify token (optional but good practice)
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });
    req.user = user;
    next();
  });
};

const isAdmin = (req: any, res: any, next: any) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Require Admin Role' });
  }
};

// Admin - Users
app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { rows: users } = await db.execute('SELECT id, username, email, role FROM users');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.delete('/api/admin/users/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    await db.execute({ sql: 'DELETE FROM users WHERE id = ?', args: [req.params.id] });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.put('/api/admin/users/:id', authenticateToken, isAdmin, async (req, res) => {
  const { role, email } = req.body;
  try {
    await db.execute({ sql: 'UPDATE users SET role = ?, email = ? WHERE id = ?', args: [role || 'user', email, req.params.id] });
    res.json({ message: 'User updated' });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Notifications
app.post('/api/admin/notifications', authenticateToken, isAdmin, async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Nội dung thông báo không được để trống' });
  }
  try {
    const id = crypto.randomUUID();
    await db.execute({ sql: 'INSERT INTO notifications (id, message) VALUES (?, ?)', args: [id, message] });
    res.status(201).json({ message: 'Đã tạo thông báo thành công' });
  } catch (err: any) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

app.get('/api/notifications', authenticateToken, async (req, res) => {
  const userId = (req as any).user.id;
  try {
    const { rows: notifications } = await db.execute({ sql: `
      SELECT n.*,
             (SELECT reactionType FROM notification_reactions WHERE notificationId = n.id AND userId = ?) as userReaction,
             (SELECT COUNT(*) FROM notification_reactions WHERE notificationId = n.id) as totalReactions
      FROM notifications n 
      ORDER BY n.createdAt DESC
    `, args: [userId] });

    const { rows: reactionsBreakdown } = await db.execute('SELECT notificationId, reactionType, COUNT(*) as count FROM notification_reactions GROUP BY notificationId, reactionType');
    
    const enrichedNotifications = notifications.map((n: any) => {
      const breakdown: Record<string, number> = {};
      reactionsBreakdown.filter((r: any) => r.notificationId === n.id).forEach((r: any) => {
        breakdown[r.reactionType] = r.count as number;
      });
      return {
        ...n,
        reactionCounts: breakdown
      };
    });

    res.json(enrichedNotifications);
  } catch (err: any) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

app.post('/api/notifications/:id/react', authenticateToken, async (req, res) => {
  const userId = (req as any).user.id;
  const notificationId = req.params.id;
  const { reactionType } = req.body;

  try {
    if (!reactionType) {
      await db.execute({ sql: 'DELETE FROM notification_reactions WHERE userId = ? AND notificationId = ?', args: [userId, notificationId] });
      return res.json({ message: 'Reaction removed' });
    }

    await db.execute({ sql: `
      INSERT INTO notification_reactions (userId, notificationId, reactionType) 
      VALUES (?, ?, ?)
      ON CONFLICT(userId, notificationId) DO UPDATE SET reactionType = excluded.reactionType
    `, args: [userId, notificationId, reactionType] });
    
    res.json({ message: 'Reaction updated' });
  } catch (err: any) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

app.put('/api/admin/notifications/:id', authenticateToken, isAdmin, async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Nội dung thông báo không được để trống' });
  }
  try {
    await db.execute({ sql: 'UPDATE notifications SET message = ? WHERE id = ?', args: [message, req.params.id] });
    res.json({ message: 'Đã cập nhật thông báo' });
  } catch (err: any) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

app.delete('/api/admin/notifications/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    await db.execute({ sql: 'DELETE FROM notifications WHERE id = ?', args: [req.params.id] });
    res.json({ message: 'Đã xóa thông báo' });
  } catch (err: any) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Admin - Decks (Create/Update/Delete)
app.post('/api/admin/decks', authenticateToken, isAdmin, async (req, res) => {
  const { id, level, description, count } = req.body;
  try {
    await db.execute({ sql: 'INSERT INTO decks (id, level, description, count) VALUES (?, ?, ?, ?)', args: [id, level, description, count] });
    res.status(201).json({ message: 'Deck created' });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.put('/api/admin/decks/:id', authenticateToken, isAdmin, async (req, res) => {
  const { level, description, count } = req.body;
  try {
    await db.execute({ sql: 'UPDATE decks SET level = ?, description = ?, count = ? WHERE id = ?', args: [level, description, count, req.params.id] });
    res.json({ message: 'Deck updated' });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.delete('/api/admin/decks/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    await db.execute({ sql: 'DELETE FROM words WHERE deckId = ?', args: [req.params.id] });
    await db.execute({ sql: 'DELETE FROM decks WHERE id = ?', args: [req.params.id] });
    res.json({ message: 'Deck and associated words deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Admin - Words (Create/Update/Delete)
app.get('/api/admin/words', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { rows: words } = await db.execute(`
      SELECT w.*, d.level as deckLevel 
      FROM words w
      LEFT JOIN decks d ON w.deckId = d.id
    `);
    res.json(words);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/admin/words', authenticateToken, isAdmin, async (req, res) => {
  const { id, deckId, word, pinyin, meaning, example, hanViet } = req.body;
  try {
    await db.execute({ sql: 'INSERT INTO words (id, deckId, word, pinyin, meaning, example, hanViet) VALUES (?, ?, ?, ?, ?, ?, ?)', args: [id, deckId, word, pinyin, meaning, example, hanViet] });
    res.status(201).json({ message: 'Word created' });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/admin/words/batch', authenticateToken, isAdmin, async (req, res) => {
  const words = req.body; // Expecting an array of words
  if (!Array.isArray(words) || words.length === 0) {
    return res.status(400).json({ error: 'Invalid data' });
  }

  try {
    // Basic implementation: looping inserts. Since better-sqlite3 handles transactions, this is fine or we can just loop.
    for (const w of words) {
      const { id, deckId, word, pinyin, meaning, example, hanViet } = w;
      await db.execute({ sql: 'INSERT INTO words (id, deckId, word, pinyin, meaning, example, hanViet) VALUES (?, ?, ?, ?, ?, ?, ?)', args: [id, deckId, word, pinyin, meaning, example, hanViet] });
    }
    res.status(201).json({ message: `Successfully imported ${words.length} words` });
  } catch (err) {
    res.status(500).json({ error: 'Database error during batch import' });
  }
});

app.put('/api/admin/words/:id', authenticateToken, isAdmin, async (req, res) => {
  const { word, pinyin, meaning, example, hanViet } = req.body;
  try {
    await db.execute({ sql: 'UPDATE words SET word = ?, pinyin = ?, meaning = ?, example = ?, hanViet = ? WHERE id = ?', args: [word, pinyin, meaning, example, hanViet, req.params.id] });
    res.json({ message: 'Word updated' });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/admin/words/batch-delete', authenticateToken, isAdmin, async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Invalid data' });
  }
  try {
    const placeholders = ids.map(() => '?').join(',');
    await db.execute({ sql: `DELETE FROM words WHERE id IN (${placeholders})`, args: ids });
    res.json({ message: 'Words deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.delete('/api/admin/words/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    await db.execute({ sql: 'DELETE FROM words WHERE id = ?', args: [req.params.id] });
    res.json({ message: 'Word deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Update/Create user progress
app.post('/api/progress', authenticateToken, async (req, res) => {
  const { wordId, status } = req.body;
  const userId = (req as any).user.id;

  if (!wordId || !status) {
    return res.status(400).json({ error: 'Missing wordId or status' });
  }

  try {
    await db.execute({ sql: `
      INSERT INTO user_progress (userId, wordId, status, updatedAt) 
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(userId, wordId) DO UPDATE SET 
      status = excluded.status, 
      updatedAt = CURRENT_TIMESTAMP
    `, args: [userId, wordId, status] });
    
    res.json({ message: 'Progress updated' });
  } catch (err: any) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Get progress summary
app.get('/api/progress/summary', authenticateToken, async (req, res) => {
  const userId = (req as any).user.id;

  try {
    const { rows: summary } = await db.execute({ sql: `
      SELECT status, COUNT(*) as count 
      FROM user_progress 
      WHERE userId = ? 
      GROUP BY status
    `, args: [userId] });

    const { rows: starredRows } = await db.execute({ sql: `
      SELECT COUNT(*) as count FROM user_progress WHERE userId = ? AND isStarred = 1
    `, args: [userId] });
    const starredCount = starredRows[0] as any;

    const { rows: totalWordRows } = await db.execute(`SELECT COUNT(*) as count FROM words`);
    const totalWordCount = totalWordRows[0] as any;
    
    // Map summary to a more convenient object
    const result = {
      learnedCount: summary.find((s: any) => s.status === 'learned')?.count || 0,
      urgentCount: summary.find((s: any) => s.status === 'urgent')?.count || 0,
      notLearnedCount: summary.find((s: any) => s.status === 'not_learned')?.count || 0,
      starredCount: starredCount?.count || 0,
      totalWords: totalWordCount?.count || 0
    };

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Toggle star status
app.post('/api/progress/toggle-star', authenticateToken, async (req, res) => {
  const { wordId } = req.body;
  const userId = (req as any).user.id;

  if (!wordId) return res.status(400).json({ error: 'Missing wordId' });

  try {
    const { rows } = await db.execute({ sql: 'SELECT isStarred FROM user_progress WHERE userId = ? AND wordId = ?', args: [userId, wordId] });
    const existing = rows[0] as any;

    if (existing) {
      const newStatus = existing.isStarred ? 0 : 1;
      await db.execute({ sql: 'UPDATE user_progress SET isStarred = ? WHERE userId = ? AND wordId = ?', args: [newStatus, userId, wordId] });
      res.json({ isStarred: !!newStatus });
    } else {
      await db.execute({ sql: 'INSERT INTO user_progress (userId, wordId, isStarred, status) VALUES (?, ?, 1, NULL)', args: [userId, wordId] });
      res.json({ isStarred: true });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Get all decks
app.get('/api/decks', async (req, res) => {
  try {
    const { rows: decks } = await db.execute('SELECT * FROM decks');
    res.json(decks);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Get decks with user progress (Private)
app.get('/api/user/decks', authenticateToken, async (req, res) => {
  const userId = (req as any).user.id;
  try {
    const { rows: decks } = await db.execute({ sql: `
      SELECT d.*, 
             (SELECT COUNT(*) FROM words WHERE deckId = d.id) as totalWords,
             (SELECT COUNT(*) FROM user_progress p JOIN words w ON p.wordId = w.id WHERE w.deckId = d.id AND p.userId = ? AND p.status = 'learned') as learnedWords,
             (SELECT COUNT(*) FROM user_progress p JOIN words w ON p.wordId = w.id WHERE w.deckId = d.id AND p.userId = ? AND p.status = 'not_learned') as notLearnedWords,
             (SELECT COUNT(*) FROM user_progress p JOIN words w ON p.wordId = w.id WHERE w.deckId = d.id AND p.userId = ? AND p.status = 'urgent') as urgentWords
      FROM decks d
    `, args: [userId, userId, userId] });
    res.json(decks);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: (err as Error).message });
  }
});

// Get deck by id
app.get('/api/decks/:id', async (req, res) => {
  try {
    const { rows } = await db.execute({ sql: 'SELECT * FROM decks WHERE id = ?', args: [req.params.id] });
    const deck = rows[0];
    if (!deck) {
      return res.status(404).json({ error: 'Deck not found' });
    }
    res.json(deck);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Get words by deck id (Public)
app.get('/api/decks/:id/words', async (req, res) => {
  try {
    const { rows: words } = await db.execute({ sql: 'SELECT * FROM words WHERE deckId = ?', args: [req.params.id] });
    res.json(words);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Get words with user progress (Private)
app.get('/api/user/decks/:id/words', authenticateToken, async (req, res) => {
  const userId = (req as any).user.id;
  const deckId = req.params.id;

  try {
    const { rows: words } = await db.execute({ sql: `
      SELECT w.*, p.status, p.isStarred 
      FROM words w
      LEFT JOIN user_progress p ON w.id = p.wordId AND p.userId = ?
      WHERE w.deckId = ?
    `, args: [userId, deckId] });
    res.json(words);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: (err as Error).message });
  }
});

// Get starred words (Private)
app.get('/api/user/words/starred', authenticateToken, async (req, res) => {
  const userId = (req as any).user.id;
  try {
    const { rows: words } = await db.execute({ sql: `
      SELECT w.*, p.status, p.isStarred 
      FROM words w
      JOIN user_progress p ON w.id = p.wordId AND p.userId = ?
      WHERE p.isStarred = 1
    `, args: [userId] });
    res.json(words);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: (err as Error).message });
  }
});

// Get unlearned words (Private)
app.get('/api/user/words/unlearned', authenticateToken, async (req, res) => {
  const userId = (req as any).user.id;
  try {
    const { rows: words } = await db.execute({ sql: `
      SELECT w.*, p.status as status, COALESCE(p.isStarred, 0) as isStarred 
      FROM words w
      JOIN user_progress p ON w.id = p.wordId AND p.userId = ?
      WHERE p.status = 'not_learned' OR p.status = 'urgent'
    `, args: [userId] });
    res.json(words);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: (err as Error).message });
  }
});

// Shuffle Game - User Progress
app.get('/api/user/shuffle-topics', authenticateToken, async (req, res) => {
  const userId = (req as any).user.id;
  try {
    const { rows: topics } = await db.execute({ sql: `
      SELECT t.*, 
             (SELECT COUNT(*) FROM shuffle_sentences WHERE topicId = t.id) as totalSentences,
             (SELECT COUNT(*) FROM shuffle_progress p WHERE p.topicId = t.id AND p.userId = ?) as completedSentences
      FROM shuffle_topics t
    `, args: [userId] });
    res.json(topics);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: (err as Error).message });
  }
});

app.post('/api/user/shuffle-progress', authenticateToken, async (req, res) => {
  const userId = (req as any).user.id;
  const { topicId, sentenceId } = req.body;
  if (!topicId || !sentenceId) return res.status(400).json({ error: 'Missing topicId or sentenceId' });

  try {
    await db.execute({ sql: `
      INSERT INTO shuffle_progress (userId, topicId, sentenceId) 
      VALUES (?, ?, ?)
      ON CONFLICT(userId, sentenceId) DO UPDATE SET createdAt = CURRENT_TIMESTAMP
    `, args: [userId, topicId, sentenceId] });
    res.json({ message: 'Progress saved' });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: (err as Error).message });
  }
});

app.delete('/api/user/shuffle-progress/:topicId', authenticateToken, async (req, res) => {
  const userId = (req as any).user.id;
  try {
    await db.execute({ sql: 'DELETE FROM shuffle_progress WHERE userId = ? AND topicId = ?', args: [userId, req.params.topicId] });
    res.json({ message: 'Progress reset' });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: (err as Error).message });
  }
});

app.get('/api/user/shuffle-topics/:id/sentences/uncompleted', authenticateToken, async (req, res) => {
  const userId = (req as any).user.id;
  try {
    const { rows: sentences } = await db.execute({ sql: `
      SELECT s.* 
      FROM shuffle_sentences s
      WHERE s.topicId = ? 
      AND s.id NOT IN (
        SELECT sentenceId FROM shuffle_progress WHERE userId = ? AND topicId = ?
      )
    `, args: [req.params.id, userId, req.params.id] });
    
    const parsedSentences = sentences.map(s => ({
      ...s,
      chinese: typeof s.chinese === 'string' ? JSON.parse(s.chinese as string) : s.chinese,
      pinyin: typeof s.pinyin === 'string' ? JSON.parse(s.pinyin as string) : (s.pinyin || []),
      correctOrder: typeof s.correctOrder === 'string' ? JSON.parse(s.correctOrder as string) : s.correctOrder
    }));
    res.json(parsedSentences);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: (err as Error).message });
  }
});

// Shuffle Game - Public
app.get('/api/shuffle-topics', async (req, res) => {
  try {
    const { rows: topics } = await db.execute('SELECT * FROM shuffle_topics');
    res.json(topics);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/shuffle-topics/:id/sentences', async (req, res) => {
  try {
    const { rows: sentences } = await db.execute({ sql: 'SELECT * FROM shuffle_sentences WHERE topicId = ?', args: [req.params.id] });
    // Parse JSON strings back to objects
    const parsedSentences = sentences.map(s => ({
      ...s,
      chinese: typeof s.chinese === 'string' ? JSON.parse(s.chinese as string) : s.chinese,
      pinyin: typeof s.pinyin === 'string' ? JSON.parse(s.pinyin as string) : (s.pinyin || []),
      correctOrder: typeof s.correctOrder === 'string' ? JSON.parse(s.correctOrder as string) : s.correctOrder
    }));
    res.json(parsedSentences);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Admin - Shuffle Topics
app.post('/api/admin/shuffle-topics', authenticateToken, isAdmin, async (req, res) => {
  const { id, title, description, count, icon } = req.body;
  try {
    await db.execute({ sql: 'INSERT INTO shuffle_topics (id, title, description, count, icon) VALUES (?, ?, ?, ?, ?)', args: [id, title, description, count || 0, icon] });
    res.status(201).json({ message: 'Topic created' });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.put('/api/admin/shuffle-topics/:id', authenticateToken, isAdmin, async (req, res) => {
  const { title, description, count, icon } = req.body;
  try {
    await db.execute({ sql: 'UPDATE shuffle_topics SET title = ?, description = ?, count = ?, icon = ? WHERE id = ?', args: [title, description, count, icon, req.params.id] });
    res.json({ message: 'Topic updated' });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.delete('/api/admin/shuffle-topics/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    await db.execute({ sql: 'DELETE FROM shuffle_sentences WHERE topicId = ?', args: [req.params.id] });
    await db.execute({ sql: 'DELETE FROM shuffle_topics WHERE id = ?', args: [req.params.id] });
    res.json({ message: 'Topic deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Admin - Shuffle Sentences
app.get('/api/admin/shuffle-sentences', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { rows: sentences } = await db.execute(`
      SELECT s.*, t.title as topicTitle 
      FROM shuffle_sentences s
      LEFT JOIN shuffle_topics t ON s.topicId = t.id
    `);
    const parsedSentences = sentences.map(s => ({
      ...s,
      chinese: typeof s.chinese === 'string' ? JSON.parse(s.chinese as string) : s.chinese,
      pinyin: typeof s.pinyin === 'string' ? JSON.parse(s.pinyin as string) : (s.pinyin || []),
      correctOrder: typeof s.correctOrder === 'string' ? JSON.parse(s.correctOrder as string) : s.correctOrder
    }));
    res.json(parsedSentences);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/admin/shuffle-sentences', authenticateToken, isAdmin, async (req, res) => {
  const { id, topicId, vietnamese, chinese, pinyin, correctOrder } = req.body;
  try {
    await db.execute({ 
      sql: 'INSERT INTO shuffle_sentences (id, topicId, vietnamese, chinese, pinyin, correctOrder) VALUES (?, ?, ?, ?, ?, ?)', 
      args: [id, topicId, vietnamese, JSON.stringify(chinese), JSON.stringify(pinyin || []), JSON.stringify(correctOrder)] 
    });
    res.status(201).json({ message: 'Sentence created' });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/admin/shuffle-sentences/batch', authenticateToken, isAdmin, async (req, res) => {
  const sentences = req.body;
  if (!Array.isArray(sentences)) {
    return res.status(400).json({ error: 'Expected an array of sentences' });
  }

  try {
    // In libSQL, we should execute batch operations or loop with execute
    // We will do a loop of executes
    for (const s of sentences) {
      await db.execute({
        sql: 'INSERT INTO shuffle_sentences (id, topicId, vietnamese, chinese, pinyin, correctOrder) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET topicId=excluded.topicId, vietnamese=excluded.vietnamese, chinese=excluded.chinese, pinyin=excluded.pinyin, correctOrder=excluded.correctOrder',
        args: [
          s.id, 
          s.topicId, 
          s.vietnamese, 
          JSON.stringify(s.chinese), 
          JSON.stringify(s.pinyin || []), 
          JSON.stringify(s.correctOrder)
        ]
      });
    }
    res.status(201).json({ message: `Successfully imported ${sentences.length} sentences` });
  } catch (err) {
    console.error('Batch insert error:', err);
    res.status(500).json({ error: 'Database error during batch insert' });
  }
});

app.post('/api/admin/shuffle-sentences/batch-delete', authenticateToken, isAdmin, async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Invalid data' });
  }
  try {
    const placeholders = ids.map(() => '?').join(',');
    await db.execute({ sql: `DELETE FROM shuffle_sentences WHERE id IN (${placeholders})`, args: ids });
    res.json({ message: 'Sentences deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.put('/api/admin/shuffle-sentences/:id', authenticateToken, isAdmin, async (req, res) => {
  const { vietnamese, chinese, pinyin, correctOrder, topicId } = req.body;
  try {
    await db.execute({ 
      sql: 'UPDATE shuffle_sentences SET vietnamese = ?, chinese = ?, pinyin = ?, correctOrder = ?, topicId = ? WHERE id = ?', 
      args: [vietnamese, JSON.stringify(chinese), JSON.stringify(pinyin || []), JSON.stringify(correctOrder), topicId, req.params.id] 
    });
    res.json({ message: 'Sentence updated' });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.delete('/api/admin/shuffle-sentences/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    await db.execute({ sql: 'DELETE FROM shuffle_sentences WHERE id = ?', args: [req.params.id] });
    res.json({ message: 'Sentence deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});

// Trigger restart

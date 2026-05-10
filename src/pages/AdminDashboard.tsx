import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, Layers, BookOpen, Plus, Edit, Trash2, ChevronRight,
  Search, AlertTriangle, X, Save, ArrowLeft, Loader2, Bell, UploadCloud, Gamepad2
} from 'lucide-react';
import { getLoggedInUserRole } from '../services/auth';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import * as xlsx from 'xlsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'users' | 'decks' | 'words' | 'notifications' | 'shuffle'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [decks, setDecks] = useState<any[]>([]);
  const [words, setWords] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);

  const [shuffleTopics, setShuffleTopics] = useState<any[]>([]);
  const [shuffleSentences, setShuffleSentences] = useState<any[]>([]);
  const [selectedShuffleTopicId, setSelectedShuffleTopicId] = useState<string | null>(null);
  const [selectedShuffleSentenceIds, setSelectedShuffleSentenceIds] = useState<string[]>([]);

  const [wordSearchQuery, setWordSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedWordIds, setSelectedWordIds] = useState<string[]>([]);
  const ITEMS_PER_PAGE = 20;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [importProgress, setImportProgress] = useState<number | null>(null);
  const navigate = useNavigate();

  const [notificationMessage, setNotificationMessage] = useState('');
  const [editingNotification, setEditingNotification] = useState<any>(null);

  // Modals
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [editingDeck, setEditingDeck] = useState<any>(null);
  const [deckForm, setDeckForm] = useState({ id: '', level: '', description: '', count: 0 });

  const [showWordModal, setShowWordModal] = useState(false);
  const [editingWord, setEditingWord] = useState<any>(null);
  const [wordForm, setWordForm] = useState({ id: '', deckId: '', word: '', pinyin: '', meaning: '', example: '', hanViet: '' });

  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userForm, setUserForm] = useState({ id: '', email: '', role: 'user' });

  // Shuffle Modals
  const [showShuffleTopicModal, setShowShuffleTopicModal] = useState(false);
  const [editingShuffleTopic, setEditingShuffleTopic] = useState<any>(null);
  const [shuffleTopicForm, setShuffleTopicForm] = useState({ id: '', title: '', description: '', count: 0, icon: 'Gamepad2' });

  const [showShuffleSentenceModal, setShowShuffleSentenceModal] = useState(false);
  const [editingShuffleSentence, setEditingShuffleSentence] = useState<any>(null);
  const [shuffleSentenceForm, setShuffleSentenceForm] = useState({ id: '', topicId: '', vietnamese: '', chinese: '', correctOrder: '' });

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  });

  useEffect(() => {
    const checkRole = () => {
      if (getLoggedInUserRole() !== 'admin') {
        navigate('/');
      }
    };

    checkRole();
    window.addEventListener('auth_change', checkRole);

    // Fetch decks regardless of active tab so the dropdown works
    if (getLoggedInUserRole() === 'admin') {
      fetch(`${API_URL}/decks`, { headers: getHeaders() })
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setDecks(data); })
        .catch(() => { });

      fetchData();
    }

    return () => window.removeEventListener('auth_change', checkRole);
  }, [activeTab, selectedDeckId, navigate]);

  async function fetchData() {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const res = await fetch(`${API_URL}/admin/users`, { headers: getHeaders() });
        const data = await res.json();
        if (res.ok) setUsers(data);
        else throw new Error(data.error || 'Lỗi');
      } else if (activeTab === 'decks') {
        const res = await fetch(`${API_URL}/decks`, { headers: getHeaders() });
        const data = await res.json();
        if (res.ok) setDecks(data);
        else throw new Error(data.error || 'Lỗi');
      } else if (activeTab === 'words') {
        const url = selectedDeckId ? `${API_URL}/decks/${selectedDeckId}/words` : `${API_URL}/admin/words`;
        const res = await fetch(url, { headers: getHeaders() });
        const data = await res.json();
        if (res.ok) setWords(data);
        else throw new Error(data.error || 'Lỗi');
      } else if (activeTab === 'notifications') {
        const res = await fetch(`${API_URL}/notifications`, { headers: getHeaders() });
        const data = await res.json();
        if (res.ok) setNotifications(data);
        else throw new Error(data.error || 'Lỗi');
      } else if (activeTab === 'shuffle') {
        const resT = await fetch(`${API_URL}/shuffle-topics`, { headers: getHeaders() });
        const dataT = await resT.json();
        if (resT.ok) setShuffleTopics(dataT);

        const resS = await fetch(`${API_URL}/admin/shuffle-sentences`, { headers: getHeaders() });
        const dataS = await resS.json();
        if (resS.ok) setShuffleSentences(dataS);
      }
    } catch (err) {
      setError('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa người dùng này?')) return;
    try {
      await fetch(`${API_URL}/admin/users/${id}`, { method: 'DELETE', headers: getHeaders() });
      setUsers(users.filter(u => u.id !== id));
    } catch (err) {
      alert('Lỗi khi xóa người dùng');
    }
  };

  const handleSaveUser = async () => {
    try {
      await fetch(`${API_URL}/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(userForm)
      });
      setShowUserModal(false);
      fetchData();
    } catch (err) {
      alert('Lỗi khi lưu người dùng');
    }
  };

  const handleSendNotification = async () => {
    if (!notificationMessage.trim()) return alert('Vui lòng nhập nội dung thông báo');
    try {
      const isEdit = !!editingNotification;
      const url = isEdit ? `${API_URL}/admin/notifications/${editingNotification.id}` : `${API_URL}/admin/notifications`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify({ message: notificationMessage })
      });
      if (!res.ok) throw new Error('Failed to save');
      alert(isEdit ? 'Đã cập nhật thông báo thành công' : 'Đã gửi thông báo thành công');
      setNotificationMessage('');
      setEditingNotification(null);
      fetchData();
    } catch (err) {
      alert('Lỗi khi lưu thông báo');
    }
  };

  const handleDeleteNotification = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa thông báo này?')) return;
    try {
      await fetch(`${API_URL}/admin/notifications/${id}`, { method: 'DELETE', headers: getHeaders() });
      fetchData();
    } catch (err) {
      alert('Lỗi khi xóa thông báo');
    }
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedDeckId) {
      alert('Vui lòng chọn một Bộ từ vựng cụ thể để import từ vào bộ đó!');
      e.target.value = '';
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = xlsx.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const rows = xlsx.utils.sheet_to_json(sheet);
          
          const wordsToImport = rows.map((row: any, index: number) => ({
            id: `w${selectedDeckId}_${Date.now()}_${index}`,
            deckId: selectedDeckId,
            word: row['Từ vựng'] || '',
            pinyin: row['Phiên âm'] || '',
            meaning: row['Nghĩa tiếng Việt'] || '',
            example: row['Ví dụ'] || '',
            hanViet: row['Hán Việt'] || ''
          })).filter((w: any) => w.word);

          if (wordsToImport.length === 0) {
            alert('Không tìm thấy dữ liệu từ vựng hợp lệ trong file!');
            setLoading(false);
            return;
          }

          setImportProgress(0);
          const BATCH_SIZE = 50;
          let successCount = 0;
          let hasError = false;

          for (let i = 0; i < wordsToImport.length; i += BATCH_SIZE) {
            const batch = wordsToImport.slice(i, i + BATCH_SIZE);
            const res = await fetch(`${API_URL}/admin/words/batch`, {
              method: 'POST',
              headers: getHeaders(),
              body: JSON.stringify(batch)
            });

            if (!res.ok) {
              const contentType = res.headers.get("content-type");
              if (contentType && contentType.includes("application/json")) {
                const errData = await res.json();
                alert(`Lỗi ở bản ghi ${i}: ` + errData.error);
              } else {
                const text = await res.text();
                alert(`Lỗi máy chủ ở bản ghi ${i}: ` + text.substring(0, 100));
              }
              hasError = true;
              break;
            }

            successCount += batch.length;
            setImportProgress(Math.round((successCount / wordsToImport.length) * 100));
          }

          if (successCount > 0) {
            alert(`Đã import thành công ${successCount} từ vựng!`);
            fetchData();
          }
          
          setImportProgress(null);
          setLoading(false);
        } catch (err) {
          console.error("Excel import error:", err);
          alert(`Lỗi khi đọc file Excel: ${err instanceof Error ? err.message : String(err)}`);
          setLoading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error("FileReader error:", err);
      alert('Lỗi khi tải file Excel');
      setLoading(false);
    } finally {
      e.target.value = ''; // Reset input
    }
  };

  const handleExcelImportShuffle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedShuffleTopicId) {
      alert('Vui lòng chọn một Chủ đề Sắp xếp câu cụ thể để import!');
      e.target.value = '';
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = xlsx.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const rows = xlsx.utils.sheet_to_json(sheet);
          
          const sentencesToImport = rows.map((row: any, index: number) => {
            const keys = Object.keys(row);
            const getVal = (search: string) => {
              const key = keys.find(k => k.toLowerCase().includes(search.toLowerCase()));
              return key ? row[key] : '';
            };

            const vietnamese = getVal('NGHĨA TIẾNG VIỆT');
            const chineseRaw = getVal('TỪ TIẾNG TRUNG') || getVal('CÁC TỪ');
            const pinyinRaw = getVal('PINYIN');
            const correctOrderRaw = getVal('ĐÁP ÁN ĐÚNG');

            if (!vietnamese || !chineseRaw) return null;

            return {
              id: `s_${selectedShuffleTopicId}_${Date.now()}_${index}`,
              topicId: selectedShuffleTopicId,
              vietnamese: String(vietnamese).trim(),
              chinese: String(chineseRaw).split(',').map(s => s.trim()).filter(Boolean),
              pinyin: String(pinyinRaw).split(',').map(s => s.trim()).filter(Boolean),
              correctOrder: String(correctOrderRaw).split(',').map(s => s.trim()).filter(Boolean)
            };
          }).filter(Boolean);

          if (sentencesToImport.length === 0) {
            alert('Không tìm thấy dữ liệu câu hỏi hợp lệ trong file!');
            setLoading(false);
            return;
          }

          setImportProgress(0);
          const BATCH_SIZE = 50;
          let successCount = 0;
          let hasError = false;

          for (let i = 0; i < sentencesToImport.length; i += BATCH_SIZE) {
            const batch = sentencesToImport.slice(i, i + BATCH_SIZE);
            const res = await fetch(`${API_URL}/admin/shuffle-sentences/batch`, {
              method: 'POST',
              headers: getHeaders(),
              body: JSON.stringify(batch)
            });

            if (!res.ok) {
              const contentType = res.headers.get("content-type");
              if (contentType && contentType.includes("application/json")) {
                const errData = await res.json();
                alert(`Lỗi ở bản ghi ${i}: ` + errData.error);
              } else {
                const text = await res.text();
                alert(`Lỗi máy chủ ở bản ghi ${i}: ` + text.substring(0, 100));
              }
              hasError = true;
              break;
            }

            successCount += batch.length;
            setImportProgress(Math.round((successCount / sentencesToImport.length) * 100));
          }

          if (successCount > 0) {
            alert(`Đã import thành công ${successCount} câu hỏi!`);
            fetchData();
          }
          
          setImportProgress(null);
          setLoading(false);
        } catch (err) {
          console.error("Excel import error:", err);
          alert(`Lỗi khi đọc file Excel: ${err instanceof Error ? err.message : String(err)}`);
          setLoading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error("FileReader error:", err);
      alert('Lỗi khi tải file Excel');
      setLoading(false);
    } finally {
      e.target.value = ''; // Reset input
    }
  };

  // --- Decks Management ---
  const handleSaveDeck = async () => {
    try {
      const isEdit = !!editingDeck;
      const url = isEdit ? `${API_URL}/admin/decks/${editingDeck.id}` : `${API_URL}/admin/decks`;
      const method = isEdit ? 'PUT' : 'POST';

      await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(deckForm)
      });

      setShowDeckModal(false);
      fetchData();
    } catch (err) {
      alert('Lỗi khi lưu bộ từ vựng');
    }
  };

  const handleDeleteDeck = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa bộ từ vựng này và TOÀN BỘ từ vựng bên trong?')) return;
    try {
      await fetch(`${API_URL}/admin/decks/${id}`, { method: 'DELETE', headers: getHeaders() });
      fetchData();
    } catch (err) {
      alert('Lỗi khi xóa bộ từ vựng');
    }
  };

  // --- Words Management ---
  const handleSaveWord = async () => {
    try {
      const isEdit = !!editingWord;
      const url = isEdit ? `${API_URL}/admin/words/${editingWord.id}` : `${API_URL}/admin/words`;
      const method = isEdit ? 'PUT' : 'POST';

      await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(wordForm)
      });

      setShowWordModal(false);
      fetchData();
    } catch (err) {
      alert('Lỗi khi lưu từ vựng');
    }
  };

  const handleDeleteWord = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa từ này?')) return;
    try {
      await fetch(`${API_URL}/admin/words/${id}`, { method: 'DELETE', headers: getHeaders() });
      setSelectedWordIds(prev => prev.filter(wId => wId !== id));
      fetchData();
    } catch (err) {
      alert('Lỗi khi xóa từ vựng');
    }
  };

  const handleBulkDeleteWords = async () => {
    if (selectedWordIds.length === 0) return;
    if (!confirm(`Bạn có chắc muốn xóa ${selectedWordIds.length} từ đã chọn?`)) return;
    try {
      await fetch(`${API_URL}/admin/words/batch-delete`, { 
        method: 'POST', 
        headers: getHeaders(),
        body: JSON.stringify({ ids: selectedWordIds })
      });
      setSelectedWordIds([]);
      fetchData();
    } catch (err) {
      alert('Lỗi khi xóa hàng loạt từ vựng');
    }
  };

  const handleBulkDeleteShuffleSentences = async () => {
    if (selectedShuffleSentenceIds.length === 0) return;
    if (!confirm(`Bạn có chắc muốn xóa ${selectedShuffleSentenceIds.length} câu đã chọn?`)) return;
    try {
      await fetch(`${API_URL}/admin/shuffle-sentences/batch-delete`, { 
        method: 'POST', 
        headers: getHeaders(),
        body: JSON.stringify({ ids: selectedShuffleSentenceIds })
      });
      setSelectedShuffleSentenceIds([]);
      fetchData();
    } catch (err) {
      alert('Lỗi khi xóa hàng loạt câu hỏi');
    }
  };

  // --- Filtering & Pagination ---
  const safeWords = Array.isArray(words) ? words : [];
  const filteredWords = safeWords.filter(w => {
    const q = wordSearchQuery.toLowerCase();
    return (w.word && w.word.toLowerCase().includes(q)) ||
      (w.pinyin && w.pinyin.toLowerCase().includes(q)) ||
      (w.meaning && w.meaning.toLowerCase().includes(q));
  });
  const totalPages = Math.max(1, Math.ceil(filteredWords.length / ITEMS_PER_PAGE));
  const currentWords = filteredWords.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <Navbar />

      {importProgress !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-sm p-4">
          <div className="bg-white p-8 rounded-[2rem] shadow-2xl border border-brand-secondary/20 max-w-sm w-full text-center space-y-4">
            <h3 className="text-xl font-bold text-brand-text">Đang Import Dữ Liệu...</h3>
            <div className="w-full h-3 bg-brand-secondary/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand-accent transition-all duration-300"
                style={{ width: `${importProgress}%` }}
              />
            </div>
            <p className="text-brand-text/60 font-bold">{importProgress}% hoàn thành</p>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full space-y-8">
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-brand-accent font-bold uppercase tracking-widest text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
            Control Center
          </div>
          <h1 className="text-4xl font-bold text-brand-text">Quản trị hệ thống</h1>
          <p className="text-brand-text/50">Quản lý người dùng, nội dung và các thiết lập khác.</p>
        </header>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="md:w-64 space-y-2 flex-shrink-0">
            {[
              { id: 'users', label: 'Người dùng', icon: Users },
              { id: 'decks', label: 'Bộ từ vựng', icon: Layers },
              { id: 'words', label: 'Quản lý từ vựng', icon: BookOpen },
              { id: 'shuffle', label: 'Sắp xếp câu', icon: Gamepad2 },
              { id: 'notifications', label: 'Thông báo', icon: Bell },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (tab.id !== 'words') setSelectedDeckId(null);
                  setSelectedWordIds([]);
                  setSelectedShuffleSentenceIds([]);
                }}
                className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl transition-all font-bold text-sm ${activeTab === tab.id
                    ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20'
                    : 'text-brand-text/50 hover:bg-brand-secondary/20 hover:text-brand-text'
                  }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </aside>

          {/* Main Content */}
          <section className="flex-1 bg-white rounded-[2.5rem] border border-brand-secondary/30 p-8 shadow-sm min-h-[500px]">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-brand-accent animate-spin" />
              </div>
            ) : error ? (
              <div className="h-full flex flex-col items-center justify-center text-red-500 gap-4">
                <AlertTriangle className="w-12 h-12" />
                <p>{error}</p>
              </div>
            ) : (
              <>
                {/* TAB: USERS */}
                {activeTab === 'users' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-brand-text">Danh sách người dùng</h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-brand-secondary/20 text-brand-text/40 text-xs uppercase tracking-widest font-bold">
                            <th className="pb-4 px-4 font-bold">Người dùng</th>
                            <th className="pb-4 px-4 font-bold">Email</th>
                            <th className="pb-4 px-4 font-bold">Vai trò</th>
                            <th className="pb-4 px-4 font-bold text-right">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-secondary/10">
                          {Array.isArray(users) && users.map((user) => (
                            <tr key={user.id} className="group hover:bg-brand-secondary/5 transition-colors">
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-brand-accent/10 flex items-center justify-center text-brand-accent text-xs font-bold">
                                    {user.username.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="font-bold text-brand-text">{user.username}</span>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-sm text-brand-text/60">{user.email || 'N/A'}</td>
                              <td className="py-4 px-4">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${user.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                                  }`}>
                                  {user.role}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingUser(user);
                                      setUserForm({ id: user.id, email: user.email || '', role: user.role });
                                      setShowUserModal(true);
                                    }}
                                    className="p-2 text-brand-text/20 hover:text-brand-accent hover:bg-brand-accent/10 transition-all rounded-lg"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="p-2 text-brand-text/20 hover:text-red-500 hover:bg-red-50 transition-all rounded-lg"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB: DECKS */}
                {activeTab === 'decks' && (
                  <div className="space-y-6">
                    <div className="flex flex-wrap gap-4 items-center justify-between">
                      <h2 className="text-xl font-bold text-brand-text">Quản lý bộ từ vựng</h2>
                      <button
                        onClick={() => {
                          setEditingDeck(null);
                          setDeckForm({ id: '', level: '', description: '', count: 0 });
                          setShowDeckModal(true);
                        }}
                        className="flex items-center gap-2 bg-brand-accent text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-brand-accent/20 hover:bg-brand-accent/90 transition-all"
                      >
                        <Plus className="w-4 h-4" /> Thêm bộ từ
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Array.isArray(decks) && decks.map((deck) => (
                        <div key={deck.id} className="p-6 rounded-3xl border border-brand-secondary/20 hover:border-brand-accent/30 transition-all group relative">
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-2xl font-bold text-brand-accent">{deck.level}</span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  setEditingDeck(deck);
                                  setDeckForm(deck);
                                  setShowDeckModal(true);
                                }}
                                className="p-2 hover:bg-brand-secondary/20 rounded-lg text-brand-text/50 transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteDeck(deck.id)}
                                className="p-2 hover:bg-red-50 rounded-lg text-red-400 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-brand-text/50 mb-4">{deck.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-brand-text/40 bg-brand-secondary/20 px-2 py-1 rounded-md">{deck.count} từ vựng</span>
                            <button
                              onClick={() => {
                                setSelectedDeckId(deck.id);
                                setActiveTab('words');
                                setWordSearchQuery('');
                                setCurrentPage(1);
                                setSelectedWordIds([]);
                              }}
                              className="text-xs font-bold text-brand-accent hover:underline flex items-center"
                            >
                              Xem từ vựng <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB: WORDS */}
                {activeTab === 'words' && (
                  <div className="space-y-6">
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          {selectedDeckId && (
                            <button onClick={() => { setSelectedDeckId(null); setWordSearchQuery(''); setSelectedWordIds([]); }} className="p-2 hover:bg-brand-secondary/20 rounded-full transition-colors text-brand-text/50 hover:text-brand-text">
                              <ArrowLeft className="w-5 h-5" />
                            </button>
                          )}
                          <h2 className="text-xl font-bold text-brand-text">
                            {selectedDeckId ? `Từ vựng bộ: ${decks.find(d => d.id === selectedDeckId)?.level}` : 'Tất cả từ vựng'}
                          </h2>
                        </div>

                        <div className="flex items-center gap-4 w-full sm:w-auto">
                          <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text/40" />
                            <input
                              type="text"
                              placeholder="Tìm chữ Hán, Pinyin, Nghĩa..."
                              value={wordSearchQuery}
                              onChange={e => { setWordSearchQuery(e.target.value); setCurrentPage(1); setSelectedWordIds([]); }}
                              className="w-full pl-10 pr-4 py-2 bg-brand-secondary/10 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-accent/50"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <input type="file" accept=".xlsx, .xls" id="excel-upload" className="hidden" onChange={handleExcelImport} />
                            <button
                              onClick={() => {
                                if (!selectedDeckId) {
                                  alert('Vui lòng chọn một Bộ từ vựng trước khi import!');
                                  return;
                                }
                                document.getElementById('excel-upload')?.click()
                              }}
                              className="flex-shrink-0 flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-green-500/20 hover:bg-green-600 transition-all"
                            >
                              <UploadCloud className="w-4 h-4" /> Import Excel
                            </button>
                            <button
                              onClick={() => {
                                setEditingWord(null);
                                setWordForm({ id: '', deckId: selectedDeckId || '', word: '', pinyin: '', meaning: '', example: '', hanViet: '' });
                                setShowWordModal(true);
                              }}
                              className="flex-shrink-0 flex items-center gap-2 bg-brand-accent text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-brand-accent/20 hover:bg-brand-accent/90 transition-all"
                            >
                              <Plus className="w-4 h-4" /> Thêm từ
                            </button>
                          </div>
                        </div>
                      </div>

                      {selectedWordIds.length > 0 && (
                        <div className="flex items-center justify-between bg-red-50 p-4 rounded-xl border border-red-200">
                          <span className="text-red-600 font-bold text-sm">Đã chọn {selectedWordIds.length} từ vựng</span>
                          <button
                            onClick={handleBulkDeleteWords}
                            className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all"
                          >
                            <Trash2 className="w-4 h-4" /> Xóa hàng loạt
                          </button>
                        </div>
                      )}

                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-brand-secondary/20 text-brand-text/40 text-xs uppercase tracking-widest font-bold">
                              <th className="pb-4 px-4 w-10">
                                <input 
                                  type="checkbox" 
                                  className="w-4 h-4 rounded border-brand-secondary/30 text-brand-accent focus:ring-brand-accent"
                                  checked={currentWords.length > 0 && currentWords.every(w => selectedWordIds.includes(w.id))}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      const newIds = currentWords.map(w => w.id).filter(id => !selectedWordIds.includes(id));
                                      setSelectedWordIds([...selectedWordIds, ...newIds]);
                                    } else {
                                      const currentIds = currentWords.map(w => w.id);
                                      setSelectedWordIds(selectedWordIds.filter(id => !currentIds.includes(id)));
                                    }
                                  }}
                                />
                              </th>
                              <th className="pb-4 px-4">Từ</th>
                              <th className="pb-4 px-4">Pinyin</th>
                              {!selectedDeckId && <th className="pb-4 px-4 hidden sm:table-cell">Cấp độ</th>}
                              <th className="pb-4 px-4 hidden md:table-cell">Nghĩa</th>
                              <th className="pb-4 px-4 text-right">Thao tác</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-brand-secondary/10">
                            {currentWords.length === 0 ? (
                              <tr>
                                <td colSpan={selectedDeckId ? 5 : 6} className="py-8 text-center text-brand-text/40">Không tìm thấy từ vựng nào</td>
                              </tr>
                            ) : currentWords.map((word) => (
                              <tr key={word.id} className="group hover:bg-brand-secondary/5 transition-colors">
                                <td className="py-4 px-4">
                                  <input 
                                    type="checkbox" 
                                    className="w-4 h-4 rounded border-brand-secondary/30 text-brand-accent focus:ring-brand-accent"
                                    checked={selectedWordIds.includes(word.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedWordIds([...selectedWordIds, word.id]);
                                      } else {
                                        setSelectedWordIds(selectedWordIds.filter(id => id !== word.id));
                                      }
                                    }}
                                  />
                                </td>
                                <td className="py-4 px-4 text-xl font-bold font-itim text-brand-text">{word.word}</td>
                                <td className="py-4 px-4 text-brand-accent font-bold">{word.pinyin}</td>
                                {!selectedDeckId && <td className="py-4 px-4 text-sm font-bold text-brand-text/60 hidden sm:table-cell">{word.deckLevel || decks.find(d => d.id === word.deckId)?.level}</td>}
                                <td className="py-4 px-4 text-sm text-brand-text/70 hidden md:table-cell max-w-xs truncate">{word.meaning}</td>
                                <td className="py-4 px-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => {
                                        setEditingWord(word);
                                        setWordForm(word);
                                        setShowWordModal(true);
                                      }}
                                      className="p-2 text-brand-text/20 hover:text-brand-accent hover:bg-brand-accent/10 transition-all rounded-lg"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteWord(word.id)}
                                      className="p-2 text-brand-text/20 hover:text-red-500 hover:bg-red-50 transition-all rounded-lg"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-brand-secondary/10">
                          <span className="text-sm text-brand-text/50">
                            Hiển thị {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredWords.length)} trong số {filteredWords.length} từ
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                              disabled={currentPage === 1}
                              className="px-3 py-1.5 rounded-lg bg-brand-secondary/10 text-brand-text disabled:opacity-50 text-sm font-bold hover:bg-brand-secondary/20 transition-colors"
                            >
                              Trước
                            </button>
                            <span className="text-sm font-bold bg-brand-accent text-white w-8 h-8 flex items-center justify-center rounded-lg shadow-md shadow-brand-accent/20">
                              {currentPage}
                            </span>
                            <span className="text-sm text-brand-text/50 font-bold px-1">/ {totalPages}</span>
                            <button
                              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                              disabled={currentPage === totalPages}
                              className="px-3 py-1.5 rounded-lg bg-brand-secondary/10 text-brand-text disabled:opacity-50 text-sm font-bold hover:bg-brand-secondary/20 transition-colors"
                            >
                              Sau
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB: NOTIFICATIONS */}
                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-brand-text">Gửi thông báo hệ thống</h2>
                    </div>
                    <div className="bg-brand-secondary/5 rounded-[2rem] p-6 border border-brand-secondary/20">
                      <p className="text-brand-text/60 mb-4 text-sm">
                        {editingNotification ? 'Sửa nội dung thông báo.' : 'Nội dung thông báo sẽ được gửi đến tất cả người dùng và hiển thị trên biểu tượng chuông.'}
                      </p>
                      <textarea
                        value={notificationMessage}
                        onChange={e => setNotificationMessage(e.target.value)}
                        placeholder="Nhập nội dung thông báo..."
                        className="w-full px-4 py-3 bg-white rounded-xl outline-none focus:ring-2 ring-brand-accent border border-brand-secondary/20 mb-4"
                        rows={4}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSendNotification}
                          className="flex items-center gap-2 bg-brand-accent text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-brand-accent/20 hover:bg-brand-accent/90 transition-all"
                        >
                          {editingNotification ? <Save className="w-5 h-5" /> : <Bell className="w-5 h-5" />} 
                          {editingNotification ? 'Lưu thay đổi' : 'Gửi thông báo ngay'}
                        </button>
                        {editingNotification && (
                          <button
                            onClick={() => {
                              setEditingNotification(null);
                              setNotificationMessage('');
                            }}
                            className="px-6 py-3 rounded-xl font-bold text-brand-text/50 hover:bg-brand-secondary/20 transition-all"
                          >
                            Hủy
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-brand-secondary/20 text-brand-text/40 text-xs uppercase tracking-widest font-bold">
                            <th className="pb-4 px-4 font-bold w-2/3">Nội dung</th>
                            <th className="pb-4 px-4 font-bold">Ngày tạo</th>
                            <th className="pb-4 px-4 font-bold text-right">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-secondary/10">
                          {Array.isArray(notifications) && notifications.map((notif) => (
                            <tr key={notif.id} className="group hover:bg-brand-secondary/5 transition-colors">
                              <td className="py-4 px-4 text-sm text-brand-text">{notif.message}</td>
                              <td className="py-4 px-4 text-sm text-brand-text/60">
                                {new Date(notif.createdAt).toLocaleDateString('vi-VN')}
                              </td>
                              <td className="py-4 px-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingNotification(notif);
                                      setNotificationMessage(notif.message);
                                      window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="p-2 text-brand-text/20 hover:text-brand-accent hover:bg-brand-accent/10 transition-all rounded-lg"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteNotification(notif.id)}
                                    className="p-2 text-brand-text/20 hover:text-red-500 hover:bg-red-50 transition-all rounded-lg"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {(!notifications || notifications.length === 0) && (
                            <tr>
                              <td colSpan={3} className="py-8 text-center text-brand-text/40">Chưa có thông báo nào</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB: SHUFFLE */}
                {activeTab === 'shuffle' && (
                  <div className="space-y-6">
                    <div className="flex flex-wrap gap-4 items-center justify-between">
                      <div className="flex items-center gap-4">
                        {selectedShuffleTopicId && (
                          <button onClick={() => { setSelectedShuffleTopicId(null); setSelectedShuffleSentenceIds([]); }} className="p-2 hover:bg-brand-secondary/20 rounded-full transition-colors text-brand-text/50">
                            <ArrowLeft className="w-5 h-5" />
                          </button>
                        )}
                        <h2 className="text-xl font-bold text-brand-text">
                          {selectedShuffleTopicId ? `Câu hỏi: ${shuffleTopics.find(t => t.id === selectedShuffleTopicId)?.title}` : 'Quản lý Sắp xếp câu'}
                        </h2>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedShuffleTopicId && (
                          <>
                            <input type="file" accept=".xlsx, .xls" id="excel-upload-shuffle" className="hidden" onChange={handleExcelImportShuffle} />
                            <button
                              onClick={() => {
                                document.getElementById('excel-upload-shuffle')?.click()
                              }}
                              className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-green-500/20 hover:bg-green-600 transition-all"
                            >
                              <UploadCloud className="w-4 h-4" /> Import Excel
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            if (selectedShuffleTopicId) {
                              setEditingShuffleSentence(null);
                              setShuffleSentenceForm({ id: '', topicId: selectedShuffleTopicId, vietnamese: '', chinese: '', pinyin: '', correctOrder: '' });
                              setShowShuffleSentenceModal(true);
                            } else {
                              setEditingShuffleTopic(null);
                              setShuffleTopicForm({ id: '', title: '', description: '', count: 0, icon: 'Gamepad2' });
                              setShowShuffleTopicModal(true);
                            }
                          }}
                          className="flex items-center gap-2 bg-brand-accent text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-brand-accent/20 hover:bg-brand-accent/90 transition-all"
                        >
                          <Plus className="w-4 h-4" /> {selectedShuffleTopicId ? 'Thêm câu hỏi' : 'Thêm chủ đề'}
                        </button>
                      </div>
                    </div>

                    {!selectedShuffleTopicId ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {shuffleTopics.map((topic) => (
                          <div key={topic.id} className="p-6 rounded-3xl border border-brand-secondary/20 hover:border-brand-accent/30 transition-all group relative">
                            <div className="flex items-start justify-between mb-2">
                              <span className="text-2xl font-bold text-brand-accent">{topic.title}</span>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    setEditingShuffleTopic(topic);
                                    setShuffleTopicForm(topic);
                                    setShowShuffleTopicModal(true);
                                  }}
                                  className="p-2 hover:bg-brand-secondary/20 rounded-lg text-brand-text/50 transition-colors"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={async () => {
                                    if (!confirm('Xóa chủ đề này và tất cả câu hỏi bên trong?')) return;
                                    await fetch(`${API_URL}/admin/shuffle-topics/${topic.id}`, { method: 'DELETE', headers: getHeaders() });
                                    fetchData();
                                  }}
                                  className="p-2 hover:bg-red-50 rounded-lg text-red-400 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <p className="text-sm text-brand-text/50 mb-4">{topic.description}</p>
                            <div className="flex items-center justify-between">
                              <button
                                onClick={() => setSelectedShuffleTopicId(topic.id)}
                                className="text-xs font-bold text-brand-accent hover:underline flex items-center"
                              >
                                Xem câu hỏi <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {selectedShuffleSentenceIds.length > 0 && (
                          <div className="flex items-center justify-between bg-red-50 p-4 rounded-xl border border-red-200">
                            <span className="text-red-600 font-bold text-sm">Đã chọn {selectedShuffleSentenceIds.length} câu</span>
                            <button
                              onClick={handleBulkDeleteShuffleSentences}
                              className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all"
                            >
                              <Trash2 className="w-4 h-4" /> Xóa hàng loạt
                            </button>
                          </div>
                        )}
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="border-b border-brand-secondary/20 text-brand-text/40 text-xs uppercase tracking-widest font-bold">
                                <th className="pb-4 px-4 w-10">
                                  <input 
                                    type="checkbox" 
                                    className="w-4 h-4 rounded border-brand-secondary/30 text-brand-accent focus:ring-brand-accent"
                                    checked={shuffleSentences.filter(s => s.topicId === selectedShuffleTopicId).length > 0 && shuffleSentences.filter(s => s.topicId === selectedShuffleTopicId).every(s => selectedShuffleSentenceIds.includes(s.id))}
                                    onChange={(e) => {
                                      const topicSentences = shuffleSentences.filter(s => s.topicId === selectedShuffleTopicId);
                                      if (e.target.checked) {
                                        const newIds = topicSentences.map(s => s.id).filter(id => !selectedShuffleSentenceIds.includes(id));
                                        setSelectedShuffleSentenceIds([...selectedShuffleSentenceIds, ...newIds]);
                                      } else {
                                        const currentIds = topicSentences.map(s => s.id);
                                        setSelectedShuffleSentenceIds(selectedShuffleSentenceIds.filter(id => !currentIds.includes(id)));
                                      }
                                    }}
                                  />
                                </th>
                                <th className="pb-4 px-4">Tiếng Việt</th>
                                <th className="pb-4 px-4">Từ tiếng Trung</th>
                                <th className="pb-4 px-4 text-right">Thao tác</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-secondary/10">
                              {shuffleSentences.filter(s => s.topicId === selectedShuffleTopicId).map((sentence) => (
                                <tr key={sentence.id} className="group hover:bg-brand-secondary/5 transition-colors">
                                  <td className="py-4 px-4">
                                    <input 
                                      type="checkbox" 
                                      className="w-4 h-4 rounded border-brand-secondary/30 text-brand-accent focus:ring-brand-accent"
                                      checked={selectedShuffleSentenceIds.includes(sentence.id)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedShuffleSentenceIds([...selectedShuffleSentenceIds, sentence.id]);
                                        } else {
                                          setSelectedShuffleSentenceIds(selectedShuffleSentenceIds.filter(id => id !== sentence.id));
                                        }
                                      }}
                                    />
                                  </td>
                                  <td className="py-4 px-4 text-sm font-bold text-brand-text">{sentence.vietnamese}</td>
                                  <td className="py-4 px-4 text-sm text-brand-accent">{Array.isArray(sentence.chinese) ? sentence.chinese.join(', ') : sentence.chinese}</td>
                                  <td className="py-4 px-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => {
                                        setEditingShuffleSentence(sentence);
                                        setShuffleSentenceForm({
                                          ...sentence,
                                          chinese: Array.isArray(sentence.chinese) ? sentence.chinese.join(',') : sentence.chinese || '',
                                          pinyin: Array.isArray(sentence.pinyin) ? sentence.pinyin.join(',') : sentence.pinyin || '',
                                          correctOrder: Array.isArray(sentence.correctOrder) ? sentence.correctOrder.join(',') : sentence.correctOrder || ''
                                        });
                                        setShowShuffleSentenceModal(true);
                                      }}
                                      className="p-2 text-brand-text/20 hover:text-brand-accent hover:bg-brand-accent/10 transition-all rounded-lg"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={async () => {
                                        if (!confirm('Xóa câu này?')) return;
                                        await fetch(`${API_URL}/admin/shuffle-sentences/${sentence.id}`, { method: 'DELETE', headers: getHeaders() });
                                        fetchData();
                                      }}
                                      className="p-2 text-brand-text/20 hover:text-red-500 hover:bg-red-50 transition-all rounded-lg"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>

      <Footer />

      {/* --- MODALS --- */}
      <AnimatePresence>
        {showDeckModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-text/20 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-brand-text">{editingDeck ? 'Sửa Bộ Từ Vựng' : 'Thêm Bộ Từ Vựng'}</h3>
                <button onClick={() => setShowDeckModal(false)} className="p-2 hover:bg-brand-secondary/20 rounded-full text-brand-text/50">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                {!editingDeck && (
                  <div>
                    <label className="block text-xs font-bold text-brand-text/60 uppercase mb-1">ID (Ví dụ: 1, 2, 3)</label>
                    <input type="text" value={deckForm.id} onChange={e => setDeckForm({ ...deckForm, id: e.target.value })} className="w-full px-4 py-3 bg-brand-secondary/10 rounded-xl outline-none focus:ring-2 ring-brand-accent border-none" />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-brand-text/60 uppercase mb-1">Cấp độ (Ví dụ: HSK 1)</label>
                  <input type="text" value={deckForm.level} onChange={e => setDeckForm({ ...deckForm, level: e.target.value })} className="w-full px-4 py-3 bg-brand-secondary/10 rounded-xl outline-none focus:ring-2 ring-brand-accent border-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-text/60 uppercase mb-1">Mô tả</label>
                  <textarea value={deckForm.description} onChange={e => setDeckForm({ ...deckForm, description: e.target.value })} className="w-full px-4 py-3 bg-brand-secondary/10 rounded-xl outline-none focus:ring-2 ring-brand-accent border-none" rows={3} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-text/60 uppercase mb-1">Số lượng từ dự kiến</label>
                  <input type="number" value={deckForm.count} onChange={e => setDeckForm({ ...deckForm, count: parseInt(e.target.value) || 0 })} className="w-full px-4 py-3 bg-brand-secondary/10 rounded-xl outline-none focus:ring-2 ring-brand-accent border-none" />
                </div>
                <button onClick={handleSaveDeck} className="w-full mt-4 py-4 bg-brand-accent text-white font-bold rounded-xl flex justify-center items-center gap-2 hover:bg-brand-accent/90 transition-colors">
                  <Save className="w-5 h-5" /> Lưu lại
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showWordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-text/20 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] p-8 w-full max-w-xl shadow-2xl my-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-brand-text">{editingWord ? 'Sửa Từ Vựng' : 'Thêm Từ Vựng'}</h3>
                <button onClick={() => setShowWordModal(false)} className="p-2 hover:bg-brand-secondary/20 rounded-full text-brand-text/50">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {!editingWord && (
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs font-bold text-brand-text/60 uppercase mb-1">ID Từ (vd: w301)</label>
                      <input type="text" value={wordForm.id} onChange={e => setWordForm({ ...wordForm, id: e.target.value })} className="w-full px-4 py-3 bg-brand-secondary/10 rounded-xl outline-none focus:ring-2 ring-brand-accent border-none" />
                    </div>
                  )}
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-bold text-brand-text/60 uppercase mb-1">Bộ từ vựng</label>
                    <select value={wordForm.deckId} onChange={e => setWordForm({ ...wordForm, deckId: e.target.value })} className="w-full px-4 py-3 bg-brand-secondary/10 rounded-xl outline-none focus:ring-2 ring-brand-accent border-none">
                      <option value="">Chọn bộ từ vựng</option>
                      {decks.map(d => <option key={d.id} value={d.id}>{d.level}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-bold text-brand-text/60 uppercase mb-1">Chữ Hán</label>
                    <input type="text" value={wordForm.word} onChange={e => setWordForm({ ...wordForm, word: e.target.value })} className="w-full px-4 py-3 bg-brand-secondary/10 rounded-xl outline-none focus:ring-2 ring-brand-accent border-none text-xl font-itim" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-brand-text/60 uppercase mb-1">Pinyin</label>
                    <input type="text" value={wordForm.pinyin} onChange={e => setWordForm({ ...wordForm, pinyin: e.target.value })} className="w-full px-4 py-3 bg-brand-secondary/10 rounded-xl outline-none focus:ring-2 ring-brand-accent border-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-text/60 uppercase mb-1">Âm Hán Việt</label>
                    <input type="text" value={wordForm.hanViet} onChange={e => setWordForm({ ...wordForm, hanViet: e.target.value })} className="w-full px-4 py-3 bg-brand-secondary/10 rounded-xl outline-none focus:ring-2 ring-brand-accent border-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-text/60 uppercase mb-1">Nghĩa</label>
                  <input type="text" value={wordForm.meaning} onChange={e => setWordForm({ ...wordForm, meaning: e.target.value })} className="w-full px-4 py-3 bg-brand-secondary/10 rounded-xl outline-none focus:ring-2 ring-brand-accent border-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-text/60 uppercase mb-1">Ví dụ minh hoạ</label>
                  <textarea value={wordForm.example} onChange={e => setWordForm({ ...wordForm, example: e.target.value })} className="w-full px-4 py-3 bg-brand-secondary/10 rounded-xl outline-none focus:ring-2 ring-brand-accent border-none" rows={2} />
                </div>
                <button onClick={handleSaveWord} className="w-full mt-4 py-4 bg-brand-accent text-white font-bold rounded-xl flex justify-center items-center gap-2 hover:bg-brand-accent/90 transition-colors">
                  <Save className="w-5 h-5" /> Lưu lại
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-text/20 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-brand-text">Cập Nhật Người Dùng</h3>
                <button onClick={() => setShowUserModal(false)} className="p-2 hover:bg-brand-secondary/20 rounded-full text-brand-text/50">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-brand-text/60 uppercase mb-1">Tên đăng nhập (Read Only)</label>
                  <input type="text" value={editingUser?.username} readOnly className="w-full px-4 py-3 bg-brand-secondary/5 text-brand-text/50 cursor-not-allowed rounded-xl border-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-text/60 uppercase mb-1">Email</label>
                  <input type="email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} className="w-full px-4 py-3 bg-brand-secondary/10 rounded-xl outline-none focus:ring-2 ring-brand-accent border-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-text/60 uppercase mb-1">Vai trò</label>
                  <select value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })} className="w-full px-4 py-3 bg-brand-secondary/10 rounded-xl outline-none focus:ring-2 ring-brand-accent border-none">
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <button onClick={handleSaveUser} className="w-full mt-4 py-4 bg-brand-accent text-white font-bold rounded-xl flex justify-center items-center gap-2 hover:bg-brand-accent/90 transition-colors">
                  <Save className="w-5 h-5" /> Lưu lại
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Shuffle Topic Modal */}
        {showShuffleTopicModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] p-6 max-w-md w-full shadow-2xl relative"
            >
              <button onClick={() => setShowShuffleTopicModal(false)} className="absolute top-4 right-4 p-2 text-brand-text/40 hover:bg-brand-secondary/10 rounded-full">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-bold mb-6">{editingShuffleTopic ? 'Sửa Chủ Đề' : 'Thêm Chủ Đề'}</h3>
              <div className="space-y-4">
                {!editingShuffleTopic && (
                  <div>
                    <label className="text-xs font-bold text-brand-text/50 uppercase">ID (vd: t7)</label>
                    <input type="text" value={shuffleTopicForm.id} onChange={e => setShuffleTopicForm({ ...shuffleTopicForm, id: e.target.value })} className="w-full px-4 py-2 mt-1 bg-brand-secondary/5 border-none rounded-xl" />
                  </div>
                )}
                <div>
                  <label className="text-xs font-bold text-brand-text/50 uppercase">Tên chủ đề</label>
                  <input type="text" value={shuffleTopicForm.title} onChange={e => setShuffleTopicForm({ ...shuffleTopicForm, title: e.target.value })} className="w-full px-4 py-2 mt-1 bg-brand-secondary/5 border-none rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-bold text-brand-text/50 uppercase">Mô tả</label>
                  <input type="text" value={shuffleTopicForm.description} onChange={e => setShuffleTopicForm({ ...shuffleTopicForm, description: e.target.value })} className="w-full px-4 py-2 mt-1 bg-brand-secondary/5 border-none rounded-xl" />
                </div>
                <button 
                  onClick={async () => {
                    const url = editingShuffleTopic ? `${API_URL}/admin/shuffle-topics/${editingShuffleTopic.id}` : `${API_URL}/admin/shuffle-topics`;
                    const method = editingShuffleTopic ? 'PUT' : 'POST';
                    await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(shuffleTopicForm) });
                    setShowShuffleTopicModal(false);
                    fetchData();
                  }} 
                  className="w-full py-3 bg-brand-accent text-white rounded-xl font-bold mt-4"
                >
                  Lưu
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Shuffle Sentence Modal */}
        {showShuffleSentenceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] p-6 max-w-md w-full shadow-2xl relative"
            >
              <button onClick={() => setShowShuffleSentenceModal(false)} className="absolute top-4 right-4 p-2 text-brand-text/40 hover:bg-brand-secondary/10 rounded-full">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-bold mb-6">{editingShuffleSentence ? 'Sửa Câu' : 'Thêm Câu'}</h3>
              <div className="space-y-4">
                {!editingShuffleSentence && (
                  <div>
                    <label className="text-xs font-bold text-brand-text/50 uppercase">ID (vd: s3)</label>
                    <input type="text" value={shuffleSentenceForm.id} onChange={e => setShuffleSentenceForm({ ...shuffleSentenceForm, id: e.target.value })} className="w-full px-4 py-2 mt-1 bg-brand-secondary/5 border-none rounded-xl" />
                  </div>
                )}
                <div>
                  <label className="text-xs font-bold text-brand-text/50 uppercase">Nghĩa tiếng Việt</label>
                  <input type="text" value={shuffleSentenceForm.vietnamese} onChange={e => setShuffleSentenceForm({ ...shuffleSentenceForm, vietnamese: e.target.value })} className="w-full px-4 py-2 mt-1 bg-brand-secondary/5 border-none rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-bold text-brand-text/50 uppercase">Các từ tiếng Trung (phân cách bằng dấu phẩy)</label>
                  <input type="text" value={typeof shuffleSentenceForm.chinese === 'string' ? shuffleSentenceForm.chinese : ''} onChange={e => setShuffleSentenceForm({ ...shuffleSentenceForm, chinese: e.target.value })} className="w-full px-4 py-2 mt-1 bg-brand-secondary/5 border-none rounded-xl" placeholder="vd: 我,住,在,上海,。" />
                </div>
                <div>
                  <label className="text-xs font-bold text-brand-text/50 uppercase">Pinyin tương ứng (phân cách bằng dấu phẩy)</label>
                  <input type="text" value={typeof shuffleSentenceForm.pinyin === 'string' ? shuffleSentenceForm.pinyin : ''} onChange={e => setShuffleSentenceForm({ ...shuffleSentenceForm, pinyin: e.target.value })} className="w-full px-4 py-2 mt-1 bg-brand-secondary/5 border-none rounded-xl" placeholder="vd: wǒ,zhù,zài,shànghǎi," />
                </div>
                <div>
                  <label className="text-xs font-bold text-brand-text/50 uppercase">Đáp án đúng (phân cách bằng dấu phẩy)</label>
                  <input type="text" value={typeof shuffleSentenceForm.correctOrder === 'string' ? shuffleSentenceForm.correctOrder : ''} onChange={e => setShuffleSentenceForm({ ...shuffleSentenceForm, correctOrder: e.target.value })} className="w-full px-4 py-2 mt-1 bg-brand-secondary/5 border-none rounded-xl" placeholder="vd: 我,住,在,上海,。" />
                </div>
                <button 
                  onClick={async () => {
                    const dataToSend = {
                      ...shuffleSentenceForm,
                      chinese: String(shuffleSentenceForm.chinese).split(',').map(s => s.trim()).filter(Boolean),
                      pinyin: String(shuffleSentenceForm.pinyin).split(',').map(s => s.trim()),
                      correctOrder: String(shuffleSentenceForm.correctOrder).split(',').map(s => s.trim()).filter(Boolean),
                    };
                    const url = editingShuffleSentence ? `${API_URL}/admin/shuffle-sentences/${editingShuffleSentence.id}` : `${API_URL}/admin/shuffle-sentences`;
                    const method = editingShuffleSentence ? 'PUT' : 'POST';
                    await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(dataToSend) });
                    setShowShuffleSentenceModal(false);
                    fetchData();
                  }} 
                  className="w-full py-3 bg-brand-accent text-white rounded-xl font-bold mt-4"
                >
                  Lưu
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

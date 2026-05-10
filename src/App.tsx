import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import BasicChinese from './pages/BasicChinese';
import DeckDetail from './pages/DeckDetail';
import FlashcardSelection from './pages/FlashcardSelection';
import FlashcardStudy from './pages/FlashcardStudy';
import ShuffleSelection from './pages/ShuffleSelection';
import ShuffleGame from './pages/ShuffleGame';
import QuizSelection from './pages/QuizSelection';
import QuizGame from './pages/QuizGame';
import AdminDashboard from './pages/AdminDashboard';
import StudyGuide from './pages/StudyGuide';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/me" element={<Home />} />
        <Route path="/basic-chinese" element={<BasicChinese />} />
        <Route path="/deck/:id" element={<DeckDetail />} />
        <Route path="/flashcards" element={<FlashcardSelection />} />
        <Route path="/flashcards/:id" element={<FlashcardStudy />} />
        <Route path="/shuffle" element={<ShuffleSelection />} />
        <Route path="/shuffle/:id" element={<ShuffleGame />} />
        <Route path="/quiz" element={<QuizSelection />} />
        <Route path="/quiz/:id" element={<QuizGame />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/guide" element={<StudyGuide />} />
      </Routes>
    </Router>
  );
}

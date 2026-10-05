import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { AboutView } from './components/AboutView';
import { DashboardView } from './components/DashboardView';
import { SubjectsView } from './components/SubjectsView';
import { LearningPathView } from './components/LearningPathView';
import { QuizzesView } from './components/QuizzesView';
import { AiTutorView } from './components/AiTutorView';
import { NotesView } from './components/NotesView';
import { PyqBankView } from './components/PyqBankView';
import { ProfileView } from './components/ProfileView';
import { LoginModal } from './components/LoginModal';
import { MindmapModal } from './components/MindmapModal';
import { ShareModal } from './components/ShareModal';
import { INITIAL_USER, REVISION_NOTES, ALL_SUBJECTS, BOARD_PERSONAS } from './data/class10Data';
import { UserProfile, RevisionNote, SubjectId, ChapterMindmap, BoardType } from './types';
import { StudyGenieBrand } from './components/StudyGenieMascot';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const saved = localStorage.getItem('studygenie_logged_in');
    return saved === 'true';
  });

  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('studygenie_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_USER;
      }
    }
    return INITIAL_USER;
  });

  const [activeBoard, setActiveBoard] = useState<BoardType>(() => {
    const savedBoard = localStorage.getItem('studygenie_board');
    if (savedBoard === 'Maharashtra SSC' || savedBoard === 'CBSE' || savedBoard === 'ICSE') {
      return savedBoard as BoardType;
    }
    return user.board || 'Maharashtra SSC';
  });

  const [currentTab, setCurrentTab] = useState<string>(() => {
    const savedAuth = localStorage.getItem('studygenie_logged_in');
    return savedAuth === 'true' ? 'dashboard' : 'home';
  });

  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [mindmapModalOpen, setMindmapModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [activeMindmap, setActiveMindmap] = useState<ChapterMindmap | null>(null);

  // Cross-tab context parameters
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('mh-algebra');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [tutorPrompt, setTutorPrompt] = useState<string>('');
  const [tutorSubject, setTutorSubject] = useState<string>('General');

  // Notes state
  const [notes, setNotes] = useState<RevisionNote[]>(() => {
    const saved = localStorage.getItem('studygenie_notes');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return REVISION_NOTES;
      }
    }
    return REVISION_NOTES;
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('studygenie_logged_in', isLoggedIn ? 'true' : 'false');
  }, [isLoggedIn]);

  useEffect(() => {
    localStorage.setItem('studygenie_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('studygenie_board', activeBoard);
  }, [activeBoard]);

  useEffect(() => {
    localStorage.setItem('studygenie_notes', JSON.stringify(notes));
  }, [notes]);

  const handleChangeBoard = (newBoard: BoardType) => {
    setActiveBoard(newBoard);
    setUser(prev => ({ ...prev, board: newBoard }));
  };

  const handleLogin = (newUser: UserProfile) => {
    setUser(newUser);
    setActiveBoard(newUser.board);
    setIsLoggedIn(true);
    setLoginModalOpen(false);
    setCurrentTab('dashboard');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentTab('home');
  };

  const handleStartLearning = () => {
    if (!isLoggedIn) {
      setLoginModalOpen(true);
    } else {
      setCurrentTab('dashboard');
    }
  };

  const handleSelectSubjectFromHome = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    if (!isLoggedIn) {
      setIsLoggedIn(true); // Instant demo entry for quick exploration
    }
    setCurrentTab('subjects');
  };

  const handleTryTutorFromHome = (prompt?: string) => {
    if (prompt) {
      setTutorPrompt(prompt);
    }
    if (!isLoggedIn) {
      setIsLoggedIn(true);
    }
    setCurrentTab('ai_tutor');
  };

  const handleNavigateFromDashboard = (tab: string, meta?: any) => {
    if (meta?.subjectId) {
      setSelectedSubjectId(meta.subjectId);
    }
    if (meta?.prompt) {
      setTutorPrompt(meta.prompt);
    }
    setCurrentTab(tab);
  };

  // Navigations from Subjects
  const handleSubjectQuiz = (subjectId: string, chapterId: string) => {
    setSelectedSubjectId(subjectId);
    setSelectedChapterId(chapterId);
    setCurrentTab('quizzes');
  };

  const handleSubjectTutor = (subjectId: string, chapterTitle: string) => {
    setSelectedSubjectId(subjectId);
    setTutorSubject(subjectId);
    setTutorPrompt(`Explain key concepts, derivations, and board questions for ${chapterTitle} under ${activeBoard} curriculum.`);
    setCurrentTab('ai_tutor');
  };

  const handleSubjectPYQ = (subjectId: string, chapterId: string) => {
    setSelectedSubjectId(subjectId);
    setSelectedChapterId(chapterId);
    setCurrentTab('pyq');
  };

  const handleSubjectNotes = (subjectId: string, chapterId: string) => {
    setSelectedSubjectId(subjectId);
    setSelectedChapterId(chapterId);
    setCurrentTab('notes');
  };

  // Notes modifications
  const handleAddNote = (newNote: RevisionNote) => {
    setNotes(prev => [newNote, ...prev]);
  };

  const handleToggleNoteBookmark = (noteId: string) => {
    setNotes(prev =>
      prev.map(n => (n.id === noteId ? { ...n, isBookmarked: !n.isBookmarked } : n))
    );
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes(prev => prev.filter(n => n.id !== noteId));
  };

  const handleSaveTutorNote = (partialNote: Partial<RevisionNote>) => {
    const fullNote: RevisionNote = {
      id: `ai-note-${Date.now()}`,
      subjectId: partialNote.subjectId || selectedSubjectId || 'mh-algebra',
      chapterId: 'ai-tutor-generated',
      chapterTitle: partialNote.chapterTitle || `${activeBoard} AI Tutor Explanation`,
      title: partialNote.title || 'Genie Note',
      content: partialNote.content || '',
      keyFormulas: partialNote.keyFormulas || [],
      examAlerts: [],
      isBookmarked: true,
      isCustom: true,
      createdAt: new Date().toLocaleDateString(),
    };
    handleAddNote(fullNote);
  };

  const handleOpenMindmap = (subjectId: SubjectId, chapterId?: string) => {
    const subject = ALL_SUBJECTS.find(s => s.id === subjectId) || ALL_SUBJECTS[0];
    const chapter = chapterId ? subject.chapters.find(c => c.id === chapterId) : subject.chapters[0];
    if (chapter && chapter.mindmap) {
      setActiveMindmap(chapter.mindmap);
      setMindmapModalOpen(true);
    }
  };

  // Profile updates
  const handleUpdateProfile = (updated: Partial<UserProfile>) => {
    setUser(prev => {
      const nextUser = { ...prev, ...updated };
      if (updated.board) {
        setActiveBoard(updated.board);
      }
      return nextUser;
    });
  };

  const handleSwitchPersona = (persona: 'aarav' | 'ananya' | 'rohan') => {
    if (persona === 'aarav') {
      const p = BOARD_PERSONAS['Maharashtra SSC'];
      setUser(p);
      setActiveBoard(p.board);
    } else if (persona === 'ananya') {
      const p = BOARD_PERSONAS['CBSE'];
      setUser(p);
      setActiveBoard(p.board);
    } else {
      const p = BOARD_PERSONAS['ICSE'];
      setUser(p);
      setActiveBoard(p.board);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B19] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isLoggedIn={isLoggedIn}
        user={user}
        activeBoard={activeBoard}
        onChangeBoard={handleChangeBoard}
        onOpenLogin={() => setLoginModalOpen(true)}
        onLogout={handleLogout}
        onOpenShare={() => setShareModalOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {currentTab === 'home' && (
          <HomeView
            activeBoard={activeBoard}
            onChangeBoard={handleChangeBoard}
            onStartLearning={handleStartLearning}
            onSelectSubject={handleSelectSubjectFromHome}
            onTryTutor={handleTryTutorFromHome}
            onOpenAbout={() => setCurrentTab('about')}
            onOpenMindmap={handleOpenMindmap}
          />
        )}

        {currentTab === 'about' && (
          <AboutView onStartLearning={handleStartLearning} />
        )}

        {currentTab === 'dashboard' && (
          <DashboardView
            user={user}
            onNavigate={handleNavigateFromDashboard}
          />
        )}

        {currentTab === 'subjects' && (
          <SubjectsView
            activeBoard={activeBoard}
            onChangeBoard={handleChangeBoard}
            initialSubjectId={selectedSubjectId}
            onNavigateToQuiz={handleSubjectQuiz}
            onNavigateToTutor={handleSubjectTutor}
            onNavigateToPYQ={handleSubjectPYQ}
            onNavigateToNotes={handleSubjectNotes}
            onOpenMindmap={handleOpenMindmap}
          />
        )}

        {currentTab === 'learning_path' && (
          <LearningPathView
            activeBoard={activeBoard}
            onAskGenie={prompt => {
              setTutorPrompt(prompt);
              setCurrentTab('ai_tutor');
            }}
            onTakeQuiz={subId => {
              setSelectedSubjectId(subId);
              setCurrentTab('quizzes');
            }}
          />
        )}

        {currentTab === 'quizzes' && (
          <QuizzesView
            initialSubjectId={selectedSubjectId}
            initialChapterId={selectedChapterId}
            activeBoard={activeBoard}
            onAskTutor={qText => {
              setTutorPrompt(`Help me solve and understand this ${activeBoard} quiz question:\n"${qText}"`);
              setCurrentTab('ai_tutor');
            }}
          />
        )}

        {currentTab === 'ai_tutor' && (
          <AiTutorView
            initialPrompt={tutorPrompt}
            initialSubject={tutorSubject}
            activeBoard={activeBoard}
            onSaveNote={handleSaveTutorNote}
          />
        )}

        {currentTab === 'notes' && (
          <NotesView
            initialSubjectId={selectedSubjectId}
            notes={notes}
            onAddNote={handleAddNote}
            onToggleBookmark={handleToggleNoteBookmark}
            onDeleteNote={handleDeleteNote}
          />
        )}

        {currentTab === 'pyq' && (
          <PyqBankView
            initialSubjectId={selectedSubjectId}
            initialChapterId={selectedChapterId}
            activeBoard={activeBoard}
            onAskTutor={qText => {
              setTutorPrompt(`Analyze this ${activeBoard} previous year question and explain the official board step marking scheme:\n"${qText}"`);
              setCurrentTab('ai_tutor');
            }}
          />
        )}

        {currentTab === 'profile' && (
          <ProfileView
            user={user}
            onUpdateProfile={handleUpdateProfile}
            onSwitchPersona={handleSwitchPersona}
          />
        )}
      </main>

      {/* Global Mindmap Modal with ambient Genie background */}
      <MindmapModal
        isOpen={mindmapModalOpen}
        onClose={() => setMindmapModalOpen(false)}
        mindmap={activeMindmap}
        onAskTutor={query => {
          setTutorPrompt(query);
          setMindmapModalOpen(false);
          setCurrentTab('ai_tutor');
        }}
        onTakeQuiz={(subId, chId) => {
          setSelectedSubjectId(subId);
          setSelectedChapterId(chId);
          setMindmapModalOpen(false);
          setCurrentTab('quizzes');
        }}
      />

      {/* Global Login Modal */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLogin={handleLogin}
      />

      {/* Global Share Modal */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-8 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <StudyGenieBrand compact={true} board={activeBoard} />
          <div>
            “Don’t study harder. <span className="text-cyan-400 font-semibold">Learn smarter.</span>” — EduAdapt 10 · {activeBoard}
          </div>
          <div>Class 10 AI Assistant · 2026/2027 Academic Year</div>
        </div>
      </footer>
    </div>
  );
}

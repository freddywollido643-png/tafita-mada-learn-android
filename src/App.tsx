import React, { useState, useEffect } from 'react';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { HomePage } from './pages/Home';
import { CoursesPage } from './pages/Courses';
import { CourseDetailPage } from './pages/CourseDetail';
import { CommunityPage } from './pages/Community';
import { DictionaryPage } from './pages/Dictionary';
import { BooksPage } from './pages/Books';
import { ProfilePage } from './pages/Profile';
import { AuthPage } from './pages/Auth';

function MainLayout() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [initialGroupId, setInitialGroupId] = useState<string | undefined>(undefined);
  const [configModalOpen, setConfigModalOpen] = useState<boolean>(false);

  const { refreshProfile } = useAuth();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const backListener = CapApp.addListener('backButton', () => {
      if (configModalOpen) {
        setConfigModalOpen(false);
      } else if (selectedCourseId) {
        setSelectedCourseId(null);
      } else if (activeTab !== 'home') {
        setActiveTab('home');
      } else {
        CapApp.exitApp();
      }
    });

    return () => {
      backListener.then(l => l.remove()).catch(() => {});
    };
  }, [configModalOpen, selectedCourseId, activeTab]);

  const handleNavigate = (tab: string, extraId?: string) => {
    setActiveTab(tab);
    if (tab === 'courses') {
      if (extraId) {
        setSelectedCourseId(extraId);
      } else {
        setSelectedCourseId(null);
      }
    } else if (tab === 'community') {
      setInitialGroupId(extraId);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    setActiveTab('courses');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setSelectedCourseId(null);
          setActiveTab(tab);
        }}
        openConfigModal={() => setConfigModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {activeTab === 'home' && (
          <HomePage
            onNavigate={handleNavigate}
            openConfigModal={() => setConfigModalOpen(true)}
          />
        )}

        {activeTab === 'courses' && (
          selectedCourseId ? (
            <CourseDetailPage
              courseId={selectedCourseId}
              onBack={() => setSelectedCourseId(null)}
              openConfigModal={() => setConfigModalOpen(true)}
            />
          ) : (
            <CoursesPage
              onSelectCourse={handleSelectCourse}
              openConfigModal={() => setConfigModalOpen(true)}
            />
          )
        )}

        {activeTab === 'community' && (
          <CommunityPage
            initialGroupId={initialGroupId}
            openConfigModal={() => setConfigModalOpen(true)}
          />
        )}

        {activeTab === 'dictionary' && (
          <DictionaryPage
            openConfigModal={() => setConfigModalOpen(true)}
          />
        )}

        {activeTab === 'books' && (
          <BooksPage
            openConfigModal={() => setConfigModalOpen(true)}
          />
        )}

        {activeTab === 'profile' && (
          <ProfilePage
            onNavigateToAuth={() => setActiveTab('auth')}
            openConfigModal={() => setConfigModalOpen(true)}
          />
        )}

        {activeTab === 'auth' && (
          <AuthPage
            onSuccess={() => {
              setActiveTab('home');
              refreshProfile();
            }}
            openConfigModal={() => setConfigModalOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <Footer openConfigModal={() => setConfigModalOpen(true)} />

      {/* Supabase Connection Modal */}
      <SupabaseConfigModal
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        onConfigChanged={() => {
          refreshProfile();
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}

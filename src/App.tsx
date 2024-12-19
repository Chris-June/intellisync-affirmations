import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';
import AffirmationCard from './components/AffirmationCard';
import StyleSettings from './components/StyleSettings';
import { Toaster } from 'sonner';
import type { UserInfo } from './types/user';
import { useEffect, useState } from 'react';
import { checkServer } from './services/api';

function App() {
  const [userInfo, setUserInfo] = useState<UserInfo>({
    goals: ['Personal Growth', 'Better Health', 'Career Success'],
    interests: ['Technology', 'Fitness', 'Reading'],
    challengeAreas: ['Time Management', 'Work-Life Balance'],
    preferredTone: 'motivational',
    preferredLength: 'medium',
    language: 'en',
    imageStyle: 'digital-art'
  });

  const updateUserInfo = (updates: Partial<UserInfo>) => {
    setUserInfo(prev => ({ ...prev, ...updates }));
  };

  useEffect(() => {
    const checkServerHealth = async () => {
      const isServerRunning = await checkServer();
      if (!isServerRunning) {
        console.error('Server is not available');
      }
    };
    checkServerHealth();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <Header />
      <main className="min-h-[calc(100vh-4rem)]">
        <div className="h-full w-full">
          <StyleSettings userInfo={userInfo} onUpdate={updateUserInfo} />
          <AffirmationCard userInfo={userInfo} />
        </div>
      </main>
      <Footer />
      <Toaster 
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1f2937',
            border: '1px solid rgba(75, 85, 99, 0.3)',
            color: '#f3f4f6',
            borderRadius: '0.5rem',
          },
          className: 'toast-custom',
        }}
      />
    </div>
  );
}

export default App;

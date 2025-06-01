'use client';

import React, { useState, useEffect } from 'react';
import { Screen, UserProfile, Language } from '@/types';
import WelcomeScreen from './screens/welcomeScreen';
import QuestionsScreen from './screens/questionsScreen';
import ChecklistScreen from './screens/checklistScreen';

const BridgeApp: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [language, setLanguage] = useState<Language>('en');
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  // Load saved data on component mount
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const savedProfile = JSON.parse(localStorage.getItem('bridgeProfile') || '{}');
      const savedTasks = JSON.parse(localStorage.getItem('bridgeCompletedTasks') || '[]');
      const savedLanguage = (localStorage.getItem('bridgeLanguage') as Language) || 'en';
      
      setUserProfile(savedProfile);
      setCompletedTasks(savedTasks);
      setLanguage(savedLanguage);

      if (Object.keys(savedProfile).length > 0) {
        setCurrentScreen('checklist');
      }
    }
  }, []);

  // Save data to localStorage
  const saveData = (profile: UserProfile, tasks: string[], lang: Language) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bridgeProfile', JSON.stringify(profile));
      localStorage.setItem('bridgeCompletedTasks', JSON.stringify(tasks));
      localStorage.setItem('bridgeLanguage', lang);
    }
  };

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    localStorage.setItem('bridgeLanguage', newLanguage);
  };

  const handleIntakeQuestions = () => {
    setCurrentScreen('questions');
  };

  const handleBackToWelcome = () => {
    setCurrentScreen('welcome');
  };

  const handleToggleTask = (taskId: string) => {
    const newCompletedTasks = completedTasks.includes(taskId)
      ? completedTasks.filter(id => id !== taskId)
      : [...completedTasks, taskId];
    
    setCompletedTasks(newCompletedTasks);
    saveData(userProfile, newCompletedTasks, language);
  };

  const handleGoHome = () => {
    setCurrentScreen('welcome');
  };

  const handleGoToProfile = () => {
    setCurrentScreen('questions');
  };

  // Don't render anything until mounted to avoid hydration issues
  if (!mounted) {
    return null;
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      {currentScreen === 'welcome' && (
        <WelcomeScreen
          language={language}
          onStart={handleIntakeQuestions}
          onLanguageChange={handleLanguageChange}
        />
      )}
      
      {currentScreen === 'questions' && (
        <QuestionsScreen
          userProfile={userProfile}
          setUserProfile={setUserProfile}
          onBack={handleBackToWelcome}
          saveData={saveData}
          completedTasks={completedTasks}
          language={language}
          setCurrentScreen={setCurrentScreen}
        />
      )}
      
      {currentScreen === 'checklist' && (
        <ChecklistScreen
          userProfile={userProfile}
          completedTasks={completedTasks}
          onToggleTask={handleToggleTask}
          onGoHome={handleGoHome}
          onGoToProfile={handleGoToProfile}
        />
      )}
    </div>
  );
};

export default BridgeApp;
'use client';

import React, { useState, useEffect } from 'react';
import { Screen, UserProfile } from '@/types';
import WelcomeScreen from './screens/welcomeScreen';
import QuestionsScreen from './screens/questionsScreen';
import ChecklistScreen from './screens/checklistScreen';

const BridgeApp: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [userProfile, setUserProfile] = useState<UserProfile>({ answers: [] });
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  // Load saved data on component mount
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const savedProfile = JSON.parse(localStorage.getItem('bridgeProfile') || '{}');
      const savedTasks = JSON.parse(localStorage.getItem('bridgeCompletedTasks') || '[]');
      
      setUserProfile(savedProfile);
      setCompletedTasks(savedTasks);

      if (Object.keys(savedProfile).length > 0) {
        setCurrentScreen('checklist');
      }
    }
  }, []);

  // Save data to localStorage
  const saveData = (profile: UserProfile, tasks: string[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bridgeProfile', JSON.stringify(profile));
      localStorage.setItem('bridgeCompletedTasks', JSON.stringify(tasks));
    }
  };

  const handleIntakeQuestions = () => {
    setCurrentScreen('questions');
  };


  const handleToggleTask = (taskId: string) => {
    const newCompletedTasks = completedTasks.includes(taskId)
      ? completedTasks.filter(id => id !== taskId)
      : [...completedTasks, taskId];
    
    setCompletedTasks(newCompletedTasks);
    saveData(userProfile, newCompletedTasks);
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

  const handleResetAndGoToWelcome = () => {
    setUserProfile({ answers: [] });
    setCompletedTasks([]);
    setCurrentScreen('welcome');
    saveData({ answers: [] }, []);
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      {currentScreen === 'welcome' && (
        <WelcomeScreen
          onStart={handleIntakeQuestions}
        />
      )}
      
      {currentScreen === 'questions' && (
        <QuestionsScreen
          userProfile={userProfile}
          setUserProfile={setUserProfile}
          saveData={saveData}
          completedTasks={completedTasks}
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
          onResetAndGoToWelcome={handleResetAndGoToWelcome}
        />
      )}
    </div>
  );
};

export default BridgeApp;
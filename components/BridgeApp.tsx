'use client';

import React, { useState, useEffect } from 'react';
import { Screen, UserProfile, Language } from '@/types';
import WelcomeScreen from './screens/welcomeScreen';
import QuestionsScreen from './screens/questionsScreen';
import ChecklistScreen from './screens/checklistScreen';

const TOTAL_QUESTIONS = 5;

const BridgeApp: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [language, setLanguage] = useState<Language>('pl');
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Load saved data on component mount
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const savedProfile = JSON.parse(localStorage.getItem('bridgeProfile') || '{}');
      const savedTasks = JSON.parse(localStorage.getItem('bridgeCompletedTasks') || '[]');
      const savedLanguage = (localStorage.getItem('bridgeLanguage') as Language) || 'pl';
      
      setUserProfile(savedProfile);
      setCompletedTasks(savedTasks);
      setLanguage(savedLanguage);
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

  const getQuestionName = (index: number): string => {
    const name = index === 0 ? 'duration' : 
     index === 1 ? 'workType' : 
     index === 2 ? 'experience' : 
     index === 3 ? 'housing' : 
     'family'
     return name;
  };

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    localStorage.setItem('bridgeLanguage', newLanguage);
  };

  const handleStartQuestions = () => {
    setCurrentScreen('questions');
  };

  const handleQuestionAnswer = (answer: string) => {
    const key = getQuestionName(currentQuestionIndex);
    const updatedProfile = {
      ...userProfile,
      [key]: answer,
    };
    
    setUserProfile(updatedProfile);
    
    if (currentQuestionIndex < TOTAL_QUESTIONS - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      saveData(updatedProfile, completedTasks, language);
      setCurrentScreen('checklist');
    }
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
          onStart={handleStartQuestions}
          onLanguageChange={handleLanguageChange}
        />
      )}
      
      {currentScreen === 'questions' && (
        <QuestionsScreen
          currentQuestionIndex={currentQuestionIndex}
          totalQuestions={TOTAL_QUESTIONS}
          onBack={handleBackToWelcome}
          onAnswer={handleQuestionAnswer}
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
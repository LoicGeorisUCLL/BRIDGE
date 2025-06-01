'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Home, User, CheckCircle, Circle, MapPin, FileText, Globe, Phone, Building, CreditCard, Shield, Briefcase } from 'lucide-react';
import { Screen, UserProfile, Question, Task, Tasks } from '@/types';
import { Language, Translations } from '@/types';
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { generatePersonalizedTasks } from './logic/taskLogic';
import { renderWelcomeScreen } from './screens/welcomeScreen';
import { renderQuestionsScreen } from './screens/questionsScreen';
import { renderChecklistScreen } from './screens/checklistScreen';

const BridgeApp: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);


  const router = useRouter();
  const { locale, pathname, asPath, query } = router;

  // Load saved data on component mount
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const savedProfile = JSON.parse(localStorage.getItem('bridgeProfile') || '{}');
      const savedTasks = JSON.parse(localStorage.getItem('bridgeCompletedTasks') || '[]');
      
      setUserProfile(savedProfile);
      setCompletedTasks(savedTasks);
    }
  }, []);


  // Don't render anything until mounted to avoid hydration issues
  if (!mounted) {
    return null;
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      {currentScreen === 'welcome' && renderWelcomeScreen()}
      {currentScreen === 'questions' && renderQuestionsScreen()}
      {currentScreen === 'checklist' && renderChecklistScreen()}
    </div>
  );
};

export default BridgeApp;
'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Home, User, CheckCircle, Circle, MapPin, FileText, Globe, Phone, Building, CreditCard, Shield, Briefcase } from 'lucide-react';
import { Screen, UserProfile, Question, Task, Tasks } from '@/types';
import { Language, Translations } from '@/types';
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { generatePersonalizedTasks } from './logic/taskLogic';

const BridgeApp: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [language, setLanguage] = useState<Language>('pl');
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  const {t} = useTranslation();

  const router = useRouter();
  const { locale, pathname, asPath, query } = router;

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

  const handleQuestionAnswer = (answer: string) => {
    const key = getQuestionName(currentQuestionIndex);
    const updatedProfile = {
      ...userProfile,
      [key]: answer,
    };
    
    setUserProfile(updatedProfile);
    
  // Index (5) = amount of questions !!!!, if more questions added, needs to be updated
  // -1 bc zero-based index

    if (currentQuestionIndex < 5 - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      saveData(updatedProfile, completedTasks, language);
      setCurrentScreen('checklist');
    }
  };

  const toggleTaskCompletion = (taskId: string) => {
    const newCompletedTasks = completedTasks.includes(taskId)
      ? completedTasks.filter(id => id !== taskId)
      : [...completedTasks, taskId];
    
    setCompletedTasks(newCompletedTasks);
    saveData(userProfile, newCompletedTasks, language);
  };

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, React.ComponentType<{ className?: string }>> = {
      FileText,
      Building,
      Shield,
      CreditCard,
      Phone,
      MapPin,
      Briefcase
    };
    return icons[iconName] || FileText;
  };

const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
      const newLang = event.target.value as Language;
      setLanguage(newLang);
      localStorage.setItem('bridgeLanguage', newLang);

      router.push({ pathname, query }, asPath, { locale: newLang });
};

  const renderWelcomeScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex flex-col">
      <div className="flex-1 flex flex-col justify-center items-center text-center px-6">
        <div className="mb-8">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 mx-auto shadow-lg">
            <Building className="w-12 h-12 text-blue-800" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">{t("welcome")}</h1>
          <p className="text-blue-100 text-lg mb-8 max-w-md">{t("subtitle")}</p>
        </div>
        
        <div className="w-full max-w-sm space-y-4">
          <div className="mb-6">
            <label className="block text-blue-100 text-sm mb-3">{t("languageSelector")}</label>
            <select 
              value={language} 
              onChange={handleLanguageChange}
              className="w-full p-3 rounded-lg bg-white text-blue-900 font-medium"
            >
              <option value="en">English</option>
              <option value="pl">Polski</option>
            </select>
          </div>
          
          <button
            onClick={() => setCurrentScreen('questions')}
            className="w-full bg-white text-blue-900 font-semibold py-4 px-6 rounded-lg hover:bg-blue-50 transition-colors shadow-lg"
          >
            {t("startButton")}
          </button>
        </div>
      </div>
    </div>
  );

  const renderQuestionsScreen = () => {
    const currentQuestion = getQuestionName(currentQuestionIndex);
    
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-blue-900 text-white p-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setCurrentScreen('welcome')} className="p-2">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h2 className="font-semibold">{t("questionsTitle")}</h2>
            <div className="w-10"></div>
          </div>
          <div className="mt-4">
            <div className="bg-blue-800 rounded-full h-2">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-300"

                // 5 stands for questions, change if more
                style={{ width: `${((currentQuestionIndex + 1) / 5) * 100}%` }}
              ></div>
            </div>
            <p className="text-blue-200 text-sm mt-2">
              {currentQuestionIndex + 1} / {5}
            </p>
          </div>
        </div>
        
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            {t(`intakeQuestions.${currentQuestion}.question`)}
          </h3>‡
          
          <div className="space-y-3">
            {((t(`intakeQuestions.${currentQuestion}.${'options'}`, { returnObjects: true })) as string[]).map((option, index) => (
              <button
                key={index}
                onClick={() => handleQuestionAnswer(option)}
                className="w-full p-4 text-left bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <span className="text-gray-900">{option}</span>
                <ChevronRight className="w-5 h-5 text-gray-400 float-right mt-0.5" />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderChecklistScreen = () => {
    const personalizedTasks = generatePersonalizedTasks(userProfile);
    
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-blue-900 text-white p-4">
          <h2 className="font-semibold text-center">{t("checklistTitle")}</h2>
          <div className="mt-4 flex justify-between text-sm">
            <span>{t("completed")}: {completedTasks.length}</span>
            <span>{t("pending")}: {personalizedTasks.length - completedTasks.length}</span>
          </div>
        </div>
        
        <div className="p-4 space-y-3 pb-24">
          {personalizedTasks.map((taskId) => {
            const tasks = t('tasks', { returnObjects: true }) as Tasks;
            const task = tasks[taskId];
            const isCompleted = completedTasks.includes(taskId);
            const IconComponent = getIconComponent(task.icon);
            
            return (
              <div key={taskId} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-full ${isCompleted ? 'bg-green-100' : 'bg-blue-100'}`}>
                    <IconComponent className={`w-6 h-6 ${isCompleted ? 'text-green-600' : 'text-blue-600'}`} />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{task.title}</h3>
                    <p className="text-gray-600 text-sm">{task.description}</p>
                  </div>
                  
                  <button
                    onClick={() => toggleTaskCompletion(taskId)}
                    className="ml-auto"
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-400" />
                    )}
                  </button>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <button className="text-blue-600 text-sm font-medium flex items-center">
                    {t("viewDetails")}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="flex space-x-4">
            <button
              onClick={() => setCurrentScreen('welcome')}
              className="flex-1 flex items-center justify-center space-x-2 py-3 bg-gray-100 rounded-lg"
            >
              <Home className="w-5 h-5 text-gray-600" />
              <span className="text-gray-600 font-medium">{t("homeButton")}</span>
            </button>
            <button
              onClick={() => setCurrentScreen('questions')}
              className="flex-1 flex items-center justify-center space-x-2 py-3 bg-blue-100 rounded-lg"
            >
              <User className="w-5 h-5 text-blue-600" />
              <span className="text-blue-600 font-medium">{t("profileButton")}</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

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
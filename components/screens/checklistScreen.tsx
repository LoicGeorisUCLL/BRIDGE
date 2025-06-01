  'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Home, User, CheckCircle, Circle, MapPin, FileText, Globe, Phone, Building, CreditCard, Shield, Briefcase } from 'lucide-react';
import { Screen, UserProfile, Question, Task, Tasks } from '@/types';
import { Language, Translations } from '@/types';
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { generatePersonalizedTasks } from '../logic/taskLogic';

  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  
  
  const {t} = useTranslation();


    // Save data to localStorage
  const saveData = (profile: UserProfile, tasks: string[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bridgeProfile', JSON.stringify(profile));
      localStorage.setItem('bridgeCompletedTasks', JSON.stringify(tasks));
    }
  };

  
  const toggleTaskCompletion = (taskId: string) => {
    const newCompletedTasks = completedTasks.includes(taskId)
      ? completedTasks.filter(id => id !== taskId)
      : [...completedTasks, taskId];
    
    setCompletedTasks(newCompletedTasks);
    saveData(userProfile, newCompletedTasks);
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



 

  export const renderChecklistScreen = () => {
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
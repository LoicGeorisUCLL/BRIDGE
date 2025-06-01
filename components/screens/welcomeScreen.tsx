'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Home, User, CheckCircle, Circle, MapPin, FileText, Globe, Phone, Building, CreditCard, Shield, Briefcase } from 'lucide-react';
import { Screen, UserProfile, Question, Task, Tasks } from '@/types';
import { Language, Translations } from '@/types';
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";

const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
const [userProfile, setUserProfile] = useState<UserProfile>({});
const [completedTasks, setCompletedTasks] = useState<string[]>([]);
const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
const [mounted, setMounted] = useState(false);

const {t} = useTranslation();

const router = useRouter();
const { locale, pathname, asPath, query } = router;

const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
      const newLang = event.target.value as Language;
      localStorage.setItem('bridgeLanguage', newLang);

      router.push({ pathname, query }, asPath, { locale: newLang });
};

export const renderWelcomeScreen = () => (
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
              value={locale || 'en'} 
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
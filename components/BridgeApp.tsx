'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Home, User, CheckCircle, Circle, MapPin, FileText, Globe, Phone, Building, CreditCard, Shield, Briefcase } from 'lucide-react';

interface UserProfile {
  duration?: string;
  workType?: string;
  experience?: string;
  housing?: string;
  family?: string;
}

interface Question {
  question: string;
  options: string[];
}

interface Task {
  title: string;
  description: string;
  icon: string;
}

interface Tasks {
  [key: string]: Task;
}

interface Translations {
  welcome: string;
  subtitle: string;
  startButton: string;
  languageSelector: string;
  backButton: string;
  nextButton: string;
  homeButton: string;
  profileButton: string;
  questionsTitle: string;
  checklistTitle: string;
  taskCompleted: string;
  taskPending: string;
  viewDetails: string;
  completed: string;
  pending: string;
  questions: Question[];
  tasks: Tasks;
}

type Language = 'pl' | 'en';
type Screen = 'welcome' | 'questions' | 'checklist';

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

  const translations: Record<Language, Translations> = {
    pl: {
      welcome: 'Witamy w Bridge',
      subtitle: 'Twój przewodnik po belgijskiej administracji',
      startButton: 'Rozpocznij',
      languageSelector: 'Wybierz język',
      backButton: 'Wstecz',
      nextButton: 'Dalej',
      homeButton: 'Strona główna',
      profileButton: 'Profil',
      questionsTitle: 'Kilka pytań o Twoją sytuację',
      checklistTitle: 'Twoja lista zadań',
      taskCompleted: 'Ukończone',
      taskPending: 'Do zrobienia',
      viewDetails: 'Zobacz szczegóły',
      completed: 'Ukończone',
      pending: 'Oczekujące',
      questions: [
        {
          question: 'Jak długo planujesz zostać w Belgii?',
          options: ['Mniej niż 3 miesiące', '3-6 miesięcy', 'Więcej niż 6 miesięcy', 'Nie jestem pewien']
        },
        {
          question: 'Jaki rodzaj pracy będziesz wykonywać?',
          options: ['Praca w rolnictwie', 'Praca budowlana', 'Usługi', 'Inne']
        },
        {
          question: 'Czy to Twój pierwszy pobyt w Belgii?',
          options: ['Tak, pierwszy raz', 'Nie, byłem wcześniej', 'Pracuję tu regularnie']
        },
        {
          question: 'Czy masz już mieszkanie?',
          options: ['Tak, zapewnione przez pracodawcę', 'Tak, wynajmuję sam', 'Nie, jeszcze szukam', 'Mieszkam z rodziną/znajomymi']
        },
        {
          question: 'Czy przyjeżdżasz z rodziną?',
          options: ['Tak, z rodziną', 'Nie, sam', 'Tylko z małżonkiem', 'Z dziećmi']
        }
      ],
      tasks: {
        limosa: {
          title: 'Rejestracja LIMOSA',
          description: 'Zgłoszenie pracy sezonowej',
          icon: 'FileText'
        },
        municipality: {
          title: 'Rejestracja w gminie',
          description: 'Zameldowanie w urzędzie miasta',
          icon: 'Building'
        },
        health: {
          title: 'Ubezpieczenie zdrowotne',
          description: 'Zapisanie się do ubezpieczenia',
          icon: 'Shield'
        },
        bank: {
          title: 'Konto bankowe',
          description: 'Otwarcie konta w banku',
          icon: 'CreditCard'
        },
        tax: {
          title: 'Numer podatkowy',
          description: 'Rejestracja podatkowa',
          icon: 'FileText'
        },
        emergency: {
          title: 'Kontakt alarmowy',
          description: 'Ustawienie kontaktu awaryjnego',
          icon: 'Phone'
        }
      }
    },
    en: {
      welcome: 'Welcome to Bridge',
      subtitle: 'Your guide through Belgian administration',
      startButton: 'Get Started',
      languageSelector: 'Select Language',
      backButton: 'Back',
      nextButton: 'Next',
      homeButton: 'Home',
      profileButton: 'Profile',
      questionsTitle: 'A few questions about your situation',
      checklistTitle: 'Your task list',
      taskCompleted: 'Completed',
      taskPending: 'To do',
      viewDetails: 'View details',
      completed: 'Completed',
      pending: 'Pending',
      questions: [
        {
          question: 'How long do you plan to stay in Belgium?',
          options: ['Less than 3 months', '3-6 months', 'More than 6 months', 'Not sure']
        },
        {
          question: 'What type of work will you be doing?',
          options: ['Agricultural work', 'Construction work', 'Services', 'Other']
        },
        {
          question: 'Is this your first time in Belgium?',
          options: ['Yes, first time', 'No, I\'ve been before', 'I work here regularly']
        },
        {
          question: 'Do you already have accommodation?',
          options: ['Yes, provided by employer', 'Yes, I rent myself', 'No, still looking', 'Living with family/friends']
        },
        {
          question: 'Are you traveling with family?',
          options: ['Yes, with family', 'No, alone', 'Only with spouse', 'With children']
        }
      ],
      tasks: {
        limosa: {
          title: 'LIMOSA Registration',
          description: 'Seasonal work declaration',
          icon: 'FileText'
        },
        municipality: {
          title: 'Municipal Registration',
          description: 'Register at town hall',
          icon: 'Building'
        },
        health: {
          title: 'Health Insurance',
          description: 'Enroll in health insurance',
          icon: 'Shield'
        },
        bank: {
          title: 'Bank Account',
          description: 'Open a bank account',
          icon: 'CreditCard'
        },
        tax: {
          title: 'Tax Number',
          description: 'Tax registration',
          icon: 'FileText'
        },
        emergency: {
          title: 'Emergency Contact',
          description: 'Set up emergency contact',
          icon: 'Phone'
        }
      }
    }
  };

  const t = translations[language];

  const generatePersonalizedTasks = (profile: UserProfile): string[] => {
    const allTasks = ['limosa'];
    
    // Add municipality registration if staying more than 3 months
    if (profile.duration === 'Więcej niż 6 miesięcy' || profile.duration === 'More than 6 months') {
      allTasks.push('municipality');
    }
    
    // Always add health insurance and bank account
    allTasks.push('health', 'bank');
    
    // Add tax number if staying longer or working regularly
    if (profile.duration !== 'Mniej niż 3 miesiące' && profile.duration !== 'Less than 3 months') {
      allTasks.push('tax');
    }
    
    // Always add emergency contact
    allTasks.push('emergency');
    
    return allTasks;
  };

  const handleQuestionAnswer = (answer: string) => {
    const updatedProfile = {
      ...userProfile,
      [currentQuestionIndex === 0 ? 'duration' : 
       currentQuestionIndex === 1 ? 'workType' : 
       currentQuestionIndex === 2 ? 'experience' : 
       currentQuestionIndex === 3 ? 'housing' : 'family']: answer
    };
    
    setUserProfile(updatedProfile);
    
    if (currentQuestionIndex < t.questions.length - 1) {
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

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    saveData(userProfile, completedTasks, newLanguage);
  };

  const renderWelcomeScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex flex-col">
      <div className="flex-1 flex flex-col justify-center items-center text-center px-6">
        <div className="mb-8">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 mx-auto shadow-lg">
            <Building className="w-12 h-12 text-blue-800" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">{t.welcome}</h1>
          <p className="text-blue-100 text-lg mb-8 max-w-md">{t.subtitle}</p>
        </div>
        
        <div className="w-full max-w-sm space-y-4">
          <div className="mb-6">
            <label className="block text-blue-100 text-sm mb-3">{t.languageSelector}</label>
            <select 
              value={language} 
              onChange={(e) => handleLanguageChange(e.target.value as Language)}
              className="w-full p-3 rounded-lg bg-white text-blue-900 font-medium"
            >
              <option value="pl">Polski</option>
              <option value="en">English</option>
            </select>
          </div>
          
          <button
            onClick={() => setCurrentScreen('questions')}
            className="w-full bg-white text-blue-900 font-semibold py-4 px-6 rounded-lg hover:bg-blue-50 transition-colors shadow-lg"
          >
            {t.startButton}
          </button>
        </div>
      </div>
    </div>
  );

  const renderQuestionsScreen = () => {
    const currentQuestion = t.questions[currentQuestionIndex];
    
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-blue-900 text-white p-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setCurrentScreen('welcome')} className="p-2">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h2 className="font-semibold">{t.questionsTitle}</h2>
            <div className="w-10"></div>
          </div>
          <div className="mt-4">
            <div className="bg-blue-800 rounded-full h-2">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / t.questions.length) * 100}%` }}
              ></div>
            </div>
            <p className="text-blue-200 text-sm mt-2">
              {currentQuestionIndex + 1} z {t.questions.length}
            </p>
          </div>
        </div>
        
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            {currentQuestion.question}
          </h3>
          
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
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
          <h2 className="font-semibold text-center">{t.checklistTitle}</h2>
          <div className="mt-4 flex justify-between text-sm">
            <span>{t.completed}: {completedTasks.length}</span>
            <span>{t.pending}: {personalizedTasks.length - completedTasks.length}</span>
          </div>
        </div>
        
        <div className="p-4 space-y-3 pb-24">
          {personalizedTasks.map((taskId) => {
            const task = t.tasks[taskId];
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
                    {t.viewDetails}
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
              <span className="text-gray-600 font-medium">{t.homeButton}</span>
            </button>
            <button
              onClick={() => setCurrentScreen('questions')}
              className="flex-1 flex items-center justify-center space-x-2 py-3 bg-blue-100 rounded-lg"
            >
              <User className="w-5 h-5 text-blue-600" />
              <span className="text-blue-600 font-medium">{t.profileButton}</span>
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
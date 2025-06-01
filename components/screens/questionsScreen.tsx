import React, { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useTranslation } from "next-i18next";
import { Language, Screen, UserProfile } from '@/types';


interface QuestionsScreenProps {
  setUserProfile: (profile: any) => void;
  userProfile: UserProfile;
  onBack: () => void;
  saveData: (profile: UserProfile, tasks: string[], lang: Language) => void;
  completedTasks: string[];
  language: Language;
  setCurrentScreen: (screen: Screen) => void;
}


const QuestionsScreen: React.FC<QuestionsScreenProps> = ({
  setUserProfile,
  userProfile,
  onBack,
  saveData,
  completedTasks,
  language,
  setCurrentScreen
}) => {

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  const { t } = useTranslation();

  const TOTAL_QUESTIONS = 5;

  const getQuestionName = (index: number): string => {
    const name = index === 0 ? "duration" : 
     index === 1 ? "workType" : 
     index === 2 ? "experience" : 
     index === 3 ? "housing" : 
     "family"
     return name;
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

  const currentQuestion = getQuestionName(currentQuestionIndex);
  const currentAnswer = userProfile[currentQuestion as keyof UserProfile] || "";


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-900 text-white p-4">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="p-2">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2 className="font-semibold">{t("questionsTitle")}</h2>
          <div className="w-10"></div>
        </div>
        <div className="mt-4">
          <div className="bg-blue-800 rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / TOTAL_QUESTIONS) * 100}%` }}
            ></div>
          </div>
          <p className="text-blue-200 text-sm mt-2">
            {currentQuestionIndex + 1} / {TOTAL_QUESTIONS}
          </p>
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          {t(`intakeQuestions.${currentQuestion}.question`)}
        </h3>
        
        <div className="space-y-3">
          {((t(`intakeQuestions.${currentQuestion}.${"options"}`, { returnObjects: true })) as string[]).map((option, index) => (
            <button
              key={index}
              onClick={() => handleQuestionAnswer(option)}
              className={`w-full p-4 text-left rounded-lg border transition-colors ${
                    currentAnswer === option 
                      ? "bg-green-100 border-green-500 hover:bg-green-200" 
                      : "bg-white border-gray-200 hover:border-blue-500 hover:bg-blue-50"
                  }`}
            >
              <span className="text-gray-900">{option}</span>
              <ChevronRight className={`w-5 h-5 float-right mt-0.5 ${ currentAnswer === option? "text-green-600": "text-gray-400"}`} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuestionsScreen;
import React, { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useTranslation } from "next-i18next";
import { Screen, UserProfile } from '@/types';
import NoEUPopup from '../popups/noEUPopup';

interface QuestionsScreenProps {
  setUserProfile: (profile: any) => void;
  userProfile: UserProfile;
  saveData: (profile: UserProfile, tasks: string[]) => void;
  completedTasks: string[];
  setCurrentScreen: (screen: Screen) => void;
}

const QuestionsScreen: React.FC<QuestionsScreenProps> = ({
  setUserProfile,
  userProfile,
  saveData,
  completedTasks,
  setCurrentScreen
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showNoEUPopup, setShowNoEUPopup] = useState(false);
  const { t } = useTranslation();

  const TOTAL_QUESTIONS = 6;

  const getQuestionName = (index: number): string => {
    const name = index === 0 ? "europeanID" :
      index === 1 ? "contract" :
      index === 2 ? "plukkaart" :
      index === 3 ? "duration" :
      index === 4 ? "workProvince" :
      "bankAccount"
    return name;
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
    else if (currentQuestionIndex === 0)
      setCurrentScreen('welcome');
  };

  const handleQuestionAnswer = (index: number) => {
    const key = getQuestionName(currentQuestionIndex);
    
    if (key === "europeanID" && index === 1) {
      setShowNoEUPopup(true);
      return;
    }

    const updatedProfile = {
      ...userProfile,
      [key]: index,
    };
    setUserProfile(updatedProfile);

    if (currentQuestionIndex < TOTAL_QUESTIONS - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      saveData(updatedProfile, completedTasks);
    } else {
      setCurrentScreen('checklist');
    }
  };

  const handleCloseNoEUPopup = () => {
    setShowNoEUPopup(false);
  };

  const currentQuestion = getQuestionName(currentQuestionIndex);
  const currentAnswer = userProfile[currentQuestion as keyof UserProfile] ?? null;
  console.log(currentAnswer)

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-blue-900 text-white p-4">
          <div className="flex items-center justify-between">
            <button onClick={handleBack} className="p-2">
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
                onClick={() => handleQuestionAnswer(index)}
                className={`w-full p-4 text-left rounded-lg border transition-colors ${
                  currentAnswer !== null && parseInt(currentAnswer) === index
                    ? "bg-green-100 border-green-500 hover:bg-green-200"
                    : "bg-white border-gray-200 hover:border-blue-500 hover:bg-blue-50"
                }`}
              >
                <span className="text-gray-900">{option}</span>
                <ChevronRight className={`w-5 h-5 float-right mt-0.5 ${ currentAnswer !== null && parseInt(currentAnswer) === index? "text-green-600": "text-gray-400"}`} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <NoEUPopup 
        show={showNoEUPopup} 
        onClose={handleCloseNoEUPopup} 
      />
    </>
  );
};

export default QuestionsScreen;
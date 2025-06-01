import React from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useTranslation } from "next-i18next";

interface QuestionsScreenProps {
  currentQuestionIndex: number;
  totalQuestions: number;
  onBack: () => void;
  onAnswer: (answer: string) => void;
}

const QuestionsScreen: React.FC<QuestionsScreenProps> = ({
  currentQuestionIndex,
  totalQuestions,
  onBack,
  onAnswer
}) => {
  const { t } = useTranslation();

  const getQuestionName = (index: number): string => {
    const name = index === 0 ? 'duration' : 
     index === 1 ? 'workType' : 
     index === 2 ? 'experience' : 
     index === 3 ? 'housing' : 
     'family'
     return name;
  };

  const currentQuestion = getQuestionName(currentQuestionIndex);
  
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
              style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
            ></div>
          </div>
          <p className="text-blue-200 text-sm mt-2">
            {currentQuestionIndex + 1} / {totalQuestions}
          </p>
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          {t(`intakeQuestions.${currentQuestion}.question`)}
        </h3>
        
        <div className="space-y-3">
          {((t(`intakeQuestions.${currentQuestion}.${'options'}`, { returnObjects: true })) as string[]).map((option, index) => (
            <button
              key={index}
              onClick={() => onAnswer(option)}
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

export default QuestionsScreen;
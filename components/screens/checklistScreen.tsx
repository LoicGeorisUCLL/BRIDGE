import React, { use, useEffect, useState } from 'react';
import { Home, User, CheckCircle, Circle, ChevronRight, MapPin, FileText, Globe, Phone, Building, CreditCard, Shield, Briefcase, Trophy, X, RotateCcw } from 'lucide-react';
import { UserProfile, Tasks } from '@/types';
import { useTranslation } from "next-i18next";
import { generatePersonalizedTasks } from '../logic/logic';
import { useRouter } from 'next/router';
import { HelpCircle } from "lucide-react";



interface ChecklistScreenProps {
  userProfile: UserProfile;
  completedTasks: string[];
  onToggleTask: (taskId: string) => void;
  onGoHome: () => void;
  onGoToProfile: () => void;
  onResetAndGoToWelcome?: () => void;
}

const ChecklistScreen: React.FC<ChecklistScreenProps> = ({
  userProfile,
  completedTasks,
  onToggleTask,
  onGoHome,
  onGoToProfile,
  onResetAndGoToWelcome
}) => {

const [showCongratulations, setShowCongratulations] = useState(false);
const [selectedTaskDetails, setSelectedTaskDetails] = useState<string | null>(null);
const [showFAQ, setShowFAQ] = useState(false);
const faqButtonRef = React.useRef<HTMLButtonElement>(null);




const { t: tt } = useTranslation("tasks");
const { t } = useTranslation("common");
const router = useRouter();

const personalizedTasks = generatePersonalizedTasks(userProfile);
const allCompleted = completedTasks.length === personalizedTasks.length;

useEffect(() => {
    if (allCompleted && personalizedTasks.length > 0) {
      setShowCongratulations(true);
    }
  }, [allCompleted, personalizedTasks.length]);
  

  

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, React.ComponentType<{ className?: string }>> = {
      FileText,
      Building,
      Shield,
      CreditCard,
      MapPin,
      Briefcase
    };
    return icons[iconName] || FileText;
  };

  const handleCloseCongratulations = () => {
    setShowCongratulations(false);
  };

  const handleViewDetails = (taskId: string) => {
    setSelectedTaskDetails(taskId);
  };

  const handleCloseDetails = () => {
    setSelectedTaskDetails(null);
  };
  
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
          console.log(personalizedTasks);
          console.log(taskId);
          console.log(tt(`tasks`)) 
          const tasks = tt('tasks', { returnObjects: true }) as Tasks;
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
                  onClick={() => onToggleTask(taskId)}
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
                <button 
                  onClick={() => handleViewDetails(taskId)}
                  className="text-blue-600 text-sm font-medium flex items-center hover:text-blue-900 transition-colors"
                >
                  {t("viewDetails")}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-md mx-auto">
        <div className="flex space-x-4">
          <button
            onClick={onGoHome}
            className="flex-1 flex items-center justify-center space-x-2 py-3 bg-gray-100 rounded-lg"
          >
            <Home className="w-5 h-5 text-gray-600" />
            <span className="text-gray-600 font-medium">{t("homeButton")}</span>
          </button>
          <button
            onClick={onGoToProfile}
            className="flex-1 flex items-center justify-center space-x-2 py-3 bg-blue-100 rounded-lg"
          >
            <User className="w-5 h-5 text-blue-600" />
            <span className="text-blue-600 font-medium">{t("editProfileButton")}</span>
          </button>
          <button
            ref={faqButtonRef}
            onClick={() => setShowFAQ(true)}
            className="flex items-center justify-center p-3 rounded-lg bg-gray-100">
            <HelpCircle className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>


      {selectedTaskDetails && (

        <div className="fixed inset-0 bg-gray-200/75 flex items-center justify-center p-4 z-50">
          <div className="relative bg-white rounded-lg p-6 max-w-sm w-full mx-4 text-left max-h-[80vh] overflow-auto">
            <button
              onClick={handleCloseDetails}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {(() => {
              const tasks = t('tasks', { returnObjects: true }) as Tasks;
              const task = tasks[selectedTaskDetails];
              const IconComponent = getIconComponent(task.icon);
              const isCompleted = completedTasks.includes(selectedTaskDetails);
              
              return (
                <>
                  <div className="flex items-center space-x-3 mb-6">
                    <div className={`p-3 rounded-full ${isCompleted ? 'bg-green-100' : 'bg-blue-100'}`}>
                      <IconComponent className={`w-8 h-8 ${isCompleted ? 'text-green-600' : 'text-blue-600'}`} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{task.title}</h3>
                      <p className="text-gray-600">{task.description}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">
                      {t("stepsToComplete")}
                    </h4>
                    
                    {task.steps && task.steps.length > 0 ? (
                      <div className="space-y-3">
                        {task.steps.map((step: string, index: number) => (
                          <div key={index} className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                              {index + 1}
                            </div>
                            <p className="text-gray-700 text-sm leading-relaxed">{step}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600 text-sm italic">
                        {t("detailedStepsComingSoon")}
                      </p>
                    )}

                    {task.documents && task.documents.length > 0 && (
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <h5 className="font-medium text-gray-900 mb-2">
                          {t("requiredDocuments")}
                        </h5>
                        <ul className="space-y-1">
                          {task.documents.map((doc: string, index: number) => (
                            <li key={index} className="text-sm text-gray-600 flex items-center">
                              <FileText className="w-4 h-4 mr-2 text-gray-400" />
                              {doc}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {task.estimatedTime && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>{t("estimatedTime")}:</strong> {task.estimatedTime}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200 flex space-x-3">
                    <button
                      onClick={() => {
                        onToggleTask(selectedTaskDetails);
                        handleCloseDetails();
                      }}
                      className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                        isCompleted
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isCompleted ? t("markIncomplete") : t("markComplete")}
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {showCongratulations && (
        <div className="fixed inset-0 bg-gray-200/75 flex items-center justify-center p-4 z-50">
          <div className="relative bg-white rounded-lg p-6 max-w-sm w-full mx-4 text-center">
            <button
              onClick={handleCloseCongratulations}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <Trophy className="w-16 h-16 text-blue-500 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {t("congratulations")}
              </h3>
              <p className="text-gray-600">
                {t("congratulationsMessage")}
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={onResetAndGoToWelcome}
                className="w-full flex items-center justify-center space-x-2 py-3 bg-blue-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
                <span>{t("startOver")}</span>
              </button>
            </div>
          </div>
        </div>
      )}
       {showFAQ && (
        <div className="fixed inset-0 bg-gray-200/75 flex items-center justify-center p-4 z-50">
          <div className="relative bg-white rounded-lg p-6 max-w-sm w-full mx-4 text-left max-h-[80vh] overflow-auto">
            <button
              onClick={() => setShowFAQ(false)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-blue-600 mb-4">{t("faqTitle")}</h3>

            {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => {
              const question = t(`faq.faq${num}.question`);
              const answer = t(`faq.faq${num}.answer`);

              return (
                <div key={num} className="mb-4">
                  <h4 className="font-semibold text-blue-900">{question}</h4>
                  <p className="text-sm text-gray-700 mt-1">{answer}</p>
                </div>
              );
              
            })}
            
          </div>
        </div>
        )}
    </div>
    
  );
};

export default ChecklistScreen;
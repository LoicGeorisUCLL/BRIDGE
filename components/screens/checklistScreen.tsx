import React, { useEffect, useState } from 'react';
import { Home, User, CheckCircle, Circle, ChevronRight, MapPin, FileText, Globe, Phone, Building, CreditCard, Shield, Briefcase, Trophy, X, RotateCcw } from 'lucide-react';
import { UserProfile, Tasks } from '@/types';
import { useTranslation } from "next-i18next";
import { generatePersonalizedTasks } from '../logic/taskLogic';
import { useRouter } from 'next/router';

interface ChecklistScreenProps {
  userProfile: UserProfile;
  completedTasks: string[];
  onToggleTask: (taskId: string) => void;
  onGoHome: () => void;
  onGoToProfile: () => void;
}

const ChecklistScreen: React.FC<ChecklistScreenProps> = ({
  userProfile,
  completedTasks,
  onToggleTask,
  onGoHome,
  onGoToProfile
}) => {

const [showCongratulations, setShowCongratulations] = useState(false);

const { t } = useTranslation();
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
      Phone,
      MapPin,
      Briefcase
    };
    return icons[iconName] || FileText;
  };


  const handleCloseCongratulations = () => {
    setShowCongratulations(false);
  };

  const handleResetAndGoToWelcome = () => {
    localStorage.clear();
    router.reload()
    onGoHome();
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
                <button className="text-blue-600 text-sm font-medium flex items-center">
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
        </div>
      </div>


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
                      onClick={handleResetAndGoToWelcome}
                      className="w-full flex items-center justify-center space-x-2 py-3 bg-blue-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <RotateCcw className="w-5 h-5" />
                      <span>{t("startOver")}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

      
    </div>
  );
};

export default ChecklistScreen;
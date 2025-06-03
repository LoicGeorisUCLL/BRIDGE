import React from 'react';
import { Building } from 'lucide-react';
import { Language } from '@/types';
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";

interface WelcomeScreenProps {
  language: Language;
  onStart: () => void;
  onLanguageChange: (language: Language) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  language,
  onStart,
  onLanguageChange
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { pathname, asPath, query } = router;

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = event.target.value as Language;
    onLanguageChange(newLang);
    router.push({ pathname, query }, asPath, { locale: newLang });
  };

  return (
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
              <option value="ro">Română</option>
            </select>
          </div>
          
          <button
            onClick={onStart}
            className="w-full bg-white text-blue-900 font-semibold py-4 px-6 rounded-lg hover:bg-blue-50 transition-colors shadow-lg"
          >
            {t("startButton")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
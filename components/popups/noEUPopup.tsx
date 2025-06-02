import React from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useTranslation } from "next-i18next";

interface NoEUPopupProps {
  show: boolean;
  onClose: () => void;
}

const NoEUPopup: React.FC<NoEUPopupProps> = ({ show, onClose }) => {
  const { t } = useTranslation();

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-gray-200/75 flex items-center justify-center p-4 z-50">
      <div className="relative bg-white rounded-lg p-6 max-w-sm w-full mx-4 text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="mb-4">
          <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {t("noEUTitle")}
          </h3>
          <p className="text-gray-600">
            {t("noEUMessage")}
          </p>
        </div>
        <div className="space-y-3">
          <button
            onClick={onClose}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t("understood")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoEUPopup;
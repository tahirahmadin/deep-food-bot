import React from "react";
import { X } from "lucide-react";

interface StyleChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentStyle: string;
  newStyle: string;
}

export const StyleChangeModal: React.FC<StyleChangeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentStyle,
  newStyle,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-xl shadow-lg w-full max-w-sm mx-4 animate-slide-up">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">
              Change Conversation Style
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex-1 text-center">
              <img
                src={
                  currentStyle === "Gobbl"
                    ? "https://gobbl-bucket.s3.ap-south-1.amazonaws.com/tapAssets/gobbl_coin.webp"
                    : currentStyle === "Trump"
                    ? "https://images.unsplash.com/photo-1580128660010-fd027e1e587a?q=80&w=1964&auto=format&fit=crop"
                    : "https://img.delicious.com.au/D-EUAdrh/w759-h506-cfill/del/2017/06/gordon-ramsay-47340-2.jpg"
                }
                alt={currentStyle}
                className="w-12 h-12 rounded-full object-cover mx-auto mb-2"
              />
              <p className="text-sm font-medium text-gray-600">
                {currentStyle}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
              <X className="w-4 h-4 text-red-500" />
            </div>
            <div className="flex-1 text-center">
              <img
                src={
                  newStyle === "Gobbl"
                    ? "https://gobbl-bucket.s3.ap-south-1.amazonaws.com/tapAssets/gobbl_coin.webp"
                    : newStyle === "Trump"
                    ? "https://images.unsplash.com/photo-1580128660010-fd027e1e587a?q=80&w=1964&auto=format&fit=crop"
                    : "https://img.delicious.com.au/D-EUAdrh/w759-h506-cfill/del/2017/06/gordon-ramsay-47340-2.jpg"
                }
                alt={newStyle}
                className="w-12 h-12 rounded-full object-cover mx-auto mb-2"
              />
              <p className="text-sm font-medium text-gray-600">{newStyle}</p>
            </div>
          </div>
          <p className="text-gray-600 text-sm text-center">
            Changing the conversation style will clear your current chat
            history. Would you like to continue?
          </p>
        </div>

        <div className="p-4 border-t flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

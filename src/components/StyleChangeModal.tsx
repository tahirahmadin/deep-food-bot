import React from "react";
import { X, ArrowRight } from "lucide-react";
import { useFiltersContext } from "../context/FiltersContext";

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

  const { theme } = useFiltersContext();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        style={{ backgroundColor: theme.modalBg }}
      />
      <div
        className="relative rounded-xl shadow-lg w-full max-w-sm animate-slide-up overflow-hidden"
        style={{ backgroundColor: theme.modalBg }}
      >
        <div
          className="p-4 border-b"
          style={{ backgroundColor: theme.modalBgLight }}
        >
          <div className="flex items-center justify-between">
            <h3
              className="text-lg font-semibold"
              style={{ color: theme.modalSecondText }}
            >
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

        <div className="p-4 " style={{ backgroundColor: theme.modalBg }}>
          <div className="flex items-center justify-between gap-6 mb-6">
            {/* Current Style */}
            <div className="flex-1 text-center relative">
              <div className="w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden ring-4 ring-white shadow-lg">
                <img
                  src={
                    currentStyle === "Gobbl"
                      ? "https://gobbl-bucket.s3.ap-south-1.amazonaws.com/tapAssets/gobbl_coin.webp"
                      : currentStyle === "Trump"
                      ? "https://images.unsplash.com/photo-1580128660010-fd027e1e587a?q=80&w=1964&auto=format&fit=crop"
                      : currentStyle === "CZ Binance"
                      ? "https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcSnI1JQg6mXsN66qOzLiX2n5IOgWYBXi01rzQeEQto8EiGsWnZUCvv6jN3A5KrBIhVh2VvRfI6_KbtkLRin1G0Bsg"
                      : "https://img.delicious.com.au/D-EUAdrh/w759-h506-cfill/del/2017/06/gordon-ramsay-47340-2.jpg"
                  }
                  alt={currentStyle}
                  className="w-full h-full object-cover"
                />
              </div>
              <p
                className="text-sm font-semibold"
                style={{ color: theme.primary }}
              >
                {currentStyle}
              </p>
              <p className="text-xs" style={{ color: theme.modalMainText }}>
                Current Style
              </p>
            </div>

            {/* Arrow */}
            <div className="flex flex-col items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-orange-600" />
              </div>
            </div>

            {/* New Style */}
            <div className="flex-1 text-center relative">
              <div className="w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden ring-4 ring-white shadow-lg">
                <img
                  src={
                    newStyle === "Gobbl"
                      ? "https://gobbl-bucket.s3.ap-south-1.amazonaws.com/tapAssets/gobbl_coin.webp"
                      : newStyle === "Trump"
                      ? "https://images.unsplash.com/photo-1580128660010-fd027e1e587a?q=80&w=1964&auto=format&fit=crop"
                      : newStyle === "CZ Binance"
                      ? "https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcSnI1JQg6mXsN66qOzLiX2n5IOgWYBXi01rzQeEQto8EiGsWnZUCvv6jN3A5KrBIhVh2VvRfI6_KbtkLRin1G0Bsg"
                      : "https://img.delicious.com.au/D-EUAdrh/w759-h506-cfill/del/2017/06/gordon-ramsay-47340-2.jpg"
                  }
                  alt={newStyle}
                  className="w-full h-full object-cover"
                />
              </div>
              <p
                className="text-sm font-semibold"
                style={{ color: theme.primary }}
              >
                {newStyle}
              </p>
              <p
                className="text-xs text-gray-500"
                style={{ color: theme.modalMainText }}
              >
                New Style
              </p>
            </div>
          </div>
          <div
            className="rounded-lg p-3 text-center"
            style={{ backgroundColor: theme.modalBgLight }}
          >
            <p className=" text-sm" style={{ color: theme.modalSecondText }}>
              Changing the conversation style will clear your current chat
              history.
            </p>
            <p className="text-orange-600 text-xs mt-1">
              Would you like to continue?
            </p>
          </div>
        </div>

        <div className="p-4 border-t flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
            style={{ backgroundColor: theme.primary, color: theme.background }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

import React from "react";
import { X } from "lucide-react";
import { useFiltersContext } from "../context/FiltersContext";

interface RestaurantChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const RestaurantChangeModal: React.FC<RestaurantChangeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  const { theme } = useFiltersContext();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative rounded-xl shadow-lg w-full max-w-sm mx-4 animate-slide-up"
        style={{ backgroundColor: theme.modalBg }}
      >
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3
              className="text-lg font-semibold"
              style={{ color: theme.modalMainText }}
            >
              Change Restaurant
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" style={{ color: theme.modalMainText }} />
            </button>
          </div>
        </div>

        <div className="p-4">
          <p
            className="opacity-90 text-sm"
            style={{ color: theme.modalMainText }}
          >
            Changing restaurants will clear your current cart. Are you sure you
            want to continue?
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
            style={{ backgroundColor: theme.primary, color: theme.background }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

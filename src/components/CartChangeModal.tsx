import React from "react";
import { X, Store } from "lucide-react";
import { useFiltersContext } from "../context/FiltersContext";

interface CartChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentRestaurant: string;
  newRestaurant: string;
}

export const CartChangeModal: React.FC<CartChangeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentRestaurant,
  newRestaurant,
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
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex-1 text-center">
              <Store
                className="w-8 h-8 mx-auto mb-2"
                style={{ color: theme.primary }}
              />
              <p
                className="text-sm font-medium"
                style={{ color: theme.modalMainText }}
              >
                {currentRestaurant}
              </p>
            </div>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: theme.background }}
            >
              <X className="w-4 h-4" style={{ color: theme.primary }} />
            </div>
            <div className="flex-1 text-center">
              <Store
                className="w-8 h-8 text-primary mx-auto mb-2"
                style={{ color: theme.primary }}
              />
              <p
                className="text-sm font-medium"
                style={{ color: theme.modalMainText }}
              >
                {newRestaurant}
              </p>
            </div>
          </div>
          <p
            className="text-sm text-center"
            style={{ color: theme.modalMainText }}
          >
            Your cart has items from {currentRestaurant}. Would you like to
            clear it and add items from {newRestaurant} instead?
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

import React from "react";
import { X, ArrowRight } from "lucide-react";
import { useFiltersContext } from "../context/FiltersContext";

interface AddressChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentAddress: string;
  newAddress: string;
}

export const AddressChangeModal: React.FC<AddressChangeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentAddress,
  newAddress,
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
              Change Delivery Address
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-4" style={{ backgroundColor: theme.modalBg }}>
          <div className="flex items-center justify-between gap-6 mb-6">
            {/* Current Address */}
            <div className="flex-1 text-center">
              <p className="text-sm font-semibold" style={{ color: theme.primary }}>
                {currentAddress}
              </p>
              <p className="text-xs" style={{ color: theme.modalMainText }}>
                Current Address
              </p>
            </div>

            {/* Arrow */}
            <div className="flex flex-col items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-orange-600" />
              </div>
            </div>

            {/* New Address */}
            <div className="flex-1 text-center">
              <p className="text-sm font-semibold" style={{ color: theme.primary }}>
                {newAddress}
              </p>
              <p className="text-xs" style={{ color: theme.modalMainText }}>
                New Address
              </p>
            </div>
          </div>
          <div
            className="rounded-lg p-3 text-center"
            style={{ backgroundColor: theme.modalBgLight }}
          >
            <p className="text-sm" style={{ color: theme.modalSecondText }}>
              Changing the delivery address will clear your current conversation history.
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

import React, { useState } from "react";
import { X, Minus, Plus } from "lucide-react";
import { useChatContext } from "../context/ChatContext";

interface CustomizationOption {
  name: string;
  price?: string;
  isRequired?: boolean;
  maxSelections?: number;
  options: {
    name: string;
    price?: string;
    isDefault?: boolean;
  }[];
}

interface CustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: number;
    name: string;
    price: string;
    image?: string;
  };
}

export const CustomizationModal: React.FC<CustomizationModalProps> = ({
  isOpen,
  onClose,
  item,
}) => {
  const { dispatch } = useChatContext();
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});

  // Example customization options - you can make this dynamic based on the item
  const customizationOptions: CustomizationOption[] = [
    {
      name: "Select Bread",
      isRequired: true,
      maxSelections: 1,
      options: [
        { name: "Multigrain", isDefault: true },
        { name: "White Italian" },
      ],
    },
    {
      name: "Select Preparation Style",
      isRequired: true,
      maxSelections: 1,
      options: [{ name: "Toasted", isDefault: true }, { name: "Non-Toasted" }],
    },
    {
      name: "Choose From Add Ons",
      maxSelections: 1,
      options: [
        { name: "Cheese Slice", price: "28.57" },
        { name: "Extra Veggies", price: "20.00" },
      ],
    },
  ];

  // Initialize default selections
  React.useEffect(() => {
    const defaults: Record<string, string> = {};
    customizationOptions.forEach((category) => {
      const defaultOption = category.options.find((opt) => opt.isDefault);
      if (defaultOption) {
        defaults[category.name] = defaultOption.name;
      }
    });
    setSelectedOptions(defaults);
  }, []);

  const handleOptionSelect = (category: string, optionName: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [category]: optionName,
    }));
  };

  const calculateTotal = () => {
    let total = parseFloat(item.price);

    // Add prices from selected add-ons
    Object.entries(selectedOptions).forEach(([category, selection]) => {
      const categoryOptions = customizationOptions.find(
        (opt) => opt.name === category
      );
      const selectedOption = categoryOptions?.options.find(
        (opt) => opt.name === selection
      );
      if (selectedOption?.price) {
        total += parseFloat(selectedOption.price);
      }
    });

    return (total * quantity).toFixed(2);
  };

  const handleAddToCart = () => {
    // Validate required selections
    const missingRequired = customizationOptions
      .filter((opt) => opt.isRequired)
      .some((opt) => !selectedOptions[opt.name]);

    if (missingRequired) {
      alert("Please make all required selections");
      return;
    }

    // Format customizations for cart
    const customizations = Object.entries(selectedOptions)
      .map(([category, selection]) => `${category}: ${selection}`)
      .join(", ");

    dispatch({
      type: "ADD_TO_CART",
      payload: {
        id: item.id,
        name: `${item.name} (${customizations})`,
        price: calculateTotal(),
        quantity: quantity,
      },
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 transition-transform duration-300 ease-in-out transform ${
        isOpen ? "translate-y-0" : "translate-y-full"
      } bg-white shadow-xl w-full h-3/4 overflow-y-auto`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white overflow-hidden shadow-xl transition-all duration-300 ease-out ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ height: "92vh" }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white">
          {/* Drag indicator */}
          <div className="w-full flex justify-center py-3">
            <div className="w-12 h-1 bg-gray-200 rounded-full"></div>
          </div>

          {/* Header content */}
          <div className="px-4 pb-3 flex items-center gap-3">
            {item.image && (
              <img
                src={item.image}
                alt={item.name}
                className="w-16 h-16 object-cover rounded-lg"
              />
            )}
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-semibold text-gray-900 text-xl mb-1">
                    {item.name}
                  </h2>
                  <p className="text-sm font-medium text-primary">
                    {item.price} AED
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {customizationOptions.map((category, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">
                  {category.name}
                  {category.isRequired && (
                    <span className="text-xs text-red-500 ml-2 font-normal">
                      Required
                    </span>
                  )}
                </h3>
                <span className="text-xs text-gray-500">
                  Select{" "}
                  {category.maxSelections === 1
                    ? "1"
                    : `up to ${category.maxSelections}`}{" "}
                  option
                </span>
              </div>

              <div className="space-y-2">
                {category.options.map((option, optIdx) => (
                  <label
                    key={optIdx}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedOptions[category.name] === option.name
                        ? "border-primary bg-primary/5"
                        : "border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name={category.name}
                        checked={selectedOptions[category.name] === option.name}
                        onChange={() =>
                          handleOptionSelect(category.name, option.name)
                        }
                        className="text-primary focus:ring-primary w-4 h-4"
                      />
                      <span className="text-sm font-medium text-gray-800">
                        {option.name}
                      </span>
                    </div>
                    {option.price && (
                      <span className="text-sm font-medium text-gray-600">
                        +{option.price} AED
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 px-4 py-4 bg-white border-t">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-2xl font-semibold w-8 text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="text-xl font-bold text-primary">
                {calculateTotal()} AED
              </p>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            className="w-full h-14 bg-primary text-white rounded-2xl hover:bg-primary-600 transition-all shadow-lg flex items-center justify-center text-base font-medium"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

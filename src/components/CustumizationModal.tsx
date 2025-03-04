import React, { useState, useEffect } from "react";
import { X, Minus, Plus } from "lucide-react";
import { useChatContext } from "../context/ChatContext";

interface SelectedOption {
  name: string;
  price: number;
  categoryName: string;
}

export const CustomizationModal: React.FC = () => {
  const { state, dispatch } = useChatContext();
  const { isOpen, item, isEditing } = state.customization;
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, SelectedOption[]>
  >({});

  const handleClose = () => {
    setQuantity(1);
    setSelectedOptions({});
    dispatch({
      type: "SET_CUSTOMIZATION_MODAL",
      payload: { isOpen: false, item: null },
    });
  };

  // Initialize default selections
  useEffect(() => {
    if (item) {
      const defaults: Record<string, SelectedOption[]> = {};
  
      if (item.customizations) {
        item.customizations.forEach((cust) => {
          const { categoryName, selection } = cust;
          if (defaults[categoryName]) {
            defaults[categoryName].push({
              name: selection.name,
              price: selection.price,
              categoryName,
            });
          } else {
            defaults[categoryName] = [
              {
                name: selection.name,
                price: selection.price,
                categoryName,
              },
            ];
          }
        });
      } else if (item.customisation) {
        // Fallback: Use default values from full configuration
        item.customisation.categories.forEach((category) => {
          if (category.minQuantity > 0 && category.items.length > 0) {
          // For required categories, select the minimum number of default options
            defaults[category.categoryName] = [
              {
                name: category.items[0].name,
                price: category.items[0].price,
                categoryName: category.categoryName,
              },
            ];
          }
        });
      }
      setSelectedOptions(defaults);
    }
  }, [item]);
  

  const handleOptionSelect = (
    category: NonNullable<typeof item>["customisation"]["categories"][0],
    option: { name: string; price: number; _id: string }
  ) => {
    if (!category) return;

    const isRadio = category.maxQuantity === 1;
    const currentSelections = selectedOptions[category.categoryName] || [];

    if (isRadio) {
      // Radio button behavior - single selection
      setSelectedOptions((prev) => ({
        ...prev,
        [category.categoryName]: [
          {
            name: option.name,
            price: option.price,
            categoryName: category.categoryName,
          },
        ],
      }));
    } else {
      // Checkbox behavior - multiple selections
      const isSelected = currentSelections.some(
        (sel) => sel.name === option.name
      );
      let newSelections: SelectedOption[];

      if (isSelected) {
        // Remove if already selected
        newSelections = currentSelections.filter(
          (sel) => sel.name !== option.name
        );
      } else {
        // Add if within maxQuantity limit
        if (currentSelections.length < category.maxQuantity) {
          newSelections = [
            ...currentSelections,
            {
              name: option.name,
              price: option.price,
              categoryName: category.categoryName,
            },
          ];
        } else {
          alert(
            `You can only select up to ${category.maxQuantity} options for ${category.categoryName}`
          );
          return;
        }
      }

      setSelectedOptions((prev) => ({
        ...prev,
        [category.categoryName]: newSelections,
      }));
    }
  };

  const calculateTotal = () => {
    if (!item) return "0.00";
    let total = parseFloat(item.price);

    // Add prices from selected options
    Object.values(selectedOptions).forEach((selections) => {
      selections.forEach((selection) => {
        total += selection.price;
      });
    });

    return (total * quantity).toFixed(2);
  };

  const handleAddToCart = () => {
    if (!item?.customisation) return;

    // Validate required selections
    const missingRequired = item.customisation.categories
      .filter((cat) => cat.minQuantity > 0)
      .some((cat) => {
        const selections = selectedOptions[cat.categoryName] || [];
        return selections.length < cat.minQuantity;
      });

    if (missingRequired) {
      alert("Please make all required selections");
      return;
    }

    // Validate selection counts
    const invalidSelections = item.customisation.categories.some((category) => {
      const selections = selectedOptions[category.categoryName] || [];
      return (
        selections.length < category.minQuantity ||
        selections.length > category.maxQuantity
      );
    });

    if (invalidSelections) {
      alert("Please check the number of selections for each category");
      return;
    }

    // Format customizations for cart
    const customizations = Object.entries(selectedOptions).flatMap(
      ([categoryName, selections]) =>
        selections.map((selection) => ({
          categoryName,
          selection: {
            name: selection.name,
            price: selection.price,
          },
        }))
    );

    if (isEditing) {
      dispatch({
        type: "UPDATE_CART_ITEM",
        payload: {
          id: item.id,
          name: item.name,
          price: calculateTotal(),
          quantity,
          restaurant: item.restaurant ? item.restaurant : "",
          customizations,
          customisation: item.customisation,
        },
      });
    } else {
      dispatch({
        type: "ADD_TO_CART",
        payload: {
          id: item.id,
          name: item.name,
          price: calculateTotal(),
          quantity,
          restaurant: item.restaurant ? item.restaurant : "",
          customizations,
          customisation: item.customisation,
        },
      });
    }
  
    handleClose();
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full max-w-md rounded-t-xl sm:rounded-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-800">
                {item.name}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">{item.price} AED</p>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Customization Options */}
        <div className="p-3 space-y-4">
          {item.customisation?.categories.map((category) => (
            <div key={category._id} className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-800">
                  {category.categoryName}
                  {category.minQuantity > 0 && (
                    <span className="text-[10px] text-red-500 ml-1">
                      *Required
                    </span>
                  )}
                </h3>
                <span className="text-[10px] text-gray-500">
                  Select{" "}
                  {category.minQuantity === category.maxQuantity
                    ? category.minQuantity
                    : `${category.minQuantity}-${category.maxQuantity}`}
                </span>
              </div>

              <div className="space-y-1">
                {category.items.map((option) => (
                  <label
                    key={option._id}
                    className={`flex items-center justify-between p-2 rounded-lg border-2 cursor-pointer transition-all ${
                      (selectedOptions[category.categoryName] || []).some(
                        (sel) => sel.name === option.name
                      )
                        ? "border-primary bg-primary/5"
                        : "border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type={category.maxQuantity === 1 ? "radio" : "checkbox"}
                        name={category.categoryName}
                        checked={(
                          selectedOptions[category.categoryName] || []
                        ).some((sel) => sel.name === option.name)}
                        onChange={() => handleOptionSelect(category, option)}
                        className="text-primary focus:ring-primary"
                      />
                      <span className="text-[10px] font-medium text-gray-800 ">
                        {option.name}
                      </span>
                    </div>
                    {option.price > 0 && (
                      <span className="text-xs text-gray-500">
                        +{option.price.toFixed(2)} AED
                      </span>
                    )}
                  </label>
                ))}
                <p className="text-[10px] text-gray-400">
                  {(selectedOptions[category.categoryName] || []).length} of{" "}
                  {category.maxQuantity} selected
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t px-4 py-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-base font-semibold">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-base font-bold text-primary">
                {calculateTotal()} AED
              </p>
            </div>
          </div>
          <button
            onClick={handleAddToCart}
            className="w-full py-2.5 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium"
            style={{ backgroundColor: "orange" }}
          >
            {isEditing ? "Update Cart" : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
};

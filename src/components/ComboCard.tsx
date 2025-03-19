import React, { useRef, useState } from 'react';
import { ComboMeal, RecommendedItem } from '../types';
import { useFiltersContext } from '../context/FiltersContext';
import { DishDetailsModal } from './DishDetailsModal';
import { useRestaurant } from '../context/RestaurantContext';
import { getRestaurantNameById } from '../utils/menuUtils';
import { useChatContext } from '../context/ChatContext';
import { CartChangeModal } from './CartChangeModal';

const placeholderImage = "https://i.pinimg.com/originals/da/4f/c2/da4fc2360e1dcc5c85cf5eeaee4b107f.gif";

interface ComboCardProps {
  combo: ComboMeal;
  onAddToCart: (combo: ComboMeal) => void;
  onRegenerateItem?: (comboId: string, itemIndex: number, currentItemId: number, category?: string) => Promise<Record<string, RecommendedItem[]>>;
  onDeleteItem?: (comboId: string, itemIndex: number) => void;
  onReplaceItem?: (comboId: string, itemIndex: number, newItem: RecommendedItem) => void;
  similarItems?: Record<string, RecommendedItem[]>;
  isLoading?: Record<number, boolean>;
  activeItemIndex?: number | null;
  onRegenerateClick?: (itemIndex: number) => void;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
}

const ComboCard: React.FC<ComboCardProps> = ({ 
  combo, 
  onAddToCart, 
  onRegenerateItem,
  onDeleteItem,
  onReplaceItem,
  similarItems = {},
  isLoading = {},
  activeItemIndex = null,
  onRegenerateClick,
  isExpanded = false,
  onToggleExpanded
}) => {
  const { theme } = useFiltersContext();
  const { state: restaurantState, setActiveRestaurant } = useRestaurant();
  const { state, dispatch } = useChatContext();
  const [mainImageError, setMainImageError] = useState(false);
  const [itemImageErrors, setItemImageErrors] = useState<Record<number, boolean>>({});
  const [similarItemImageErrors, setSimItemImageErrors] = useState<Record<string, boolean>>({});
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const [selectedDish, setSelectedDish] = useState<{
    id: number;
    name: string;
    price: number;
    description: string;
    image?: string;
    restroId: number;
    restaurant?: string;
    isCustomisable?: boolean;
    customisation?: any;
  } | null>(null);

  const [isCartChangeModalOpen, setIsCartChangeModalOpen] = useState(false);

  if (!combo) return null;

  const mainItemId = combo.items[0]?.id;
  const actualMainImageUrl = mainItemId 
    ? `${import.meta.env.VITE_PUBLIC_AWS_BUCKET_URL}/${combo.restaurantId}/${combo.restaurantId}-${mainItemId}.jpg`
    : placeholderImage;
  const mainImageUrl = mainImageError ? placeholderImage : actualMainImageUrl;

  const handleItemImageError = (itemIndex: number) => {
    setItemImageErrors(prev => ({ ...prev, [itemIndex]: true }));
  };

  const handleSimilarItemImageError = (itemKey: string) => {
    setSimItemImageErrors(prev => ({ ...prev, [itemKey]: true }));
  };

  const handleRegenerateClick = async (itemIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRegenerateClick) {
      onRegenerateClick(itemIndex);
    }
    if (onRegenerateItem && combo.items[itemIndex]) {
      const currentItem = combo.items[itemIndex];
      const effectiveId = currentItem.id !== undefined ? currentItem.id : itemIndex;
      try {
        await onRegenerateItem(
          combo.id, 
          itemIndex, 
          effectiveId, 
          currentItem.category
        );
      } catch (error) {
        console.error(`Error regenerating item in combo ${combo.id}:`, error);
      }
    }
  };

  const handleReplaceItem = (itemIndex: number, newItem: RecommendedItem) => {
    if (onReplaceItem) {
      onReplaceItem(combo.id, itemIndex, newItem);
    }
  };

  const handleDeleteItem = (itemIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeleteItem) {
      onDeleteItem(combo.id, itemIndex);
    }
  };

  const handleOpenSimilarItemDetails = (similarItem: RecommendedItem, simImageUrl: string | null) => {
    setSelectedDish({
      id: similarItem.id,
      name: similarItem.name,
      price: similarItem.price || 0,
      description: similarItem.description || '', 
      image: simImageUrl || '',
      restroId: combo.restaurantId,
      restaurant: combo.restaurantName,
      isCustomisable: false,
      customisation: undefined,
    });
  };

  const showSimilarItems = (itemIndex: number, itemId: number | undefined) => {
    const effectiveId = itemId !== undefined ? itemId : itemIndex;
    const uniqueKey = `${combo.id}_${itemIndex}_${effectiveId}`;
    return similarItems[uniqueKey] || [];
  };

  const handleAddComboToCart = () => {
    const cartRestaurant = state.cart[0]?.restaurant;
    if (cartRestaurant && cartRestaurant !== combo.restaurantName) {
      setIsCartChangeModalOpen(true);
      return;
    }
    if (restaurantState.activeRestroId !== combo.restaurantId) {
      setActiveRestaurant(combo.restaurantId);
    }
    onAddToCart({ ...combo, isCombo: true, restaurantId: combo.restaurantId });
  };

  const handleCartChangeConfirm = () => {
    dispatch({ type: "CLEAR_CART" });
    dispatch({ type: "SET_SELECTED_RESTAURANT", payload: combo.restaurantName });
    setActiveRestaurant(combo.restaurantId);
    onAddToCart({ ...combo, isCombo: true, restaurantId: combo.restaurantId });
    setIsCartChangeModalOpen(false);
  };

  const handleCloseModal = () => {
    setIsCartChangeModalOpen(false);
  };

  return (
    <>
      <div 
        className="rounded-xl shadow-lg overflow-hidden border hover:shadow-xl transition-all duration-300 h-full flex flex-col"
        style={{ 
          backgroundColor: theme.cardBg,
          borderColor: theme.cardBorder || theme.border || 'rgba(0,0,0,0.1)'
        }}
      >
        {/* Main Image */}
        <div 
          className="h-40 w-full bg-cover bg-center relative"
          style={{ backgroundColor: '#f0f0f0' }}
        >
          <img 
            src={mainImageUrl} 
            alt={combo.name}
            className="w-full h-full object-cover"
            onError={() => {
              if (!mainImageError) {
                setMainImageError(true);
              }
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 p-3 flex justify-between items-end">
            <h3 className="text-lg font-bold text-white drop-shadow-md">{combo.name}</h3>
            <div 
              className="px-3 py-1 rounded-full text-sm font-bold"
              style={{ backgroundColor: theme.primary, color: 'white' }}
            >
              AED {combo.totalPrice.toFixed(2)}
            </div>
          </div>
        </div>
        
        <div className="p-4 flex-1 flex flex-col">
          <div className="text-sm mb-3" style={{ color: theme.subText || theme.text }}>
            <span 
              className="inline-block px-2 py-1 rounded-md text-xs mb-2 mr-2"
              style={{ backgroundColor: `${theme.primary}20`, color: theme.primary }}
            >
              {combo.restaurantName}
            </span>
            <p>{combo.description}</p>
          </div>
          
          <div className="mt-2 pb-2 border-b mb-3" style={{ borderColor: theme.border || 'rgba(0,0,0,0.1)' }}></div>
          
          <div className="mb-3">
            <button 
              onClick={onToggleExpanded}
              className="text-sm font-medium flex items-center"
              style={{ color: theme.primary }}
            >
              {isExpanded ? 'Hide Items' : 'View & Customize Items'}
              <svg 
                className={`w-4 h-4 ml-1 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          
          {isExpanded && (
            <div className="mt-1 mb-3 text-sm animate-fade-in">
              <ul className="space-y-4">
                {combo.items.map((item, idx) => {
                  const itemImageUrl = item.id && !itemImageErrors[idx] 
                    ? `${import.meta.env.VITE_PUBLIC_AWS_BUCKET_URL}/${combo.restaurantId}/${combo.restaurantId}-${item.id}.jpg`
                    : placeholderImage;
                  
                  return (
                    <li 
                      key={`item-${combo.id}-${idx}-${item.id || 'unknown'}`} 
                      className="pt-2 pb-3 border-b cursor-pointer" 
                      style={{ borderColor: theme.border || 'rgba(0,0,0,0.1)' }}
                      onClick={() => {
                        setSelectedDish({
                          id: item.id,
                          name: item.name,
                          price: item.price || 0,
                          description: item.description || '', 
                          image: itemImageUrl || mainImageUrl || '',
                          restroId: combo.restaurantId,
                          restaurant: combo.restaurantName,
                          isCustomisable: false,
                          customisation: undefined,
                        });
                      }}
                    >
                      <div className="flex items-start mb-2">
                        <div className="flex-shrink-0">
                          <div 
                            className="w-16 h-16 rounded-lg bg-cover bg-center flex items-center justify-center overflow-hidden"
                            style={{ backgroundColor: '#f0f0f0', borderColor: theme.border || 'rgba(0,0,0,0.1)' }}
                          >
                            {itemImageUrl && !itemImageErrors[idx] ? (
                              <img 
                                src={itemImageUrl} 
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onError={() => handleItemImageError(idx)}
                              />
                            ) : (
                              <img 
                                src={placeholderImage} 
                                alt="placeholder"
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                        </div>
                        
                        <div className="flex-1 ml-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-medium" style={{ color: theme.text }}>{item.name}</span>
                              {item.category && (
                                <div className="text-xs mt-1" style={{ color: theme.subText || theme.text }}>
                                  {item.category}
                                </div>
                              )}
                              <div className="flex items-center mt-1 space-x-3">
                                <button
                                  onClick={(e) => handleRegenerateClick(idx, e)}
                                  className="text-xs flex items-center transition-colors hover:opacity-80"
                                  style={{ color: theme.primary }}
                                >
                                  {isLoading[idx] ? (
                                    <div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin" 
                                      style={{ borderColor: `${theme.primary} transparent transparent` }}></div>
                                  ) : (
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                  )}
                                </button>
                                <button
                                  onClick={(e) => handleDeleteItem(idx, e)}
                                  className="text-xs flex items-center transition-colors hover:opacity-80"
                                  style={{ color: 'rgb(239, 68, 68)' }}
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                            <span 
                              className="text-xs px-2 py-1 rounded-md ml-2"
                              style={{ backgroundColor: theme.cardHighlight || 'rgba(0,0,0,0.05)', color: theme.text }}
                            >
                              AED {item.price?.toFixed(2) || '0.00'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {activeItemIndex === idx && (
                        <div className="mt-3 animate-fade-in">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-xs font-semibold" style={{ color: theme.text }}>
                              Similar alternatives:
                            </div>
                            {isLoading[idx] && (
                              <div className="text-xs" style={{ color: theme.primary }}>
                                Finding items...
                              </div>
                            )}
                          </div>
                          
                          {isLoading[idx] ? (
                            <div className="flex justify-center py-4">
                              <div 
                                className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" 
                                style={{ borderColor: `${theme.primary} transparent transparent` }}
                              ></div>
                            </div>
                          ) : (
                            <div 
                              className="flex overflow-x-auto pb-3 -mx-2 px-2"
                              ref={scrollContainerRef}
                              style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
                            >
                              {showSimilarItems(idx, item.id).length > 0 ? (
                                showSimilarItems(idx, item.id).map((similarItem, simIdx) => {
                                  const simImageUrl = similarItem.id
                                    ? `${import.meta.env.VITE_PUBLIC_AWS_BUCKET_URL}/${combo.restaurantId}/${combo.restaurantId}-${similarItem.id}.jpg`
                                    : null;
                                  const itemKey = `${similarItem.id !== undefined ? similarItem.id : simIdx}-${simIdx}`;
                                  
                                  return (
                                    <div 
                                      key={`similar-${combo.id}-${idx}-${itemKey}`} 
                                      className="flex-shrink-0 w-20 mr-3"
                                    >
                                      <div 
                                        className="border rounded-lg overflow-hidden bg-white cursor-pointer shadow-sm hover:shadow transition-shadow"
                                        style={{ borderColor: theme.border || 'rgba(0,0,0,0.1)' }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenSimilarItemDetails(similarItem, simImageUrl);
                                        }}
                                      >
                                        <div className="relative w-full h-20">
                                          {simImageUrl && !similarItemImageErrors[itemKey] ? (
                                            <img 
                                              src={simImageUrl} 
                                              alt={similarItem.name}
                                              className="w-full h-full object-cover"
                                              onError={() => handleSimilarItemImageError(itemKey)}
                                            />
                                          ) : (
                                            <img 
                                              src={placeholderImage} 
                                              alt="placeholder"
                                              className="w-full h-full object-cover"
                                            />
                                          )}
                                          
                                          <div 
                                            className="absolute top-1 right-1 w-5 h-5 rounded-full shadow flex items-center justify-center cursor-pointer"
                                            style={{ backgroundColor: theme.primary, color: 'white' }}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleReplaceItem(idx, similarItem);
                                            }}
                                          >
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                          </div>
                                        </div>
                                        
                                        <div className="p-1">
                                          <div className="text-xs truncate" style={{ color: theme.text }}>
                                            {similarItem.name}
                                          </div>
                                          <div className="text-xs font-bold" style={{ color: theme.primary }}>
                                            AED {similarItem.price?.toFixed(2) || '0.00'}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="w-full text-xs italic text-center py-3" style={{ color: theme.subText || theme.text }}>
                                  No alternatives available
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          
          <div className="mt-auto pt-2">
            <button
              onClick={handleAddComboToCart}
              className="w-full py-3 px-4 text-sm font-medium rounded-md transition-all duration-200 flex items-center justify-center transform hover:scale-[1.02] hover:shadow-md"
              style={{ backgroundColor: theme.primary, color: theme.buttonText || 'white' }}
            >
              <svg 
                className="w-5 h-5 mr-2" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Add Combo to Cart
            </button>
          </div>
        </div>

      {/* Dish Details Modal */}
        {selectedDish && (
          <DishDetailsModal
            isOpen={true}
            onClose={() => setSelectedDish(null)}
            id={selectedDish.id}
            name={selectedDish.name}
            price={selectedDish.price.toString()}
            description={selectedDish.description}
            image={selectedDish.image}
            restroId={selectedDish.restroId}
            restaurant={selectedDish.restaurant}
            isCustomisable={selectedDish.isCustomisable}
            customisation={selectedDish.customisation}
          />
        )}
      </div>
      
      {/* Cart Change Modal */}
      <CartChangeModal
        isOpen={isCartChangeModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleCartChangeConfirm}
        currentRestaurant={state.cart[0]?.restaurant || ""}
        newRestaurant={combo.restaurantName}
      />
    </>
  );
};

export default ComboCard;
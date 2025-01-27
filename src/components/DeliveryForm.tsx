import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { useChatContext } from '../context/ChatContext';

interface DeliveryFormProps {
  onSubmit: (e: React.FormEvent) => void;
}

export const DeliveryForm: React.FC<DeliveryFormProps> = ({ onSubmit }) => {
  const { state, dispatch } = useChatContext();
  const { orderDetails } = state.checkout;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: "SET_CHECKOUT_STEP", payload: "payment" });
    onSubmit(e);
  };

  const total = state.cart.reduce((sum, item) => 
    sum + (parseFloat(item.price) * item.quantity), 0
  ).toFixed(2);

  return (
    <div className="bg-white/80 rounded-xl p-4 shadow-sm backdrop-blur-sm mb-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Delivery Details</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="Full Name"
          value={orderDetails.name}
          onChange={(e) => dispatch({ 
            type: "UPDATE_ORDER_DETAILS", 
            payload: { name: e.target.value } 
          })}
          required
          className="w-full p-2 rounded-lg bg-white/50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <input
          type="text"
          placeholder="Delivery Address"
          value={orderDetails.address}
          onChange={(e) => dispatch({ 
            type: "UPDATE_ORDER_DETAILS", 
            payload: { address: e.target.value } 
          })}
          required
          className="w-full p-2 rounded-lg bg-white/50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <input
          type="tel"
          placeholder="Phone Number"
          value={orderDetails.phone}
          onChange={(e) => dispatch({ 
            type: "UPDATE_ORDER_DETAILS", 
            payload: { phone: e.target.value } 
          })}
          required
          className="w-full p-2 rounded-lg bg-white/50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <button
          type="submit"
          className="w-full p-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all shadow-lg flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" />
          Continue to Payment (${total})
        </button>
      </form>
    </div>
  );
};
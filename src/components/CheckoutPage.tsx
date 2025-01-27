import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckoutForm } from './CheckoutForm';
import { useChatContext } from '../context/ChatContext';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useChatContext();
  const [step, setStep] = useState<'details' | 'payment'>('details');
  const [orderDetails, setOrderDetails] = useState({
    name: '',
    address: '',
    phone: '',
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  });

  const total = state.cart.reduce((sum, item) => 
    sum + (parseFloat(item.price) * item.quantity), 0
  ).toFixed(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'details') {
      setStep('payment');
    } else {
      // Handle payment processing here
      console.log('Processing payment:', { orderDetails, total });
      // Navigate back to home after successful payment
      navigate('/');
    }
  };

  if (state.cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Your cart is empty</h2>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Return to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 bg-orange-50">
            <h1 className="text-2xl font-semibold text-gray-800">
              {step === 'details' ? 'Delivery Details' : 'Payment Information'}
            </h1>
          </div>
          
          <CheckoutForm
            step={step}
            orderDetails={orderDetails}
            setOrderDetails={setOrderDetails}
            onSubmit={handleSubmit}
            total={total}
          />
        </div>
      </div>
    </div>
  );
};
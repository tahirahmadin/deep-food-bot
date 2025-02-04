import React from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, CreditCard, ArrowLeft } from "lucide-react";

interface CheckoutFormProps {
  step: "details" | "payment";
  orderDetails: {
    name: string;
    address: string;
    phone: string;
    cardNumber: string;
    expiryDate: string;
    cvv: string;
  };
  setOrderDetails: (details: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  total?: string;
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({
  step,
  orderDetails,
  setOrderDetails,
  onSubmit,
  total,
}) => {
  const navigate = useNavigate();

  if (step === "details") {
    return (
      <form onSubmit={onSubmit} className="p-4 space-y-3">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Menu
        </button>
        <input
          type="text"
          placeholder="Full Name"
          required
          value={orderDetails.name}
          onChange={(e) =>
            setOrderDetails({ ...orderDetails, name: e.target.value })
          }
          className="w-full p-2 rounded-lg bg-white/50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <input
          type="text"
          placeholder="Delivery Address"
          required
          value={orderDetails.address}
          onChange={(e) =>
            setOrderDetails({ ...orderDetails, address: e.target.value })
          }
          className="w-full p-2 rounded-lg bg-white/50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <input
          type="tel"
          placeholder="Phone Number"
          required
          value={orderDetails.phone}
          onChange={(e) =>
            setOrderDetails({ ...orderDetails, phone: e.target.value })
          }
          className="w-full p-2 rounded-lg bg-white/50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <button
          type="submit"
          className="w-full p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          Continue to Payment
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit} className="p-4 space-y-3">
      <button
        type="button"
        onClick={() => navigate("/")}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Menu
      </button>
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-4 rounded-2xl text-white shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-orange-100 text-sm">Total Amount</p>
            <p className="text-2xl font-bold">${total}</p>
          </div>
          <CreditCard className="w-8 h-8 text-orange-200" />
        </div>
        <div className="space-y-1">
          <p className="text-sm text-orange-100">Delivery to:</p>
          <p className="font-medium">{orderDetails.name}</p>
          <p className="text-sm text-orange-100">{orderDetails.address}</p>
        </div>
      </div>
      <input
        type="text"
        placeholder="Card Number"
        required
        value={orderDetails.cardNumber}
        onChange={(e) =>
          setOrderDetails({ ...orderDetails, cardNumber: e.target.value })
        }
        className="w-full p-2 rounded-lg bg-white/50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="MM/YY"
          required
          value={orderDetails.expiryDate}
          onChange={(e) =>
            setOrderDetails({ ...orderDetails, expiryDate: e.target.value })
          }
          className="w-full p-2 rounded-lg bg-white/50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <input
          type="text"
          placeholder="CVV"
          required
          value={orderDetails.cvv}
          onChange={(e) =>
            setOrderDetails({ ...orderDetails, cvv: e.target.value })
          }
          className="w-full p-2 rounded-lg bg-white/50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>
      <button
        type="submit"
        className="w-full p-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all shadow-lg flex items-center justify-center gap-2 mt-4"
      >
        <ShoppingBag className="w-4 h-4" />
        Pay ${total} and Place Order
      </button>
    </form>
  );
};

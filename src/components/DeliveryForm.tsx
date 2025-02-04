import React from "react";
import { ShoppingBag, Plus } from "lucide-react";
import { useChatContext } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
import { AddressModal } from "./AddressModal";

interface DeliveryFormProps {
  onSubmit: (e: React.FormEvent) => void;
}

export const DeliveryForm: React.FC<DeliveryFormProps> = ({ onSubmit }) => {
  const { state, dispatch } = useChatContext();
  const { addresses } = useAuth();
  const [isAddressModalOpen, setIsAddressModalOpen] = React.useState(false);
  const { orderDetails } = state.checkout;

  React.useEffect(() => {
    // Auto-fill form with first address if available
    if (addresses.length > 0) {
      const firstAddress = addresses[0];
      dispatch({
        type: "UPDATE_ORDER_DETAILS",
        payload: {
          name: firstAddress.name,
          address: firstAddress.address,
          phone: firstAddress.mobile,
        },
      });
    }
  }, [addresses, dispatch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: "SET_CHECKOUT_STEP", payload: "payment" });
    onSubmit(e);
  };

  const total = state.cart
    .reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0)
    .toFixed(2);

  return (
    <div className="bg-white/80 rounded-xl p-4 shadow-sm backdrop-blur-sm mb-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Delivery Details
        </h3>
        {addresses.length === 0 && (
          <button
            type="button"
            onClick={() => setIsAddressModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Address
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {addresses.length > 0 ? (
          <div className="space-y-3">
            {addresses.map((addr, index) => (
              <label
                key={index}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  orderDetails.address === addr.address
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="deliveryAddress"
                  checked={orderDetails.address === addr.address}
                  onChange={() =>
                    dispatch({
                      type: "UPDATE_ORDER_DETAILS",
                      payload: {
                        name: addr.name,
                        address: addr.address,
                        phone: addr.mobile,
                      },
                    })
                  }
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{addr.name}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{addr.address}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{addr.mobile}</p>
                </div>
              </label>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No saved addresses. Please add a delivery address.
          </div>
        )}
        <button
          type="submit"
          disabled={!orderDetails.address}
          className="w-full p-2 bg-primary text-white rounded-xl hover:bg-primary-600 transition-all shadow-lg flex items-center justify-center gap-2 text-xs"
        >
          <ShoppingBag className="w-4 h-4" />
          Continue to Payment ({total} AED)
        </button>
      </form>
      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSave={(newAddress) => {
          dispatch({
            type: "UPDATE_ORDER_DETAILS",
            payload: {
              name: newAddress.name,
              address: newAddress.address,
              phone: newAddress.mobile,
            },
          });
          setIsAddressModalOpen(false);
        }}
      />
    </div>
  );
};

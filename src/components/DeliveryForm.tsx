import React from "react";
import { ShoppingBag, Plus, Building2, Hotel, Home } from "lucide-react";
import { useChatContext } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";

interface DeliveryFormProps {
  onSubmit: (e: React.FormEvent) => void;
}

export const DeliveryForm: React.FC<DeliveryFormProps> = ({ onSubmit }) => {
  const { state, dispatch } = useChatContext();
  const {
    isAuthenticated,
    user,
    addresses,
    setAddresses,
    isLoadingAddresses,
    isAddressModalOpen,
    setIsAddressModalOpen,
  } = useAuth();
  const { orderDetails } = state.checkout;
  const [selectedAddressIndex, setSelectedAddressIndex] = React.useState<
    number | null
  >(null);

  React.useEffect(() => {
    // Auto-fill form with first address if available
    if (!isLoadingAddresses && addresses.length > 0) {
      setSelectedAddressIndex(0);
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
  }, [addresses]);

  const handleSaveAddress = async (newAddress: {
    name: string;
    address: string;
    mobile: string;
    type: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  }) => {
    if (user?.userId) {
      const updatedAddresses = [...addresses, newAddress];
      await setAddresses(updatedAddresses);
      setSelectedAddressIndex(updatedAddresses.length - 1);
      dispatch({
        type: "UPDATE_ORDER_DETAILS",
        payload: {
          name: newAddress.name,
          address: newAddress.address,
          phone: newAddress.mobile,
        },
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check authentication first
    if (!isAuthenticated) {
      login();
      return;
    }

    // Validate address selection
    if (addresses.length === 0) {
      alert("Please add a delivery address to continue");
      setIsAddressModalOpen(true);
      return;
    }

    if (selectedAddressIndex === null) {
      alert("Please select a delivery address");
      return;
    }

    dispatch({ type: "SET_CHECKOUT_STEP", payload: "payment" });
    onSubmit(e);
  };

  const total = state.cart
    .reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0)
    .toFixed(2);

  const getAddressIcon = (type: string = "home") => {
    switch (type.toLowerCase()) {
      case "office":
        return <Building2 className="w-4 h-4 text-gray-400" />;
      case "hotel":
        return <Hotel className="w-4 h-4 text-gray-400" />;
      default:
        return <Home className="w-4 h-4 text-gray-400" />;
    }
  };

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
            {addresses.map((addr: any, index: number) => (
              <label
                key={index}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedAddressIndex === index
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="deliveryAddress"
                  checked={selectedAddressIndex === index}
                  onChange={() => {
                    setSelectedAddressIndex(index);
                    dispatch({
                      type: "UPDATE_ORDER_DETAILS",
                      payload: {
                        name: addr.name,
                        address: addr.address,
                        phone: addr.mobile,
                      },
                    });
                  }}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {getAddressIcon(addr.type)}
                    <p className="font-medium text-gray-900">{addr.name}</p>
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{addr.address}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{addr.mobile}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{addr.type}</p>
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
          disabled={selectedAddressIndex === null}
          className="w-full p-2 bg-primary text-white rounded-xl hover:bg-primary-600 transition-all shadow-lg flex items-center justify-center gap-2 text-xs"
        >
          <ShoppingBag className="w-4 h-4" />
          Continue to Payment ({total} AED)
        </button>
      </form>
    </div>
  );
};

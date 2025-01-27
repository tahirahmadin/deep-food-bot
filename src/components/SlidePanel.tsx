import React from "react";
import {
  User,
  MapPin,
  ShoppingBag,
  Gift,
  Award,
  Home,
  Trash2,
} from "lucide-react";

interface Address {
  id: string;
  name: string;
  address: string;
  phone: string;
}

interface SlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  savedAddresses: Address[];
  onDeleteAddress: (id: string) => void;
}

export const SlidePanel: React.FC<SlidePanelProps> = ({
  isOpen,
  onClose,
  savedAddresses,
  onDeleteAddress,
}) => {
  const [activeTab, setActiveTab] = React.useState("orders");
  const latestAddress = savedAddresses[savedAddresses.length - 1];

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed right-0 top-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6 bg-orange-50">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
              <User className="w-8 h-8 text-orange-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Gobbl foodie</h3>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                {latestAddress && (
                  <>
                    <MapPin className="w-3 h-3" />
                    <span className="line-clamp-1">
                      {latestAddress.address}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Gobbl Points</span>
              <span className="text-orange-500 font-semibold">2,450</span>
            </div>
            <div className="mt-2 h-2 bg-orange-100 rounded-full overflow-hidden">
              <div className="h-full w-3/4 bg-orange-500 rounded-full" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              550 points until next reward
            </p>
          </div>
        </div>

        <div className="p-4">
          <div className="space-y-2">
            {[
              { id: "orders", icon: ShoppingBag, label: "Previous Orders" },
              { id: "deals", icon: Gift, label: "Deals for You" },
              { id: "points", icon: Award, label: "Gobbl Points" },
              { id: "addresses", icon: Home, label: "Addresses" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                  activeTab === tab.id
                    ? "bg-orange-50 text-orange-500"
                    : "hover:bg-gray-50"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>

          {activeTab === "addresses" && (
            <div className="mt-4 px-4">
              {savedAddresses.map((addr) => (
                <div
                  key={addr.id}
                  className="bg-white p-3 rounded-xl mb-3 shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {addr.address}
                      </p>
                      <p className="text-xs text-gray-500">{addr.phone}</p>
                    </div>
                    <button
                      onClick={() => onDeleteAddress(addr.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {savedAddresses.length === 0 && (
                <p className="text-center text-gray-500 text-sm">
                  No saved addresses
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

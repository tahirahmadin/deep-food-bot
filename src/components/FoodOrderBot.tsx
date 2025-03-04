import { GoogleOAuthProvider } from "@react-oauth/google";
import { ChatProvider } from "../context/ChatContext";
import { WalletProvider } from "../context/WalletContext";
import { RestaurantProvider } from "../context/RestaurantContext";
import { AuthProvider } from "../context/AuthContext";
import { ToastProvider } from "../context/ToastContext";
import { DunkinOrderApp } from "./DunkinOrderApp";
import { CustomizationModal } from "./CustumizationModal";
import { AddressModal } from "./AddressModal";
import { FiltersProvider } from "../context/FiltersContext";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export const FoodOrderBot = () => {
  return (
    <GoogleOAuthProvider
      clientId={GOOGLE_CLIENT_ID}
      onScriptLoadError={() => console.error("Google Script failed to load")}
      onScriptLoadSuccess={() =>
        console.log("Google Script loaded successfully")
      }
    >
      <AuthProvider>
        <ToastProvider>
          <WalletProvider>
            <RestaurantProvider>
              <FiltersProvider>
                <ChatProvider>
                  <>
                    <DunkinOrderApp />
                    <CustomizationModal />
                    <AddressModal />
                  </>
                </ChatProvider>
              </FiltersProvider>
            </RestaurantProvider>
          </WalletProvider>
        </ToastProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
};

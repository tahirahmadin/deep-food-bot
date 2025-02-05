import { GoogleOAuthProvider } from "@react-oauth/google";
import { ChatProvider } from "./context/ChatContext";
import { WalletProvider } from "./context/WalletContext";
import { RestaurantProvider } from "./context/RestaurantContext";
import { AuthProvider } from "./context/AuthContext";
import { DunkinOrderApp } from "./components/DunkinOrderApp";
import { FiltersProvider } from "./context/FiltersContext";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export default function App() {
  return (
    <GoogleOAuthProvider
      clientId={GOOGLE_CLIENT_ID}
      onScriptLoadError={() => console.error("Google Script failed to load")}
      onScriptLoadSuccess={() =>
        console.log("Google Script loaded successfully")
      }
    >
      <AuthProvider>
        <WalletProvider>
          <RestaurantProvider>
            <FiltersProvider>
              <ChatProvider>
                <DunkinOrderApp />
              </ChatProvider>
            </FiltersProvider>
          </RestaurantProvider>
        </WalletProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

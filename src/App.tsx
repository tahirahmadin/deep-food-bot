import { GoogleOAuthProvider } from "@react-oauth/google";
import { ChatProvider } from "./context/ChatContext";
import { WalletProvider } from "./context/WalletContext";
import { RestaurantProvider } from "./context/RestaurantContext";
import { AuthProvider } from "./context/AuthContext";
import { DunkinOrderApp } from "./components/DunkinOrderApp";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <WalletProvider>
          <RestaurantProvider>
            <ChatProvider>
              <DunkinOrderApp />
            </ChatProvider>
          </RestaurantProvider>
        </WalletProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

import { ChatProvider } from "./context/ChatContext";
import { WalletProvider } from "./context/WalletContext";
import { RestaurantProvider } from "./context/RestaurantContext";
import { DunkinOrderApp } from "./components/DunkinOrderApp";

export default function App() {
  return (
    <WalletProvider>
      <RestaurantProvider>
        <ChatProvider>
          <DunkinOrderApp />
        </ChatProvider>
      </RestaurantProvider>
    </WalletProvider>
  );
}

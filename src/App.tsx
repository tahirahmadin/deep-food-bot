import { ChatProvider } from "./context/ChatContext";
import { WalletProvider } from "./context/WalletContext";
import { DunkinOrderApp } from "./components/DunkinOrderApp";

export default function App() {
  return (
    <WalletProvider>
      <ChatProvider>
        <DunkinOrderApp />
      </ChatProvider>
    </WalletProvider>
  );
}

import React from "react";
import { MoreHorizontal, ShoppingBag, ChevronDown, Wallet } from "lucide-react";
import { useChatContext } from "../context/ChatContext";
import { useWallet } from "../context/WalletContext";

interface HeaderProps {
  onOpenPanel: () => void;
  onCartClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenPanel, onCartClick }) => {
  const { state } = useChatContext();
  const { connected, connectWallet, disconnectWallet, publicKey } = useWallet();

  const cartTotal = React.useMemo(() => {
    return state.cart
      .reduce((total, item) => {
        return total + parseFloat(item.price) * item.quantity;
      }, 0)
      .toFixed(2);
  }, [state.cart]);

  return (
    <div className="p-4 border-b border-white/20 flex items-center justify-between bg-white/50 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <img
          src="https://gobbl-bucket.s3.ap-south-1.amazonaws.com/gobbl_token.png"
          alt="Dunkin' Donuts Logo"
          className="w-8 h-8 rounded-full object-cover"
        />
        <div>
          <h1 className="font-semibold">Deep Food Bot</h1>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={connected ? disconnectWallet : connectWallet}
          className="flex items-center gap-2 px-3 py-1.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm"
        >
          <Wallet className="w-4 h-4" />
          {connected ? (
            <span className="hidden sm:inline">
              {publicKey?.slice(0, 4)}...{publicKey?.slice(-4)}
            </span>
          ) : (
            <span className="hidden sm:inline">Connect Wallet</span>
          )}
        </button>

        <button
          onClick={onOpenPanel}
          className="p-2 hover:bg-black/5 rounded-full transition-colors"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

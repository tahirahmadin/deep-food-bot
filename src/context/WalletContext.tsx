import React, { createContext, useContext, useState, useEffect } from "react";
import {
  Connection,
  PublicKey,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

interface WalletContextType {
  wallet: any | null;
  connected: boolean;
  publicKey: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  transferUSDT: (amount: number) => Promise<string | null>;
}

const WalletContext = createContext<WalletContextType | null>(null);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [wallet, setWallet] = useState<any | null>(null);
  const [connected, setConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);

  useEffect(() => {
    const checkWallet = async () => {
      try {
        // @ts-ignore
        const phantom = window.phantom?.solana;

        if (phantom?.isPhantom) {
          setWallet(phantom);
          if (phantom.isConnected) {
            setConnected(true);
            setPublicKey(phantom.publicKey.toString());
          }
        }
      } catch (error) {
        console.error("Phantom wallet check failed:", error);
      }
    };

    checkWallet();
  }, []);

  const connectWallet = async () => {
    try {
      if (!wallet) {
        window.open("https://phantom.app/", "_blank");
        return;
      }

      const { publicKey } = await wallet.connect();
      setConnected(true);
      setPublicKey(publicKey.toString());
    } catch (error) {
      console.error("Wallet connection failed:", error);
    }
  };

  const disconnectWallet = async () => {
    try {
      await wallet?.disconnect();
      setConnected(false);
      setPublicKey(null);
    } catch (error) {
      console.error("Wallet disconnection failed:", error);
    }
  };

  const transferUSDT = async (amount: number): Promise<string | null> => {
    try {
      if (!wallet || !connected) {
        throw new Error("Wallet not connected");
      }

      const destinationAddress = new PublicKey(
        "21XqdT1wuz5gLsLWgDN1DvcmQ4wuf2yXZNSSGHznjHNq"
      );
      const connection = new Connection("https://api.mainnet-beta.solana.com");

      // Create transaction
      const transaction = new Transaction()
        .add
        // Transfer instruction would go here
        // This is a simplified version - you'd need to add proper USDT transfer instructions
        ();

      // Get recent blockhash
      const { blockhash } = await connection.getRecentBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = new PublicKey(publicKey!);

      // Sign and send transaction
      const signed = await wallet.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(signature);

      return signature;
    } catch (error) {
      console.error("USDT transfer failed:", error);
      return null;
    }
  };

  return (
    <WalletContext.Provider
      value={{
        wallet,
        connected,
        publicKey,
        connectWallet,
        disconnectWallet,
        transferUSDT,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

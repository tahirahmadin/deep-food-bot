import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";

interface WalletContextType {
  connected: boolean;
  account: string | null;
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
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);

  useEffect(() => {
    const checkWallet = async () => {
      try {
        if (window.ethereum) {
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          });
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setConnected(true);
          }
        }
      } catch (error) {
        console.error("Metamask check failed:", error);
      }
    };

    checkWallet();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setConnected(true);
        } else {
          setAccount(null);
          setConnected(false);
        }
      });
    }
  }, []);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        window.open("https://metamask.io/", "_blank");
        return;
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      setAccount(accounts[0]);
      setConnected(true);
    } catch (error) {
      console.error("Wallet connection failed:", error);
    }
  };

  const disconnectWallet = async () => {
    try {
      setAccount(null);
      setConnected(false);
    } catch (error) {
      console.error("Wallet disconnection failed:", error);
    }
  };

  const transferUSDT = async (amount: number): Promise<string | null> => {
    try {
      if (
        !window.ethereum ||
        !connected ||
        !account ||
        !window.ethereum.chainId
      ) {
        throw new Error("Wallet not connected");
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      // Get USDT contract address based on network
      const usdtAddress =
        window.ethereum.chainId === "0x38"
          ? "0x55d398326f99059fF775485246999027B3197955" // BSC USDT
          : "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // Base USDT

      const usdtAbi = [
        "function transfer(address to, uint256 amount) returns (bool)",
        "function balanceOf(address account) view returns (uint256)",
      ];
      const usdtContract = new ethers.Contract(usdtAddress, usdtAbi, signer);

      const destinationAddress = "0xeBB825f034519927D2c54171d36B4801DEf2A6B1";
      const amountWei = ethers.utils.parseUnits(amount.toString(), 18);

      // Check if user has enough USDT
      let balance;
      try {
        balance = await usdtContract.balanceOf(account);
      } catch (error) {
        console.error("Error checking USDT balance:", error);
        throw new Error("Failed to check USDT balance. Please try again.");
      }

      if (balance.lt(amountWei)) {
        throw new Error(
          `Insufficient USDT balance. You need ${amount.toFixed(
            2
          )} USDT to complete this transaction.`
        );
      }

      const tx = await usdtContract.transfer(destinationAddress, amountWei);
      await tx.wait();

      return tx.hash;
    } catch (error) {
      console.error("USDT transfer failed:", error);
      if (error instanceof Error) {
        throw error;
      }
      return null;
    }
  };

  return (
    <WalletContext.Provider
      value={{
        connected,
        account,
        connectWallet,
        disconnectWallet,
        transferUSDT,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

import React, { createContext, useContext, useState, useEffect } from "react";
import { createAppKit } from "@reown/appkit/react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useBalance,
  useWriteContract,
  useReadContract,
} from "wagmi";
import { wagmiAdapter, projectId, metadata, networks } from "../config";
import { parseUnits } from "viem";

// USDT Token ABI - Only the methods we need
const USDT_ABI = [
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_to", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
];

interface WalletContextType {
  connected: boolean;
  publicKey: string | null;
  balance: number | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  transferUSDT: (amount: number, depositAddress: string) => Promise<any>;
  currentNetwork: string | null;
  switchNetwork: (chainId: string) => Promise<void>;
}

// Create the modal
const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks,
  defaultNetwork: networks[0],
  metadata,
});

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
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { writeContractAsync } = useWriteContract();
  const { data: decimals } = useReadContract({
    address: "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd",
    abi: USDT_ABI,
    functionName: "decimals",
  });
  const { data: balanceData } = useBalance({
    address,
    token: "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd", // BSC Testnet USDT
  });

  const [currentNetwork, setCurrentNetwork] = useState<string | null>(null);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum
        .request({ method: "eth_chainId" })
        .then((chainId: string) => {
          setCurrentNetwork(chainId);
        });

      window.ethereum.on("chainChanged", (newChainId: string) => {
        setCurrentNetwork(newChainId);
      });
    }
  }, []);

  const connectWallet = async () => {
    try {
      await modal.open();
      connect();
    } catch (error) {
      console.error("Error connecting wallet:", error);
      throw error;
    }
  };

  const disconnectWallet = async () => {
    try {
      disconnect();
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      throw error;
    }
  };

  const switchNetwork = async (chainId: string) => {
    try {
      if (!window.ethereum) throw new Error("No crypto wallet found");

      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x61", // BSC Testnet
                chainName: "BSC Testnet",
                nativeCurrency: {
                  name: "BNB",
                  symbol: "BNB",
                  decimals: 18,
                },
                rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545/"],
                blockExplorerUrls: ["https://testnet.bscscan.com/"],
              },
            ],
          });
        } else {
          throw switchError;
        }
      }

      setCurrentNetwork(chainId);
    } catch (error) {
      console.error("Error switching network:", error);
      throw error;
    }
  };

  const transferUSDT = async (amount: number, depositAddress: string) => {
    try {
      if (!isConnected || !address) {
        throw new Error("Wallet not connected");
      }

      // Convert amount to proper decimals (usually 18 for USDT on BSC)
      const tokenDecimals = decimals || 18;
      const amountInUnits = parseUnits((amount / 10).toString(), tokenDecimals);

      // Execute the transfer
      const hash = await writeContractAsync({
        address: "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd",
        abi: USDT_ABI,
        functionName: "transfer",
        args: [depositAddress, amountInUnits],
      });

      return {
        signature: hash,
        network: currentNetwork,
      };
    } catch (error) {
      console.error("USDT transfer failed:", error);
      throw error;
    }
  };

  return (
    <WalletContext.Provider
      value={{
        connected: isConnected,
        publicKey: address || null,
        balance: balanceData?.value ? Number(balanceData.value) / 1e18 : null,
        connectWallet,
        disconnectWallet,
        transferUSDT,
        currentNetwork,
        switchNetwork,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

import React, { createContext, useContext, useState, useEffect } from "react";
import Web3 from "web3";

// USDT Token ABI - Only the methods we need
const USDT_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
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

// Network configurations
const NETWORKS = {
  BASE: {
    chainId: "0x2105",
    chainName: "Base",
    nativeCurrency: {
      name: "ETH",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: ["https://mainnet.base.org"],
    blockExplorerUrls: ["https://basescan.org"],
    usdtAddress: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
  },
  BSC: {
    chainId: "0x38",
    chainName: "Binance Smart Chain",
    nativeCurrency: {
      name: "BNB",
      symbol: "BNB",
      decimals: 18,
    },
    rpcUrls: ["https://bsc-dataseed.binance.org/"],
    blockExplorerUrls: ["https://bscscan.com/"],
    usdtAddress: "0x55d398326f99059fF775485246999027B3197955",
  },
};

interface WalletContextType {
  connected: boolean;
  publicKey: string | null;
  balance: number | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  transferUSDT: (amount: number) => Promise<string | null>;
  currentNetwork: string | null;
  switchNetwork: (chainId: string) => Promise<void>;
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
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [currentNetwork, setCurrentNetwork] = useState<string | null>(null);

  useEffect(() => {
    const initWeb3 = async () => {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);

        // Check current network
        const chainId = await window.ethereum.request({
          method: "eth_chainId",
        });
        setCurrentNetwork(chainId);

        // Check if already connected
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });
        if (accounts.length > 0) {
          setConnected(true);
          setPublicKey(accounts[0]);
          await fetchBalance(accounts[0], web3Instance, chainId);
        }

        // Listen for account changes
        window.ethereum.on("accountsChanged", async (accounts: string[]) => {
          if (accounts.length > 0) {
            setConnected(true);
            setPublicKey(accounts[0]);
            await fetchBalance(accounts[0], web3Instance, chainId);
          } else {
            setConnected(false);
            setPublicKey(null);
            setBalance(null);
          }
        });

        // Listen for network changes
        window.ethereum.on("chainChanged", (newChainId: string) => {
          setCurrentNetwork(newChainId);
          if (publicKey) {
            fetchBalance(publicKey, web3Instance, newChainId);
          }
        });
      }
    };

    initWeb3();

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners("accountsChanged");
        window.ethereum.removeAllListeners("chainChanged");
      }
    };
  }, []);

  const getUSDTAddress = (chainId: string) => {
    if (chainId === NETWORKS.BASE.chainId) return NETWORKS.BASE.usdtAddress;
    if (chainId === NETWORKS.BSC.chainId) return NETWORKS.BSC.usdtAddress;
    return null;
  };

  const fetchBalance = async (
    address: string,
    web3Instance: Web3,
    chainId: string
  ) => {
    try {
      const usdtAddress = getUSDTAddress(chainId);
      if (!usdtAddress) {
        console.error("Unsupported network for USDT");
        setBalance(0);
        return;
      }

      const contract = new web3Instance.eth.Contract(
        USDT_ABI as any,
        usdtAddress
      );
      const result = await contract.methods.balanceOf(address).call();

      // Convert from Wei to Ether using Web3's utils
      const formattedBalance = Number(
        web3Instance.utils.fromWei(result, "mwei")
      ); // Use mwei for 6 decimals
      setBalance(formattedBalance);
    } catch (error) {
      console.error("Error fetching USDT balance:", error);
      setBalance(0);
    }
  };

  const switchNetwork = async (chainId: string) => {
    try {
      if (!window.ethereum) throw new Error("No crypto wallet found");

      const network =
        chainId === NETWORKS.BASE.chainId ? NETWORKS.BASE : NETWORKS.BSC;

      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId }],
        });
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: network.chainId,
                chainName: network.chainName,
                nativeCurrency: network.nativeCurrency,
                rpcUrls: network.rpcUrls,
                blockExplorerUrls: network.blockExplorerUrls,
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

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        window.open("https://metamask.io/", "_blank");
        return;
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length > 0) {
        setConnected(true);
        setPublicKey(accounts[0]);
        if (web3 && currentNetwork) {
          await fetchBalance(accounts[0], web3, currentNetwork);
        }
      }
    } catch (error) {
      console.error("MetaMask connection failed:", error);
      throw error;
    }
  };

  const disconnectWallet = async () => {
    setConnected(false);
    setPublicKey(null);
    setBalance(null);
  };

  const transferUSDT = async (amount: number): Promise<string | null> => {
    try {
      if (
        !window.ethereum ||
        !connected ||
        !publicKey ||
        !web3 ||
        !currentNetwork
      ) {
        throw new Error("Wallet not connected");
      }

      const usdtAddress = getUSDTAddress(currentNetwork);
      if (!usdtAddress) {
        throw new Error("Unsupported network for USDT");
      }

      const contract = new web3.eth.Contract(USDT_ABI as any, usdtAddress);
      const recipientAddress = "0xeBB825f034519927D2c54171d36B4801DEf2A6B1";

      // Convert amount to USDT units (6 decimals)
      const amountInUnits = web3.utils.toWei(amount.toString(), "mwei"); // Use mwei for 6 decimals

      // Create and send transaction
      const transaction = await contract.methods
        .transfer(recipientAddress, amountInUnits)
        .send({ from: publicKey });

      return transaction.transactionHash;
    } catch (error) {
      console.error("USDT transfer failed:", error);
      throw error;
    }
  };

  return (
    <WalletContext.Provider
      value={{
        connected,
        publicKey,
        balance,
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

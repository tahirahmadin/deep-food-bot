import React, { createContext, useContext, useState, useEffect } from "react";
import Web3 from "web3";

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
    chainId: "0x61", // BSC Testnet
    chainName: "BSC Testnet",
    nativeCurrency: {
      name: "BNB",
      symbol: "BNB",
      decimals: 18,
    },
    rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545/"],
    blockExplorerUrls: ["https://testnet.bscscan.com/"],
    usdtAddress: "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd",
  },
};

interface WalletContextType {
  connected: boolean;
  publicKey: string | null;
  balance: number | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  transferUSDT: (
    amount: number,
    depositAddress: string
  ) => Promise<string | null>;
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
  }, [publicKey, connected]);

  const getUSDTAddress = (chainId: string) => {
    if (chainId === NETWORKS.BASE.chainId) return NETWORKS.BASE.usdtAddress;
    if (chainId === NETWORKS.BSC.chainId) return NETWORKS.BSC.usdtAddress;
    return null;
  };

  const fetchBalance = async (
    address: string,
    web3Instance: Web3,
    chainId: string | null
  ) => {
    try {
      console.log("Balance fetching");
      console.log(address);
      console.log(chainId);
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
      // BSC Testnet USDT has 18 decimals, Base USDT has 6 decimals
      const decimals = chainId === NETWORKS.BSC.chainId ? 18 : 6;
      const result = await contract.methods.balanceOf(address).call();
      console.log(chainId);
      console.log(contract);
      console.log("result");
      console.log(result);
      const adjustedBalance = Number(result) / Math.pow(10, decimals);
      setBalance(adjustedBalance);
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

  const transferUSDT = async (
    amount: number,
    depositAddress: string
  ): Promise<string | null> => {
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
      const recipientAddress = depositAddress;

      // BSC Testnet USDT has 18 decimals, Base USDT has 6 decimals
      const decimals = currentNetwork === NETWORKS.BSC.chainId ? 18 : 6;
      const amountInUnits = BigInt(
        Math.floor((amount / 10) * Math.pow(10, decimals))
      ).toString();

      // Create and send transaction
      const transaction = await contract.methods
        .transfer(recipientAddress, amountInUnits)
        .send({ from: publicKey });

      return {
        signature: transaction.transactionHash,
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

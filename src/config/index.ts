import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { bscTestnet } from "@reown/appkit/networks";

// Get projectId from environment variables
export const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID;

if (!projectId) {
  throw new Error("Project ID is not defined");
}

export const metadata = {
  name: "Gobbl Food",
  description: "Food Ordering App",
  url: window.location.origin,
  icons: ["https://gobbl-bucket.s3.ap-south-1.amazonaws.com/gobbl_token.png"],
};

// Configure networks
export const networks = [bscTestnet];

// Set up the Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
});

export const config = wagmiAdapter.wagmiConfig;

// Other configurations
export const appConfig = {
  QUERY_DOCUMENT_API_URL:
    import.meta.env.VITE_PUBLIC_QUERY_DOCUMENT_API_URL ||
    "http://localhost:5000/query-document",
  RESTAURANT_ID: import.meta.env.VITE_RESTAURANT_ID,
  OPENAI_API_KEY: import.meta.env.VITE_PUBLIC_OPENAI_API_KEY,
  OPENAI_MODEL: "gpt-3.5-turbo",
  DEFAULT_ERROR_MESSAGE: "Sorry, something went wrong. Please try again.",
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
} as const;

// Type definitions for environment variables
declare global {
  interface ImportMetaEnv {
    VITE_PUBLIC_QUERY_DOCUMENT_API_URL: string;
    VITE_RESTAURANT_ID: string;
    VITE_PUBLIC_OPENAI_API_KEY: string;
    VITE_WALLET_CONNECT_PROJECT_ID: string;
  }
}

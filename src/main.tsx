import React from "react";
import ReactDOM from "react-dom/client";
import "buffer";
import { Buffer } from "buffer";
import process from "process";
import App from "./App";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { config, wagmiAdapter } from "./config";

// Polyfills for Solana
window.process = process;
window.Buffer = Buffer;
window.global = window;

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);

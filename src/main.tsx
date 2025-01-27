import React from "react";
import ReactDOM from "react-dom/client";
import "buffer";
import { Buffer } from "buffer";
import process from "process";
import App from "./App";
import "./index.css";

// Polyfills for Solana
window.process = process;
window.Buffer = Buffer;
window.global = window;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

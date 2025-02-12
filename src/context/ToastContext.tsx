import React, { createContext, useContext, useState } from "react";

interface ToastContextType {
  showToast: (message: string, type?: "success" | "error") => void;
  hideToast: () => void;
  toast: {
    message: string;
    type: "success" | "error";
    visible: boolean;
  };
}

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toast, setToast] = useState({
    message: "",
    type: "success" as const,
    visible: false,
  });

  const showToast = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    setToast({ message, type, visible: true });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast, toast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

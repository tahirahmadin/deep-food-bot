import React from "react";
import { MoreHorizontal, LogIn, LogOut, User as UserIcon } from "lucide-react";
import { useChatContext } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
import { loginUserFromBackendServer } from "../actions/serverActions";
import { useGoogleLogin, googleLogout } from "@react-oauth/google";
import axios from "axios";
import { useState, useCallback } from "react";

interface HeaderProps {
  onOpenPanel: () => void;
  onCartClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenPanel, onCartClick }) => {
  const { state } = useChatContext();
  const { user, setUser, isAuthenticated } = useAuth();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLoginSuccess = useCallback(
    async (response: any) => {
      try {
        setIsLoggingIn(true);
        setLoginError(null);

        const userInfo = await axios.get(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: { Authorization: `Bearer ${response.access_token}` },
          }
        );

        // Call backend server login
        const loginResponse = await loginUserFromBackendServer(
          "GMAIL",
          userInfo.data.email
        );

        if (loginResponse.error) {
          throw new Error("Backend login failed");
        }

        setUser({
          email: userInfo.data.email,
          name: userInfo.data.name,
          picture: userInfo.data.picture,
          userId: loginResponse.result._id, // Store userId from backend response
        });
      } catch (error) {
        console.error("Error fetching user info:", error);
        setLoginError(error instanceof Error ? error.message : "Login failed");
      } finally {
        setIsLoggingIn(false);
      }
    },
    [setUser]
  );

  const login = useGoogleLogin({
    onSuccess: handleLoginSuccess,
    onError: () => {
      setLoginError("Login failed. Please try again.");
      setIsLoggingIn(false);
    },
    flow: "implicit",
    onNonOAuthError: (error) => {
      console.error("Non-OAuth Error:", error);
      setLoginError("Login configuration error. Please try again.");
      setIsLoggingIn(false);
    },
    scope: "email profile",
    ux_mode: "popup",
  });

  const handleLogout = () => {
    googleLogout();
    handleLogout();
    setLoginError(null);
  };

  const handleLoginClick = () => {
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      login();
    } catch (error) {
      console.error("Login error:", error);
      setLoginError("Failed to initialize login");
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="pt-3 px-3 pb-1 border-b border-white/20 flex items-center justify-between bg-white/50 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <img
          src="https://gobbl-bucket.s3.ap-south-1.amazonaws.com/gobbl_token.png"
          alt="Dunkin' Donuts Logo"
          className="w-8 h-8 rounded-full object-cover"
        />
        <div>
          <h1 className="font-semibold">GobblFood</h1>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            <img
              src={user?.picture}
              alt={user?.name}
              className="w-8 h-8 rounded-full border-2 border-primary"
            />
            <span className="text-sm font-medium text-gray-800">
              {user?.name?.split(" ")[0]}
            </span>
            <button
              onClick={handleLogout}
              className="hover:bg-black/5 rounded-full transition-colors text-gray-600"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-end">
            <button
              onClick={handleLoginClick}
              disabled={isLoggingIn}
              className="flex items-center gap-2 px-3 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogIn className="w-3 h-3" />
              {isLoggingIn ? "Logging in..." : "Login"}
            </button>
            {loginError && (
              <p className="text-xs text-red-500 mt-1">{loginError}</p>
            )}
          </div>
        )}
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

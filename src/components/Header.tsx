import React from "react";
import {
  MoreHorizontal,
  LogIn,
  LogOut,
  User as UserIcon,
  MapPin,
  ChevronDown,
} from "lucide-react";
import { useChatContext, QueryType } from "../context/ChatContext";
import { useRestaurant } from "../context/RestaurantContext";
import { useAuth } from "../context/AuthContext";
import { getUserDetails } from "../actions/serverActions";
import { loginUserFromBackendServer } from "../actions/serverActions";
import { useGoogleLogin, googleLogout } from "@react-oauth/google";
import axios from "axios";
import { useState, useCallback } from "react";

interface HeaderProps {
  onOpenPanel: () => void;
  onCartClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenPanel, onCartClick }) => {
  const { dispatch: chatDispatch } = useChatContext();
  const { dispatch: restaurantDispatch } = useRestaurant();
  const {
    user,
    setUser,
    setIsAddressModalOpen,
    isAuthenticated,
    handleLogout: authLogout,
    setAddresses,
  } = useAuth();
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

        let loginResponse = await loginUserFromBackendServer(
          "GMAIL",
          userInfo.data.email
        );

        if (loginResponse.error) {
          throw new Error("Backend login failed");
        }

        // Set user data
        setUser({
          email: userInfo.data.email,
          name: userInfo.data.name,
          picture: userInfo.data.picture,
          userId: loginResponse.result._id,
        });

        // Get user details to ensure we have latest data
        const userDetails = await getUserDetails(loginResponse.result._id);
        if (!userDetails.error && userDetails.result?.addresses?.length > 0) {
          await setAddresses(userDetails.result.addresses);
        } else if (!loginResponse.result.addresses?.length) {
          setIsAddressModalOpen(true);
        }
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

  const handleLogoutClick = () => {
    googleLogout();
    // Reset all states
    chatDispatch({ type: "RESET_STATE" });
    restaurantDispatch({ type: "RESET_STATE" });
    // Reset auth state
    authLogout();
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
    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-white">
      <div className="flex items-center gap-3">
        <div className="text-2xl font-bold text-primary">gobbl</div>
      </div>
      <div className="flex items-center gap-2">
        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            <img
              src={user?.picture}
              alt={user?.name || "User"}
              className="w-8 h-8 rounded-full border-2 border-primary"
            />
            <span className="text-sm font-medium text-gray-800">
              {user?.name?.split(" ")[0]}
            </span>
            <button
              onClick={handleLogoutClick}
              className="ml-2 p-1.5 hover:bg-gray-50 rounded-full transition-colors"
            >
              <LogOut className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleLoginClick}
            disabled={isLoggingIn}
            className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-600 rounded-lg border border-gray-200 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="text-sm font-medium">
              {isLoggingIn ? "Signing in..." : "Sign in"}
            </span>
          </button>
        )}
        <button
          onClick={onOpenPanel}
          className="p-1.5 hover:bg-gray-50 rounded-full transition-colors"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

import React from "react";
import { MoreHorizontal, LogOut, User as UserIcon } from "lucide-react";
import { useChatContext, QueryType } from "../context/ChatContext";
import { useRestaurant } from "../context/RestaurantContext";
import { useAuth } from "../context/AuthContext";
import { loginUserFromBackendServer } from "../actions/serverActions";
import { useGoogleLogin, googleLogout } from "@react-oauth/google";
import axios from "axios";
import { useState, useCallback, useEffect } from "react";

interface HeaderProps {
  onOpenPanel: () => void;
  onCartClick: () => void;
}
import { useFiltersContext } from "../context/FiltersContext";

export const Header: React.FC<HeaderProps> = ({ onOpenPanel, onCartClick }) => {
  const { theme } = useFiltersContext();
  const { dispatch: chatDispatch } = useChatContext();
  const { dispatch: restaurantDispatch } = useRestaurant();
  const {
    user,
    setUser,
    setIsAddressModalOpen,
    isAuthenticated,
    handleLogout: authLogout,
    setAddresses,
    setInternalAddresses,
  } = useAuth();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isTelegramWebApp, setIsTelegramWebApp] = useState(false);

  // Initialize Telegram WebApp
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-web-app.js";
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      // @ts-ignore
      const tg = window.Telegram?.WebApp;
      if (tg) {
        const user = tg.initDataUnsafe?.user;
        if (!user?.id) {
          throw new Error("No Telegram user data available");
        }

        console.log(tg);
        setIsTelegramWebApp(true);
        tg.ready();
        // Auto login if in Telegram WebApp
        handleTelegramLogin();
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, [isAuthenticated]); // Re-run if auth state changes

  const handleTelegramLogin = async () => {
    try {
      setIsLoggingIn(true);
      setLoginError(null);

      // @ts-ignore
      const tg = window.Telegram?.WebApp;
      if (!tg) {
        throw new Error("Telegram WebApp not initialized");
      }

      const user = tg.initDataUnsafe?.user;
      if (!user?.id) {
        throw new Error("No Telegram user data available");
      }

      let loginResponse = await loginUserFromBackendServer(
        "TELEGRAM",
        user.id.toString()
      );

      if (loginResponse.error) {
        throw new Error("Backend login failed");
      }

      // Set user data
      setUser({
        email: `${user.username || user.id}@telegram.com`,
        name: user.first_name + (user.last_name ? ` ${user.last_name}` : ""),
        picture: user.photo_url,
        userId: loginResponse.result._id,
      });

      // Get user details to ensure we have latest data
      if (loginResponse.result?.addresses?.length > 0) {
        await setInternalAddresses(loginResponse.result.addresses);
      } else {
        setIsAddressModalOpen(true);
      }
    } catch (error) {
      console.error("Telegram login error:", error);
      setLoginError(error instanceof Error ? error.message : "Login failed");
    } finally {
      setIsLoggingIn(false);
    }
  };

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
        if (loginResponse.result?.addresses?.length > 0) {
          await setInternalAddresses(loginResponse.result.addresses);
        } else {
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
    <div
      className="px-4 py-3 border-b flex items-center justify-between transition-colors duration-300"
      style={{
        backgroundColor: theme.headerBg || "#0B0E11",
        borderColor: theme.border,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="text-2xl font-bold transition-colors duration-300"
          style={{ color: theme.headerHighlight }}
        >
          gobbl
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isAuthenticated ? (
          <div className="flex items-center gap-2" onClick={onOpenPanel}>
            <span
              className="text-sm font-medium"
              style={{ color: theme.headerText }}
            >
              {user?.name?.split(" ")[0]}
            </span>{" "}
            <img
              src={user?.picture}
              alt={user?.name || "User"}
              className="w-7 h-7 rounded-full border-2"
              style={{ borderColor: theme.primary }}
            />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleLoginClick}
              disabled={isLoggingIn}
              className={`flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-600 rounded-lg border border-gray-200 transition-colors ${
                isTelegramWebApp ? "hidden" : ""
              }`}
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
          </div>
        )}
      </div>
    </div>
  );
};

import { useCallback, useEffect, useState } from "react";
import { API_BASE_URL } from "../constants/api";
import { AuthTokenResponse, AuthUser, Screen } from "../types/app";

const AUTH_TOKEN_KEY = "oak_report_auth_token";

type UseAuthSessionArgs = {
  screen: Screen;
  setScreen: (nextScreen: Screen) => void;
};

type UseAuthSessionResult = {
  authToken: string | null;
  authUser: AuthUser | null;
  isAuthLoading: boolean;
  isAuthSubmitting: boolean;
  authError: string | null;
  handleCredentialReceived: (idToken: string) => Promise<void>;
  handleSignOut: () => void;
  handleScreenChange: (nextScreen: Screen) => void;
};

export function useAuthSession({
  screen,
  setScreen,
}: UseAuthSessionArgs): UseAuthSessionResult {
  const [authToken, setAuthToken] = useState<string | null>(() =>
    localStorage.getItem(AUTH_TOKEN_KEY),
  );
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const setStoredToken = useCallback((token: string | null) => {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
    setAuthToken(token);
  }, []);

  useEffect(() => {
    if (!authToken) {
      setAuthUser(null);
      setIsAuthLoading(false);
      return;
    }

    let cancelled = false;

    async function bootstrapSession() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (!response.ok) {
          throw new Error("Session is no longer valid.");
        }

        const user: AuthUser = await response.json();
        if (!cancelled) {
          setAuthUser(user);
        }
      } catch {
        if (!cancelled) {
          setStoredToken(null);
          setAuthUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsAuthLoading(false);
        }
      }
    }

    bootstrapSession();

    return () => {
      cancelled = true;
    };
  }, [authToken, setStoredToken]);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (!authUser && screen !== "signin") {
      setScreen("signin");
      return;
    }

    if (authUser && screen === "signin") {
      setScreen("profile");
      return;
    }

    if (authUser && authUser.role !== "admin" && screen === "admin") {
      setScreen("profile");
      return;
    }

    if (authUser && authUser.role === "na" && (screen === "appraise" || screen === "collection")) {
      setScreen("access_required");
      return;
    }

    if (authUser && screen === "library") {
      setScreen(authUser.role === "na" ? "access_required" : "profile");
      return;
    }

    if (authUser && authUser.role !== "na" && screen === "access_required") {
      setScreen("profile");
    }
  }, [authUser, isAuthLoading, screen, setScreen]);

  const handleCredentialReceived = useCallback(
    async (idToken: string) => {
      setIsAuthSubmitting(true);
      setAuthError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id_token: idToken }),
        });

        if (!response.ok) {
          throw new Error("Authentication failed. Please try again.");
        }

        const payload: AuthTokenResponse = await response.json();
        setStoredToken(payload.access_token);
        setAuthUser(payload.user);
        setScreen(payload.user.role === "na" ? "access_required" : "profile");
      } catch {
        setAuthError("Sign-in failed. Confirm backend auth configuration and retry.");
      } finally {
        setIsAuthSubmitting(false);
      }
    },
    [setScreen, setStoredToken],
  );

  const handleSignOut = useCallback(() => {
    setStoredToken(null);
    setAuthUser(null);
    setScreen("signin");
  }, [setScreen, setStoredToken]);

  const handleScreenChange = useCallback(
    (nextScreen: Screen) => {
      if (nextScreen !== "signin" && !authUser) {
        setScreen("signin");
        return;
      }

      if (nextScreen === "signin" && authUser) {
        setScreen("profile");
        return;
      }

      if (nextScreen === "admin" && authUser?.role !== "admin") {
        setScreen("profile");
        return;
      }

      if (
        authUser?.role === "na" &&
        (nextScreen === "appraise" || nextScreen === "collection" || nextScreen === "library")
      ) {
        setScreen("access_required");
        return;
      }

      if (nextScreen === "library") {
        setScreen("profile");
        return;
      }

      setScreen(nextScreen);
    },
    [authUser, setScreen],
  );

  return {
    authToken,
    authUser,
    isAuthLoading,
    isAuthSubmitting,
    authError,
    handleCredentialReceived,
    handleSignOut,
    handleScreenChange,
  };
}
import { useEffect, useState } from "react";

const TOKEN_KEY = "snacksup_token";
const SESSION_DATA_KEY = "snacksup_session_data";

interface SessionData {
  token: string;
  byobCount: number;
}

export function useSessionManager() {
  const [token, setToken] = useState<string>(() => localStorage.getItem(TOKEN_KEY) || "");
  const [session, setSession] = useState<SessionData | null>(() => {
    const saved = localStorage.getItem(SESSION_DATA_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setIsLoading(true);
      // Simulate generating a unique guest token locally
      const newToken = "guest_" + Math.random().toString(36).substring(2, 15);
      const initialSession: SessionData = {
        token: newToken,
        byobCount: 0 // Default starting value
      };

      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem(SESSION_DATA_KEY, JSON.stringify(initialSession));
      
      setToken(newToken);
      setSession(initialSession);
      setIsLoading(false);
    }
  }, [token]);

  const refreshSession = () => {
    // Read fresh data from localStorage if modified elsewhere
    const saved = localStorage.getItem(SESSION_DATA_KEY);
    if (saved) setSession(JSON.parse(saved));
  };

  return {
    session,
    token,
    isLoading,
    refreshSession,
    isPremiumUnlocked: session ? session.byobCount >= 3 : false,
    isExtraCheeseUnlocked: session ? session.byobCount >= 6 : false,
  };
}
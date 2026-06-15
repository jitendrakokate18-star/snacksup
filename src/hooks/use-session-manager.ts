import { useEffect } from "react";
import { useCreateSession, useGetSession, getGetSessionQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const TOKEN_KEY = "snacksup_token";

export function useSessionManager() {
  const queryClient = useQueryClient();
  const token = localStorage.getItem(TOKEN_KEY) || "";

  const createSession = useCreateSession();

  const { data: session, isLoading, refetch } = useGetSession(token, {
    query: {
      enabled: !!token,
      queryKey: getGetSessionQueryKey(token),
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  });

  useEffect(() => {
    if (!token && !createSession.isPending) {
      createSession.mutate(
        { data: {} },
        {
          onSuccess: (newSession) => {
            localStorage.setItem(TOKEN_KEY, newSession.token);
            queryClient.setQueryData(getGetSessionQueryKey(newSession.token), newSession);
            window.location.reload(); // Quick reload to bootstrap the app with new token
          },
        }
      );
    }
  }, [token, createSession.isPending, createSession.mutate, queryClient]);

  const refreshSession = () => {
    if (token) {
      refetch();
    }
  };

  return {
    session,
    token,
    isLoading: isLoading || (!token && createSession.isPending),
    refreshSession,
    isPremiumUnlocked: session ? session.byobCount >= 3 : false,
    isExtraCheeseUnlocked: session ? session.byobCount >= 6 : false,
  };
}

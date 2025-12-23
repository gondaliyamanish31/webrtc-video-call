"use client";

import { VideoCallProvider } from "@/contexts/VideoCallContext";
import { SessionLoader } from "@/provider/SessionLoader";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionContext, SessionProvider } from "next-auth/react";
import { useState, useEffect } from "react";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#667eea",
    },
    secondary: {
      main: "#764ba2",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  useEffect(() => {
    // Initialize Socket.IO server on first client mount (no-op on server).
    fetch("/api/socket").catch((err) => {
      console.error("Failed to initialize socket:", err);
    });
  }, []);

  return (
    <SessionProvider>
      <SessionLoader>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider theme={theme}>
            <CssBaseline />

            <VideoCallProvider>{children}</VideoCallProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SessionLoader>
    </SessionProvider>
  );
}
Providers.displayName = "Providers";

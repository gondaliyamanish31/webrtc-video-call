import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    if (!socket) {
      socket = io("http://localhost:3000", {
        path: "/api/socket",
        transports: ["websocket", "polling"],
      });

      socket.on("connect", () => {
        console.log("Connected to Socket.IO");
        setIsConnected(true);
      });

      socket.on("disconnect", () => {
        console.log("Disconnected from Socket.IO");
        setIsConnected(false);
      });
    }

    return () => {
      // Don't disconnect on component unmount
      // Socket persists across page navigation
    };
  }, []);

  return { socket, isConnected };
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

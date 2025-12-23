// contexts/VideoCallContext2.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useRef,
  useEffect,
} from "react";
import { Socket } from "socket.io-client";
import { CONNECTION_STATUS, ConnectionStatus } from "../utils/constants";

const STUN_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
  ],
};

type VideoCallContextType = {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  connectionStatus: ConnectionStatus;
  roomId: string | null;
  isCreator: boolean;
  hasPermissions: boolean;
  error: string | null;
  requestPermissions: () => Promise<void>;
  createRoom: (roomId: string) => Promise<void>;
  joinRoom: (roomId: string) => Promise<void>;
  toggleAudio: () => void;
  toggleVideo: () => void;
  endCall: () => void;
};

const VideoCallContext2 = createContext<VideoCallContextType | undefined>(
  undefined
);

export const VideoCallProvider2: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(
    new Map()
  );
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    CONNECTION_STATUS.DISCONNECTED
  );
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isCreator, setIsCreator] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const socketRef = useRef<Socket | null>(null);

  // Initialize socket connection
  useEffect(() => {
    const initSocket = async () => {
      const { io } = await import("socket.io-client");

      const socket = io({
        path: "/api/socket",
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socket.on("connect", () => {
        console.log("✅ Socket.IO connected:", socket.id);
      });

      socket.on("disconnect", () => {
        console.log("❌ Socket.IO disconnected");
      });

      socket.on("connect_error", (err) => {
        console.error("Socket connection error:", err);
      });

      socketRef.current = socket;
    };

    initSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const requestPermissions = useCallback(async () => {
    try {
      setError(null);
      console.log("🎤 Requesting media permissions...");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      console.log("✅ Media permissions granted");
      console.log("Audio tracks:", stream.getAudioTracks().length);
      console.log("Video tracks:", stream.getVideoTracks().length);

      // Ensure tracks are enabled
      stream.getAudioTracks().forEach((track) => {
        track.enabled = true;
        console.log("Audio track enabled:", track.label);
      });
      stream.getVideoTracks().forEach((track) => {
        track.enabled = true;
        console.log("Video track enabled:", track.label);
      });

      setLocalStream(stream);
      setHasPermissions(true);
    } catch (err: any) {
      console.error("❌ Permission error:", err);
      setError("Failed to access camera/microphone. Please grant permissions.");
      setHasPermissions(false);
      throw err;
    }
  }, []);

  const createPeerConnection = useCallback(
    (remoteUserId: string) => {
      console.log("🔗 Creating peer connection for:", remoteUserId);

      // Close existing connection if any
      const existingPc = peerConnectionsRef.current.get(remoteUserId);
      if (existingPc) {
        existingPc.close();
      }

      const pc = new RTCPeerConnection(STUN_SERVERS);
      peerConnectionsRef.current.set(remoteUserId, pc);

      // Add local stream tracks
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          console.log(`Adding ${track.kind} track for ${remoteUserId}`);
          pc.addTrack(track, localStream);
        });
      }

      // Handle incoming remote stream
      pc.ontrack = (event) => {
        console.log("📥 Received remote track from:", remoteUserId);
        if (event.streams && event.streams[0]) {
          setRemoteStreams((prev) => {
            const newMap = new Map(prev);
            newMap.set(remoteUserId, event.streams[0]);
            return newMap;
          });
          setConnectionStatus(CONNECTION_STATUS.CONNECTED);
        }
      };

      // Send ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit("ice-candidate", {
            candidate: event.candidate,
            to: remoteUserId,
          });
        }
      };

      // Monitor connection state
      pc.onconnectionstatechange = () => {
        console.log(
          `🔄 Connection state for ${remoteUserId}:`,
          pc.connectionState
        );
        if (
          pc.connectionState === "failed" ||
          pc.connectionState === "disconnected"
        ) {
          setRemoteStreams((prev) => {
            const newMap = new Map(prev);
            newMap.delete(remoteUserId);
            return newMap;
          });
        }
      };

      return pc;
    },
    [localStream]
  );

  const setupSocketListeners = useCallback(() => {
    if (!socketRef.current) return;

    const socket = socketRef.current;

    // Remove all previous listeners
    socket.removeAllListeners();

    // Room created successfully
    socket.on("room-created", ({ roomId: createdRoomId }) => {
      console.log("✅ Room created:", createdRoomId);
      setConnectionStatus(CONNECTION_STATUS.WAITING);
    });

    // FIXED: Handle room joined event
    socket.on(
      "room-joined",
      ({ roomId: joinedRoomId, existingUsers, roomStats }) => {
        console.log("✅ Room joined:", joinedRoomId);
        console.log("👥 Existing users:", existingUsers);
        console.log("📊 Room Stats:", roomStats); // NEW DEBUG LOG

        if (existingUsers && existingUsers.length > 0) {
          setConnectionStatus(CONNECTION_STATUS.CONNECTING);
          existingUsers.forEach((userId: string) => {
            createPeerConnection(userId);
          });
        } else {
          setConnectionStatus(CONNECTION_STATUS.WAITING);
        }
      }
    );

    // User joined the room (for room creator)
    socket.on("user-joined", async ({ userId, roomStats }) => {
      console.log("👤 New user joined:", userId);
      console.log("📊 Updated Room Stats:", roomStats);

      try {
        setConnectionStatus(CONNECTION_STATUS.CONNECTING);
        const pc = createPeerConnection(userId);

        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });

        await pc.setLocalDescription(offer);

        socket.emit("offer", {
          offer,
          to: userId,
        });
      } catch (err) {
        console.error("❌ Error creating offer:", err);
      }
    });

    // Received offer from remote peer
    socket.on("offer", async ({ offer, from }) => {
      console.log("📥 Received offer from:", from);

      try {
        const pc = createPeerConnection(from);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("answer", {
          answer,
          to: from,
        });
      } catch (err) {
        console.error("❌ Error handling offer:", err);
      }
    });

    // Received answer from remote peer
    socket.on("answer", async ({ answer, from }) => {
      console.log("📥 Received answer from:", from);

      try {
        const pc = peerConnectionsRef.current.get(from);
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
      } catch (err) {
        console.error("❌ Error handling answer:", err);
      }
    });

    // Handle ICE candidates
    socket.on("ice-candidate", async ({ candidate, from }) => {
      console.log("🧊 Received ICE candidate from:", from);

      try {
        const pc = peerConnectionsRef.current.get(from);
        if (pc && pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error("❌ Error adding ICE candidate:", err);
      }
    });

    // User left the room
    socket.on("user-left", ({ userId }) => {
      console.log("👋 User left:", userId);

      const pc = peerConnectionsRef.current.get(userId);
      if (pc) {
        pc.close();
        peerConnectionsRef.current.delete(userId);
      }

      setRemoteStreams((prev) => {
        const newMap = new Map(prev);
        newMap.delete(userId);
        return newMap;
      });
    });

    // Error from server
    socket.on("error", ({ message }) => {
      console.error("❌ Server error:", message);
      setError(message);
      setConnectionStatus(CONNECTION_STATUS.FAILED);
    });
  }, [createPeerConnection]);

  const createRoom = useCallback(
    async (newRoomId: string) => {
      if (!localStream) {
        setError("Please grant camera and microphone permissions first.");
        return;
      }

      if (!socketRef.current?.connected) {
        setError("Socket connection not ready. Please try again.");
        return;
      }

      try {
        setConnectionStatus(CONNECTION_STATUS.CONNECTING);
        setRoomId(newRoomId);
        setIsCreator(true);
        setError(null);

        console.log("🏠 Creating room:", newRoomId);
        console.log("📡 Socket ID:", socketRef.current.id);
        console.log("📹 Local stream tracks:", localStream.getTracks().length);

        setupSocketListeners();
        socketRef.current.emit("create-room", newRoomId);

        console.log("✅ Create room event emitted");
      } catch (err: any) {
        console.error("❌ Error creating room:", err);
        setError(err.message || "Failed to create room");
        setConnectionStatus(CONNECTION_STATUS.FAILED);
      }
    },
    [localStream, setupSocketListeners]
  );

  const joinRoom = useCallback(
    async (targetRoomId: string) => {
      if (!localStream) {
        setError("Please grant camera and microphone permissions first.");
        return;
      }

      if (!socketRef.current?.connected) {
        setError("Socket connection not ready. Please try again.");
        return;
      }

      if (!targetRoomId || targetRoomId.trim() === "") {
        setError("Please enter a valid room ID");
        return;
      }

      try {
        setConnectionStatus(CONNECTION_STATUS.CONNECTING);
        setRoomId(targetRoomId);
        setIsCreator(false);
        setError(null);

        console.log("🚪 Joining room:", targetRoomId);
        console.log("📡 Socket ID:", socketRef.current.id);
        console.log("📹 Local stream tracks:", localStream.getTracks().length);

        setupSocketListeners();
        socketRef.current.emit("join-room", targetRoomId);

        console.log("✅ Join room event emitted");
      } catch (err: any) {
        console.error("❌ Error joining room:", err);
        setError(err.message || "Failed to join room");
        setConnectionStatus(CONNECTION_STATUS.FAILED);
      }
    },
    [localStream, setupSocketListeners]
  );

  const toggleAudio = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
        console.log("🎤 Audio", track.enabled ? "enabled" : "disabled");
      });
      setIsAudioEnabled(!isAudioEnabled);
    }
  }, [localStream, isAudioEnabled]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
        console.log("📹 Video", track.enabled ? "enabled" : "disabled");
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  }, [localStream, isVideoEnabled]);

  const endCall = useCallback(() => {
    console.log("📞 Ending call...");

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    // Close all peer connections (NOT just one)
    peerConnectionsRef.current.forEach((pc) => {
      pc.close();
    });
    peerConnectionsRef.current.clear();

    if (socketRef.current && roomId) {
      socketRef.current.emit("leave-room", roomId);
      socketRef.current.removeAllListeners();
    }

    setRemoteStreams(new Map()); // Clear all remote streams
    setRoomId(null);
    setConnectionStatus(CONNECTION_STATUS.DISCONNECTED);
    setIsAudioEnabled(true);
    setIsVideoEnabled(true);
    setHasPermissions(false);
    setError(null);
  }, [localStream, roomId]);

  return (
    <VideoCallContext2.Provider
      value={{
        localStream,
        remoteStream: null,
        remoteStreams,
        isAudioEnabled,
        isVideoEnabled,
        connectionStatus,
        roomId,
        isCreator,
        hasPermissions,
        error,
        requestPermissions,
        createRoom,
        joinRoom,
        toggleAudio,
        toggleVideo,
        endCall,
      }}
    >
      {children}
    </VideoCallContext2.Provider>
  );
};

export const useVideoCall = () => {
  const context = useContext(VideoCallContext2);
  if (!context) {
    throw new Error("useVideoCall must be used within VideoCallProvider");
  }
  return context;
};

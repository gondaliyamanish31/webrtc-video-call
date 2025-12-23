// contexts/VideoCallContext3.tsx
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
  ],
};

type VideoCallContextType = {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
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

const VideoCallContext3 = createContext<VideoCallContextType | undefined>(
  undefined
);

export const VideoCallProvider3: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    CONNECTION_STATUS.DISCONNECTED
  );
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isCreator, setIsCreator] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const iceCandidatesQueue = useRef<RTCIceCandidate[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const remoteUserIdRef = useRef<string | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const initSocket = async () => {
      const { io } = await import("socket.io-client");
      const socket = io({
        path: "/api/socket",
        transports: ["websocket", "polling"],
      });

      socket.on("connect", () => {
        console.log("✅ Socket connected:", socket.id);
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
      console.log("🎤 Requesting permissions...");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // CRITICAL: Explicitly enable all tracks
      stream.getTracks().forEach((track) => {
        track.enabled = true;
        console.log(`✅ ${track.kind} track enabled:`, track.label);
      });

      setLocalStream(stream);
      localStreamRef.current = stream;
      setHasPermissions(true);
      console.log(
        "✅ Permissions granted - Video:",
        stream.getVideoTracks().length,
        "Audio:",
        stream.getAudioTracks().length
      );
    } catch (err: any) {
      console.error("❌ Permission error:", err);
      setError("Camera/microphone access denied");
      throw err;
    }
  }, []);

  const createPeerConnection = useCallback(() => {
    console.log("🔗 Creating new peer connection...");

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    const pc = new RTCPeerConnection(STUN_SERVERS);
    peerConnectionRef.current = pc;

    // CRITICAL: Add ALL local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        console.log(
          `➕ Adding ${track.kind} track to PC:`,
          track.label,
          "enabled:",
          track.enabled
        );
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // CRITICAL: Handle remote tracks
    pc.ontrack = (event) => {
      console.log(
        "📥 Got remote track:",
        event.track.kind,
        "enabled:",
        event.track.enabled
      );
      if (event.streams && event.streams[0]) {
        console.log("✅ Setting remote stream");
        setRemoteStream(event.streams[0]);
        setConnectionStatus(CONNECTION_STATUS.CONNECTED);
      }
    };

    // ICE candidate handling
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current && remoteUserIdRef.current) {
        console.log("🧊 Sending ICE candidate");
        socketRef.current.emit("ice-candidate", {
          candidate: event.candidate,
          to: remoteUserIdRef.current,
        });
      }
    };

    // Connection state monitoring
    pc.onconnectionstatechange = () => {
      console.log("🔄 Connection state:", pc.connectionState);
      if (pc.connectionState === "connected") {
        setConnectionStatus(CONNECTION_STATUS.CONNECTED);
        setError(null);
      } else if (pc.connectionState === "failed") {
        setError("Connection failed");
        setConnectionStatus(CONNECTION_STATUS.FAILED);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("🧊 ICE state:", pc.iceConnectionState);
    };

    return pc;
  }, []);

  const setupSocketListeners = useCallback(() => {
    if (!socketRef.current) return;

    const socket = socketRef.current;
    socket.removeAllListeners();

    // Room created
    socket.on("room-created", ({ roomId }) => {
      console.log("✅ Room created:", roomId);
      setConnectionStatus(CONNECTION_STATUS.WAITING);
    });

    // Room joined successfully
    socket.on("room-joined", ({ roomId, existingUsers }) => {
      console.log("✅ Joined room:", roomId, "existing users:", existingUsers);

      if (existingUsers && existingUsers.length > 0) {
        remoteUserIdRef.current = existingUsers[0];
        console.log("👤 Room has existing user:", existingUsers[0]);
        setConnectionStatus(CONNECTION_STATUS.CONNECTING);

        // Joiner creates peer connection and waits for offer
        createPeerConnection();
      } else {
        setConnectionStatus(CONNECTION_STATUS.WAITING);
      }
    });

    // Someone joined my room (I'm the creator)
    socket.on("user-joined", async ({ userId }) => {
      console.log("👤 User joined my room:", userId);
      remoteUserIdRef.current = userId;
      setConnectionStatus(CONNECTION_STATUS.CONNECTING);

      try {
        const pc = createPeerConnection();

        console.log("📤 Creating offer...");
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        console.log("✅ Offer created and set as local description");

        socket.emit("offer", { offer, to: userId });
        console.log("📤 Offer sent to:", userId);
      } catch (err) {
        console.error("❌ Error creating offer:", err);
        setError("Failed to create offer");
      }
    });

    // Received offer (I'm the joiner)
    socket.on("offer", async ({ offer, from }) => {
      console.log("📥 Received offer from:", from);
      remoteUserIdRef.current = from;

      try {
        let pc = peerConnectionRef.current;

        // Create peer connection if not exists
        if (!pc) {
          pc = createPeerConnection();
        }

        console.log("📥 Setting remote description (offer)...");
        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        // Process queued ICE candidates
        while (iceCandidatesQueue.current.length > 0) {
          const candidate = iceCandidatesQueue.current.shift();
          if (candidate) {
            await pc.addIceCandidate(candidate);
            console.log("✅ Added queued ICE candidate");
          }
        }

        console.log("📤 Creating answer...");
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log("✅ Answer created and set as local description");

        socket.emit("answer", { answer, to: from });
        console.log("📤 Answer sent to:", from);
      } catch (err) {
        console.error("❌ Error handling offer:", err);
        setError("Failed to handle offer");
      }
    });

    // Received answer (I'm the creator)
    socket.on("answer", async ({ answer, from }) => {
      console.log("📥 Received answer from:", from);

      try {
        if (peerConnectionRef.current) {
          console.log("📥 Setting remote description (answer)...");
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(answer)
          );
          console.log("✅ Remote description set");

          // Process queued ICE candidates
          while (iceCandidatesQueue.current.length > 0) {
            const candidate = iceCandidatesQueue.current.shift();
            if (candidate) {
              await peerConnectionRef.current.addIceCandidate(candidate);
              console.log("✅ Added queued ICE candidate");
            }
          }
        }
      } catch (err) {
        console.error("❌ Error handling answer:", err);
        setError("Failed to handle answer");
      }
    });

    // ICE candidate
    socket.on("ice-candidate", async ({ candidate, from }) => {
      console.log("🧊 Received ICE candidate from:", from);

      try {
        const iceCandidate = new RTCIceCandidate(candidate);

        if (peerConnectionRef.current?.remoteDescription) {
          await peerConnectionRef.current.addIceCandidate(iceCandidate);
          console.log("✅ ICE candidate added");
        } else {
          console.log("⏳ Queueing ICE candidate (no remote description yet)");
          iceCandidatesQueue.current.push(iceCandidate);
        }
      } catch (err) {
        console.error("❌ Error adding ICE candidate:", err);
      }
    });

    // User left
    socket.on("user-left", ({ userId }) => {
      console.log("👋 User left:", userId);
      setRemoteStream(null);
      setConnectionStatus(CONNECTION_STATUS.WAITING);

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      remoteUserIdRef.current = null;
      iceCandidatesQueue.current = [];
    });

    // Error
    socket.on("error", ({ message }) => {
      console.error("❌ Server error:", message);
      setError(message);
      setConnectionStatus(CONNECTION_STATUS.FAILED);
    });
  }, [createPeerConnection]);

  const createRoom = useCallback(
    async (newRoomId: string) => {
      if (!localStreamRef.current) {
        setError("Please grant permissions first");
        return;
      }

      if (!socketRef.current?.connected) {
        setError("Socket not connected");
        return;
      }

      try {
        setConnectionStatus(CONNECTION_STATUS.CONNECTING);
        setRoomId(newRoomId);
        setIsCreator(true);
        setError(null);

        console.log("🏠 Creating room:", newRoomId);
        setupSocketListeners();
        socketRef.current.emit("create-room", newRoomId);
      } catch (err: any) {
        console.error("❌ Create room error:", err);
        setError(err.message || "Failed to create room");
        setConnectionStatus(CONNECTION_STATUS.FAILED);
      }
    },
    [setupSocketListeners]
  );

  const joinRoom = useCallback(
    async (targetRoomId: string) => {
      if (!localStreamRef.current) {
        setError("Please grant permissions first");
        return;
      }

      if (!socketRef.current?.connected) {
        setError("Socket not connected");
        return;
      }

      try {
        setConnectionStatus(CONNECTION_STATUS.CONNECTING);
        setRoomId(targetRoomId);
        setIsCreator(false);
        setError(null);

        console.log("🚪 Joining room:", targetRoomId);
        setupSocketListeners();
        socketRef.current.emit("join-room", targetRoomId);
      } catch (err: any) {
        console.error("❌ Join room error:", err);
        setError(err.message || "Failed to join room");
        setConnectionStatus(CONNECTION_STATUS.FAILED);
      }
    },
    [setupSocketListeners]
  );

  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
        console.log("🎤 Audio", track.enabled ? "ON" : "OFF");
      });
      setIsAudioEnabled((prev) => !prev);
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
        console.log("📹 Video", track.enabled ? "ON" : "OFF");
      });
      setIsVideoEnabled((prev) => !prev);
    }
  }, []);

  const endCall = useCallback(() => {
    console.log("📞 Ending call...");

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (socketRef.current && roomId) {
      socketRef.current.emit("leave-room", roomId);
      socketRef.current.removeAllListeners();
    }

    setRemoteStream(null);
    setRoomId(null);
    setConnectionStatus(CONNECTION_STATUS.DISCONNECTED);
    setIsAudioEnabled(true);
    setIsVideoEnabled(true);
    setHasPermissions(false);
    setError(null);
    remoteUserIdRef.current = null;
    iceCandidatesQueue.current = [];
  }, [roomId]);

  return (
    <VideoCallContext3.Provider
      value={{
        localStream,
        remoteStream,
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
    </VideoCallContext3.Provider>
  );
};

export const useVideoCall = () => {
  const context = useContext(VideoCallContext3);
  if (!context) {
    throw new Error("useVideoCall must be used within VideoCallProvider");
  }
  return context;
};

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
  iceCandidatePoolSize: 10,
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

const VideoCallContext4 = createContext<VideoCallContextType | undefined>(
  undefined
);

export const VideoCallProvider4: React.FC<{ children: ReactNode }> = ({
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
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidate[]>>(
    new Map()
  );
  const isCleaningUpRef = useRef(false);

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
          width: { ideal: 1280, max: 1280 },
          height: { ideal: 720, max: 720 },
          facingMode: "user",
          frameRate: { ideal: 30, max: 30 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      console.log("✅ Media permissions granted");

      stream.getAudioTracks().forEach((track) => {
        track.enabled = true;
      });
      stream.getVideoTracks().forEach((track) => {
        track.enabled = true;
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

      const existingPc = peerConnectionsRef.current.get(remoteUserId);
      if (existingPc && existingPc.connectionState !== "closed") {
        console.log("♻️ Reusing existing connection for:", remoteUserId);
        return existingPc;
      }

      if (existingPc) {
        existingPc.close();
      }

      const pc = new RTCPeerConnection(STUN_SERVERS);
      peerConnectionsRef.current.set(remoteUserId, pc);

      if (localStream) {
        localStream.getTracks().forEach((track) => {
          pc.addTrack(track, localStream);
        });
      }

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

      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit("ice-candidate", {
            candidate: event.candidate,
            to: remoteUserId,
          });
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log(`🧊 ICE state for ${remoteUserId}:`, pc.iceConnectionState);
      };

      pc.onconnectionstatechange = () => {
        console.log(
          `🔄 Connection state for ${remoteUserId}:`,
          pc.connectionState
        );

        if (pc.connectionState === "failed") {
          console.log(`❌ Connection failed for ${remoteUserId}, cleaning up`);
          cleanupPeerConnection(remoteUserId);
        } else if (pc.connectionState === "disconnected") {
          setTimeout(() => {
            if (pc.connectionState === "disconnected") {
              console.log(`❌ Connection timeout for ${remoteUserId}`);
              cleanupPeerConnection(remoteUserId);
            }
          }, 5000);
        }
      };

      return pc;
    },
    [localStream]
  );

  const cleanupPeerConnection = useCallback((userId: string) => {
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

    pendingCandidatesRef.current.delete(userId);
  }, []);

  const setupSocketListeners = useCallback(() => {
    if (!socketRef.current) return;

    const socket = socketRef.current;
    socket.removeAllListeners();

    socket.on("room-created", ({ roomId: createdRoomId }) => {
      console.log("✅ Room created:", createdRoomId);
      setConnectionStatus(CONNECTION_STATUS.WAITING);
    });

    socket.on("room-joined", ({ roomId: joinedRoomId, existingUsers }) => {
      console.log("✅ Room joined:", joinedRoomId);
      console.log("👥 Existing users:", existingUsers);

      if (existingUsers && existingUsers.length > 0) {
        setConnectionStatus(CONNECTION_STATUS.CONNECTING);
        existingUsers.forEach((userId: string) => {
          createPeerConnection(userId);
        });
      } else {
        setConnectionStatus(CONNECTION_STATUS.WAITING);
      }
    });

    socket.on("user-joined", async ({ userId }) => {
      console.log("👤 New user joined:", userId);

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

        const pending = pendingCandidatesRef.current.get(userId);
        if (pending) {
          for (const candidate of pending) {
            await pc.addIceCandidate(candidate).catch(console.error);
          }
          pendingCandidatesRef.current.delete(userId);
        }
      } catch (err) {
        console.error("❌ Error creating offer:", err);
      }
    });

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

        const pending = pendingCandidatesRef.current.get(from);
        if (pending) {
          for (const candidate of pending) {
            await pc.addIceCandidate(candidate).catch(console.error);
          }
          pendingCandidatesRef.current.delete(from);
        }
      } catch (err) {
        console.error("❌ Error handling offer:", err);
      }
    });

    socket.on("answer", async ({ answer, from }) => {
      console.log("📥 Received answer from:", from);

      try {
        const pc = peerConnectionsRef.current.get(from);
        if (pc && pc.signalingState !== "stable") {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));

          const pending = pendingCandidatesRef.current.get(from);
          if (pending) {
            for (const candidate of pending) {
              await pc.addIceCandidate(candidate).catch(console.error);
            }
            pendingCandidatesRef.current.delete(from);
          }
        }
      } catch (err) {
        console.error("❌ Error handling answer:", err);
      }
    });

    socket.on("ice-candidate", async ({ candidate, from }) => {
      try {
        const pc = peerConnectionsRef.current.get(from);
        if (pc && pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          const pending = pendingCandidatesRef.current.get(from) || [];
          pending.push(new RTCIceCandidate(candidate));
          pendingCandidatesRef.current.set(from, pending);
        }
      } catch (err) {
        console.error("❌ Error adding ICE candidate:", err);
      }
    });

    socket.on("user-left", ({ userId }) => {
      console.log("👋 User left:", userId);
      cleanupPeerConnection(userId);
    });

    socket.on("error", ({ message }) => {
      console.error("❌ Server error:", message);
      setError(message);
      setConnectionStatus(CONNECTION_STATUS.FAILED);
    });
  }, [createPeerConnection, cleanupPeerConnection]);

  const createRoom = useCallback(
    async (newRoomId: string) => {
      if (!localStream || !socketRef.current?.connected) {
        setError("Not ready to create room");
        return;
      }

      try {
        setConnectionStatus(CONNECTION_STATUS.CONNECTING);
        setRoomId(newRoomId);
        setIsCreator(true);
        setError(null);

        setupSocketListeners();
        socketRef.current.emit("create-room", newRoomId);
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
      if (!localStream || !socketRef.current?.connected) {
        setError("Not ready to join room");
        return;
      }

      try {
        setConnectionStatus(CONNECTION_STATUS.CONNECTING);
        setRoomId(targetRoomId);
        setIsCreator(false);
        setError(null);

        setupSocketListeners();
        socketRef.current.emit("join-room", targetRoomId);
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
      const newState = !isAudioEnabled;
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = newState;
      });
      setIsAudioEnabled(newState);
    }
  }, [localStream, isAudioEnabled]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      const newState = !isVideoEnabled;
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = newState;
      });
      setIsVideoEnabled(newState);
    }
  }, [localStream, isVideoEnabled]);

  const endCall = useCallback(() => {
    if (isCleaningUpRef.current) return;
    isCleaningUpRef.current = true;

    console.log("📞 Ending call...");

    if (localStream) {
      localStream.getTracks().forEach((track) => {
        track.stop();
      });
      setLocalStream(null);
    }

    peerConnectionsRef.current.forEach((pc) => {
      pc.close();
    });
    peerConnectionsRef.current.clear();
    pendingCandidatesRef.current.clear();

    if (socketRef.current && roomId) {
      socketRef.current.emit("leave-room", roomId);
      socketRef.current.removeAllListeners();
    }

    setRemoteStreams(new Map());
    setRoomId(null);
    setConnectionStatus(CONNECTION_STATUS.DISCONNECTED);
    setIsAudioEnabled(true);
    setIsVideoEnabled(true);
    setHasPermissions(false);
    setError(null);

    setTimeout(() => {
      isCleaningUpRef.current = false;
    }, 100);
  }, [localStream, roomId]);

  return (
    <VideoCallContext4.Provider
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
    </VideoCallContext4.Provider>
  );
};

export const useVideoCall = () => {
  const context = useContext(VideoCallContext4);
  if (!context) {
    throw new Error("useVideoCall must be used within VideoCallProvider");
  }
  return context;
};

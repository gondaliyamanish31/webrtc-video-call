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

export type ChatMessage = {
  id: string;
  userId: string;
  senderName: string;
  message: string;
  timestamp: string;
  read?: boolean;
};

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
  screenStream: MediaStream | null;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  connectionStatus: ConnectionStatus;
  roomId: string | null;
  isCreator: boolean;
  hasPermissions: boolean;
  error: string | null;
  messages: ChatMessage[];
  unreadCount: number;
  currentUserId: string | null;
  isChatOpen: boolean;
  requestPermissions: () => Promise<void>;
  createRoom: (roomId: string) => Promise<void>;
  joinRoom: (roomId: string) => Promise<void>;
  toggleAudio: () => void;
  toggleVideo: () => void;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => void;
  sendMessage: (message: string) => void;
  setChatOpen: (open: boolean) => void;
  endCall: () => void;
};

const VideoCallContext = createContext<VideoCallContextType | undefined>(
  undefined
);

function getOrCreateFingerprint(): string {
  const key = "webrtc_user_fingerprint";
  let fingerprint = localStorage.getItem(key);

  if (!fingerprint) {
    fingerprint = `fp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(key, fingerprint);
  }

  return fingerprint;
}

type VideoCallProviderProps = {
  children: ReactNode;
};

export const VideoCallProvider = ({ children }: VideoCallProviderProps) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(
    new Map()
  );
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    CONNECTION_STATUS.DISCONNECTED
  );
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isCreator, setIsCreator] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const socketRef = useRef<Socket | null>(null);
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidate[]>>(
    new Map()
  );
  const isCleaningUpRef = useRef(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userFingerprintRef = useRef<string>(getOrCreateFingerprint());

  useEffect(() => {
    const initSocket = async () => {
      const { io } = await import("socket.io-client");

      const socket = io({
        path: "/api/socket",
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      socket.on("connect", () => {
        setCurrentUserId(socket.id ?? "");

        if (roomId && hasPermissions && localStream) {
          if (isCreator) {
            socket.emit("create-room", roomId, userFingerprintRef.current);
          } else {
            socket.emit("join-room", roomId, userFingerprintRef.current);
          }
        }
      });

      socket.on("disconnect", () => {
        setConnectionStatus(CONNECTION_STATUS.CONNECTING);
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

      setLocalStream(stream);
      setHasPermissions(true);
    } catch (err: any) {
      setError("Failed to access camera/microphone.");
      setHasPermissions(false);
      throw err;
    }
  }, []);

  const createPeerConnection = useCallback(
    (remoteUserId: string) => {
      const existingPc = peerConnectionsRef.current.get(remoteUserId);
      if (existingPc && existingPc.connectionState !== "closed") {
        return existingPc;
      }

      if (existingPc) {
        existingPc.close();
      }

      const pc = new RTCPeerConnection(STUN_SERVERS);
      peerConnectionsRef.current.set(remoteUserId, pc);

      const activeStream = screenStream || localStream;
      if (activeStream) {
        activeStream.getTracks().forEach((track) => {
          pc.addTrack(track, activeStream);
        });
      }

      pc.ontrack = (event) => {
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

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed") {
          cleanupPeerConnection(remoteUserId);
        } else if (pc.connectionState === "disconnected") {
          reconnectTimeoutRef.current = setTimeout(() => {
            if (pc.connectionState === "disconnected") {
              cleanupPeerConnection(remoteUserId);
            }
          }, 5000);
        } else if (pc.connectionState === "connected") {
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
        }
      };

      return pc;
    },
    [localStream, screenStream]
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

    socket.on("room-created", ({ isCreator }) => {
      setIsCreator(isCreator || true);
      setConnectionStatus(CONNECTION_STATUS.WAITING);
    });

    socket.on("room-rejoined", ({ existingUsers, isCreator }) => {
      setIsCreator(isCreator || false);

      if (existingUsers && existingUsers.length > 0) {
        setConnectionStatus(CONNECTION_STATUS.CONNECTING);
        existingUsers.forEach((userId: string) => {
          createPeerConnection(userId);
        });
      } else {
        setConnectionStatus(CONNECTION_STATUS.WAITING);
      }
    });

    socket.on("room-joined", ({ existingUsers, isCreator }) => {
      setIsCreator(isCreator || false);

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
      try {
        setConnectionStatus(CONNECTION_STATUS.CONNECTING);
        const pc = createPeerConnection(userId);

        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });

        await pc.setLocalDescription(offer);
        socket.emit("offer", { offer, to: userId });

        const pending = pendingCandidatesRef.current.get(userId);
        if (pending) {
          for (const candidate of pending) {
            await pc.addIceCandidate(candidate).catch(console.error);
          }
          pendingCandidatesRef.current.delete(userId);
        }
      } catch (err) {
        console.error("Error creating offer:", err);
      }
    });

    socket.on("user-rejoined", ({ userId }) => {
      socket.emit("user-joined", { userId });
    });

    socket.on("offer", async ({ offer, from }) => {
      try {
        const pc = createPeerConnection(from);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("answer", { answer, to: from });

        const pending = pendingCandidatesRef.current.get(from);
        if (pending) {
          for (const candidate of pending) {
            await pc.addIceCandidate(candidate).catch(console.error);
          }
          pendingCandidatesRef.current.delete(from);
        }
      } catch (err) {
        console.error("Error handling offer:", err);
      }
    });

    socket.on("answer", async ({ answer, from }) => {
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
        console.error("Error handling answer:", err);
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
        console.error("Error adding ICE candidate:", err);
      }
    });

    socket.on("chat-message", (chatData: ChatMessage) => {
      setMessages((prev) => [...prev, chatData]);

      // Always increment unread if message is not from self and chat is closed
      if (chatData.userId !== socket.id) {
        setUnreadCount((prev) => prev + 1);
      }
    });

    socket.on("force-stop-screen-share", ({ reason }) => {
      if (isScreenSharing) {
        stopScreenShare();
        setError(`Screen sharing stopped: ${reason}`);
        setTimeout(() => setError(null), 3000);
      }
    });

    socket.on("screen-share-started", ({ userId }) => {});

    socket.on("screen-share-stopped", ({ userId }) => {});

    socket.on("user-left", ({ userId }) => {
      cleanupPeerConnection(userId);
    });

    socket.on("error", ({ message }) => {
      setError(message);
      setConnectionStatus(CONNECTION_STATUS.FAILED);
    });
  }, [createPeerConnection, cleanupPeerConnection, isScreenSharing]);

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
        socketRef.current.emit(
          "create-room",
          newRoomId,
          userFingerprintRef.current
        );
      } catch (err: any) {
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
        socketRef.current.emit(
          "join-room",
          targetRoomId,
          userFingerprintRef.current
        );
      } catch (err: any) {
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

  const startScreenShare = useCallback(async () => {
    try {
      const displayMediaOptions: any = {
        video: {
          cursor: "always",
        },
        audio: false,
      };

      const stream =
        await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);

      setScreenStream(stream);
      setIsScreenSharing(true);

      const videoTrack = stream.getVideoTracks()[0];

      peerConnectionsRef.current.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });

      if (socketRef.current && roomId) {
        socketRef.current.emit("screen-share-started", { roomId });
      }

      videoTrack.onended = () => {
        stopScreenShare();
      };
    } catch (err: any) {
      console.error("Screen share error:", err);
      setError("Failed to start screen sharing");
    }
  }, [roomId]);

  const stopScreenShare = useCallback(() => {
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
      setScreenStream(null);
      setIsScreenSharing(false);

      if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        peerConnectionsRef.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender && videoTrack) {
            sender.replaceTrack(videoTrack);
          }
        });
      }

      if (socketRef.current && roomId) {
        socketRef.current.emit("screen-share-stopped", { roomId });
      }
    }
  }, [screenStream, localStream, roomId]);

  const sendMessage = useCallback(
    (message: string) => {
      if (!socketRef.current || !roomId || !message.trim()) return;

      socketRef.current.emit("chat-message", {
        roomId,
        message: message.trim(),
        senderName: "You",
      });
    },
    [roomId]
  );

  const setChatOpen = useCallback((open: boolean) => {
    setIsChatOpen(open);
    if (open) {
      // Mark all as read when opening
      setUnreadCount(0);
    }
  }, []);

  const endCall = useCallback(() => {
    if (isCleaningUpRef.current) return;
    isCleaningUpRef.current = true;

    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
      setScreenStream(null);
    }

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();
    pendingCandidatesRef.current.clear();

    if (socketRef.current && roomId) {
      socketRef.current.emit("leave-room", roomId);
      socketRef.current.removeAllListeners();
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    setRemoteStreams(new Map());
    setRoomId(null);
    setConnectionStatus(CONNECTION_STATUS.DISCONNECTED);
    setIsAudioEnabled(true);
    setIsVideoEnabled(true);
    setIsScreenSharing(false);
    setHasPermissions(false);
    setError(null);
    setMessages([]);
    setUnreadCount(0);
    setIsChatOpen(false);

    setTimeout(() => {
      isCleaningUpRef.current = false;
    }, 100);
  }, [localStream, screenStream, roomId]);

  return (
    <VideoCallContext.Provider
      value={{
        localStream,
        remoteStream: null,
        remoteStreams,
        screenStream,
        isAudioEnabled,
        isVideoEnabled,
        isScreenSharing,
        connectionStatus,
        roomId,
        isCreator,
        hasPermissions,
        error,
        messages,
        unreadCount,
        currentUserId,
        isChatOpen,
        requestPermissions,
        createRoom,
        joinRoom,
        toggleAudio,
        toggleVideo,
        startScreenShare,
        stopScreenShare,
        sendMessage,
        setChatOpen,
        endCall,
      }}
    >
      {children}
    </VideoCallContext.Provider>
  );
};

export const useVideoCall = () => {
  const context = useContext(VideoCallContext);
  if (!context) {
    throw new Error("useVideoCall must be used within VideoCallProvider");
  }
  return context;
};

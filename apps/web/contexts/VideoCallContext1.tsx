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

const VideoCallContext1 = createContext<VideoCallContextType | undefined>(
  undefined
);

export const VideoCallProvider: React.FC<{ children: ReactNode }> = ({
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

  // Initialize socket connection
  useEffect(() => {
    const initSocket = async () => {
      // Dynamically import socket.io-client to avoid SSR issues
      const { io } = await import("socket.io-client");

      const socket = io({
        path: "/api/socket",
        transports: ["websocket", "polling"],
      });

      socket.on("connect", () => {
        console.log("Socket.IO connected:", socket.id);
      });

      socket.on("disconnect", () => {
        console.log("Socket.IO disconnected");
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
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: {
          echoCancellation: true, // Important for audio quality
          noiseSuppression: true, // Reduces background noise
          autoGainControl: true, // Normalizes volume
          sampleRate: 48000, // High quality audio
        },
      });
      setLocalStream(stream);
      setHasPermissions(true);
    } catch (err: any) {
      console.error("Permission error:", err);
      setError("Failed to access camera/microphone. Please grant permissions.");
      setHasPermissions(false);
      throw err;
    }
  }, []);

  const createPeerConnection = useCallback(() => {
    console.log("Creating peer connection...");
    const pc = new RTCPeerConnection(STUN_SERVERS);
    peerConnectionRef.current = pc;

    // Add local stream tracks to peer connection
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
        console.log("Added local track:", track.kind);
      });
    }

    // Handle incoming remote stream
    pc.ontrack = (event) => {
      console.log("Received remote track:", event.track.kind);
      setRemoteStream(event.streams[0]);
      setConnectionStatus(CONNECTION_STATUS.CONNECTED);
    };

    // Send ICE candidates via Socket.IO
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current && remoteUserIdRef.current) {
        console.log("Sending ICE candidate");
        socketRef.current.emit("ice-candidate", {
          candidate: event.candidate,
          to: remoteUserIdRef.current,
          roomId: roomId,
        });
      }
    };

    // Monitor connection state
    pc.onconnectionstatechange = () => {
      console.log("Connection state:", pc.connectionState);

      switch (pc.connectionState) {
        case "connected":
          setConnectionStatus(CONNECTION_STATUS.CONNECTED);
          break;
        case "failed":
          setError("Connection failed. Please try again.");
          setConnectionStatus(CONNECTION_STATUS.FAILED);
          break;
        case "disconnected":
          setConnectionStatus(CONNECTION_STATUS.DISCONNECTED);
          break;
      }

      // if (pc.connectionState === "connected") {
      //   setConnectionStatus(CONNECTION_STATUS.CONNECTED);
      // } else if (pc.connectionState === "failed") {
      //   setError("Connection failed. Please try again.");
      //   setConnectionStatus(CONNECTION_STATUS.FAILED);
      // } else if (pc.connectionState === "disconnected") {
      //   setConnectionStatus(CONNECTION_STATUS.DISCONNECTED);
      // }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", pc.iceConnectionState);
    };

    return pc;
  }, [localStream, roomId]);

  const setupSocketListeners = useCallback(() => {
    if (!socketRef.current) return;

    const socket = socketRef.current;

    // Room created successfully
    socket.on("room-created", ({ roomId: createdRoomId }) => {
      console.log("Room created:", createdRoomId);
      setConnectionStatus(CONNECTION_STATUS.WAITING);
    });

    // User joined the room
    socket.on("user-joined", async ({ userId }) => {
      console.log("User joined:", userId);
      remoteUserIdRef.current = userId;

      try {
        // Create peer connection and offer
        const pc = createPeerConnection();
        const offer = await pc.createOffer({
          offerToReceiveAudio: true, // Critical for audio reception
          offerToReceiveVideo: true, // Critical for video reception
        });
        await pc.setLocalDescription(offer);

        console.log("Sending offer to:", userId);
        socket.emit("offer", {
          offer,
          to: userId,
          roomId,
        });
      } catch (err) {
        console.error("Error creating offer:", err);
        setError("Failed to initiate call");
      }
    });

    // Received offer from remote peer
    socket.on("offer", async ({ offer, from }) => {
      console.log("Received offer from:", from);
      remoteUserIdRef.current = from;

      try {
        const pc = createPeerConnection();
        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        console.log("Sending answer to:", from);
        socket.emit("answer", {
          answer,
          to: from,
          roomId,
        });
      } catch (err) {
        console.error("Error handling offer:", err);
        setError("Failed to connect");
      }
    });

    // Received answer from remote peer
    socket.on("answer", async ({ answer, from }) => {
      console.log("Received answer from:", from);

      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(answer)
          );
        }
      } catch (err) {
        console.error("Error handling answer:", err);
        setError("Failed to establish connection");
      }
    });

    // Received ICE candidate

    // socket.on("ice-candidate", async ({ candidate, from }) => {
    //   // console.log("Received ICE candidate from:", from);

    //   // try {
    //   //   if (peerConnectionRef.current) {
    //   //     await peerConnectionRef.current.addIceCandidate(
    //   //       new RTCIceCandidate(candidate)
    //   //     );
    //   //   }
    //   // } catch (err) {
    //   //   console.error("Error adding ICE candidate:", err);
    //   // }

    //   // Queue candidates if remote description not set
    //   if (peerConnectionRef.current?.remoteDescription) {
    //     await peerConnectionRef.current.addIceCandidate(candidate);
    //   } else {
    //     iceCandidatesQueue.current.push(candidate);
    //   }

    //   // Process queue after remote description is set
    //   for (const candidate of iceCandidatesQueue.current) {
    //     await pc.addIceCandidate(candidate);
    //   }
    //   iceCandidatesQueue.current = []; // Queue candidates if remote description not set
    //   if (peerConnectionRef.current?.remoteDescription) {
    //     await peerConnectionRef.current.addIceCandidate(candidate);
    //   } else {
    //     iceCandidatesQueue.current.push(candidate);
    //   }

    //   // Process queue after remote description is set
    //   for (const candidate of iceCandidatesQueue.current) {
    //     await pc.addIceCandidate(candidate);
    //   }
    //   iceCandidatesQueue.current = [];
    // });

    // Existing users in room
    socket.on("existing-users", ({ users }) => {
      console.log("Existing users:", users);
      if (users.length > 0) {
        remoteUserIdRef.current = users[0];
      }
    });

    // User left the room
    socket.on("user-left", ({ userId }) => {
      console.log("User left:", userId);
      setRemoteStream(null);
      setConnectionStatus(CONNECTION_STATUS.WAITING);

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      remoteUserIdRef.current = null;
    });

    // Error from server
    socket.on("error", ({ message }) => {
      console.error("Server error:", message);
      setError(message);
      setConnectionStatus(CONNECTION_STATUS.FAILED);
    });
  }, [createPeerConnection, roomId]);

  const createRoom = useCallback(
    async (newRoomId: string) => {
      if (!localStream) {
        setError("Please grant camera and microphone permissions first.");
        return;
      }

      if (!socketRef.current) {
        setError("Socket connection not ready. Please try again.");
        return;
      }

      try {
        setConnectionStatus(CONNECTION_STATUS.CONNECTING);
        setRoomId(newRoomId);
        setIsCreator(true);
        setError(null);

        console.log("Creating room:", newRoomId);

        // Remove old listeners
        socketRef.current.removeAllListeners();

        // Setup new listeners
        setupSocketListeners();

        // Create room
        socketRef.current.emit("create-room", newRoomId);
      } catch (err: any) {
        console.error("Error creating room:", err);
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

      if (!socketRef.current) {
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

        console.log("Joining room:", targetRoomId);

        // Remove old listeners
        socketRef.current.removeAllListeners();

        // Setup new listeners
        setupSocketListeners();

        // Join room
        socketRef.current.emit("join-room", targetRoomId);
      } catch (err: any) {
        console.error("Error joining room:", err);
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
      });
      setIsAudioEnabled(!isAudioEnabled);
    }
  }, [localStream, isAudioEnabled]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  }, [localStream, isVideoEnabled]);

  const endCall = useCallback(() => {
    console.log("Ending call...");

    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Leave room via socket
    if (socketRef.current && roomId) {
      socketRef.current.emit("leave-room", roomId);
      socketRef.current.removeAllListeners();
    }

    // Reset state
    setRemoteStream(null);
    setRoomId(null);
    setConnectionStatus(CONNECTION_STATUS.DISCONNECTED);
    setIsAudioEnabled(true);
    setIsVideoEnabled(true);
    setHasPermissions(false);
    setError(null);
    remoteUserIdRef.current = null;
  }, [localStream, roomId]);

  return (
    <VideoCallContext1.Provider
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
    </VideoCallContext1.Provider>
  );
};

export const useVideoCall = () => {
  const context = useContext(VideoCallContext1);
  if (!context) {
    throw new Error("useVideoCall must be used within VideoCallProvider");
  }
  return context;
};

import { Server } from "socket.io";

type RoomData = {
  users: Set<string>;
  createdAt: Date;
  creatorId: string;
  creatorFingerprint?: string;
  screenSharingUserId: string | null; // Track who is screen sharing
};

const rooms = new Map<string, RoomData>();
const userRoomMap = new Map<string, string>();
const userFingerprintMap = new Map<string, string>(); // Map socket to fingerprint

const MAX_USERS = 10;

function getRoomStats(roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return null;

  return {
    roomId,
    userCount: room.users.size,
    users: Array.from(room.users),
    createdAt: room.createdAt,
    creatorId: room.creatorId,
    screenSharingUserId: room.screenSharingUserId,
  };
}

export default function handler(req: any, res: any) {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server, {
      path: "/api/socket",
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    io.on("connection", (socket) => {
      // CREATE OR REJOIN ROOM
      socket.on("create-room", (roomId: string, fingerprint?: string) => {
        `Create room: "${roomId}" from ${socket.id}`;

        if (!roomId || typeof roomId !== "string") {
          socket.emit("error", { message: "Invalid room ID" });
          return;
        }

        const exactRoomId = roomId.trim();

        if (exactRoomId.length < 4) {
          socket.emit("error", {
            message: "Room ID must be at least 4 characters",
          });
          return;
        }

        // Store fingerprint
        if (fingerprint) {
          userFingerprintMap.set(socket.id, fingerprint);
        }

        // Check if room exists
        if (rooms.has(exactRoomId)) {
          const room = rooms.get(exactRoomId)!;

          // Allow creator to rejoin with matching fingerprint
          if (fingerprint && room.creatorFingerprint === fingerprint) {
            `Creator rejoining: "${exactRoomId}"`;

            // Remove old socket ID if different
            if (
              room.creatorId !== socket.id &&
              room.users.has(room.creatorId)
            ) {
              room.users.delete(room.creatorId);
            }

            room.creatorId = socket.id;
            room.users.add(socket.id);
            socket.join(exactRoomId);
            userRoomMap.set(socket.id, exactRoomId);

            const existingUsers = Array.from(room.users).filter(
              (id) => id !== socket.id
            );

            socket.emit("room-rejoined", {
              roomId: exactRoomId,
              userId: socket.id,
              existingUsers,
              roomStats: getRoomStats(exactRoomId),
              isCreator: true,
            });

            socket.to(exactRoomId).emit("user-rejoined", {
              userId: socket.id,
              isCreator: true,
            });

            return;
          }

          // Room exists but not the creator
          socket.emit("error", {
            message: "Room already exists. Please join instead.",
          });
          return;
        }

        // Create new room
        socket.join(exactRoomId);
        const roomData: RoomData = {
          users: new Set([socket.id]),
          createdAt: new Date(),
          creatorId: socket.id,
          creatorFingerprint: fingerprint,
          screenSharingUserId: null,
        };
        rooms.set(exactRoomId, roomData);
        userRoomMap.set(socket.id, exactRoomId);

        socket.emit("room-created", {
          roomId: exactRoomId,
          userId: socket.id,
          isCreator: true,
        });

        `Room created: "${exactRoomId}"`;
      });

      // JOIN ROOM
      socket.on("join-room", (roomId: string, fingerprint?: string) => {
        `Join room: "${roomId}" from ${socket.id}`;

        if (!roomId || typeof roomId !== "string") {
          socket.emit("error", { message: "Invalid room ID" });
          return;
        }

        const exactRoomId = roomId.trim();

        // Store fingerprint
        if (fingerprint) {
          userFingerprintMap.set(socket.id, fingerprint);
        }

        if (!rooms.has(exactRoomId)) {
          socket.emit("error", {
            message: `Room "${exactRoomId}" not found.`,
          });
          return;
        }

        const room = rooms.get(exactRoomId)!;

        // Check if user is rejoining
        const userFingerprint = userFingerprintMap.get(socket.id);
        const wasInRoom =
          userFingerprint &&
          Array.from(room.users).some(
            (uid) => userFingerprintMap.get(uid) === userFingerprint
          );

        if (wasInRoom) {
          `User rejoining: ${socket.id}`;
        }

        if (room.users.size >= MAX_USERS) {
          socket.emit("error", {
            message: `Room is full. Maximum ${MAX_USERS} participants.`,
          });
          return;
        }

        socket.join(exactRoomId);
        room.users.add(socket.id);
        userRoomMap.set(socket.id, exactRoomId);

        const existingUsers = Array.from(room.users).filter(
          (id) => id !== socket.id
        );

        socket.emit("room-joined", {
          roomId: exactRoomId,
          userId: socket.id,
          existingUsers,
          roomStats: getRoomStats(exactRoomId),
          isCreator: room.creatorId === socket.id,
        });

        socket.to(exactRoomId).emit("user-joined", {
          userId: socket.id,
          roomStats: getRoomStats(exactRoomId),
        });
      });

      // WEBRTC SIGNALING
      socket.on("offer", ({ offer, to }) => {
        if (!offer || !to) return;
        socket.to(to).emit("offer", { offer, from: socket.id });
      });

      socket.on("answer", ({ answer, to }) => {
        if (!answer || !to) return;
        socket.to(to).emit("answer", { answer, from: socket.id });
      });

      socket.on("ice-candidate", ({ candidate, to }) => {
        if (!candidate || !to) return;
        socket.to(to).emit("ice-candidate", { candidate, from: socket.id });
      });

      // CHAT MESSAGE - with sender info
      socket.on("chat-message", ({ roomId, message, senderName }) => {
        const room = rooms.get(roomId);
        if (room && room.users.has(socket.id)) {
          const chatData = {
            id: `${Date.now()}_${socket.id}`,
            userId: socket.id,
            senderName: senderName || `User ${socket.id.slice(0, 6)}`,
            message,
            timestamp: new Date().toISOString(),
          };

          // Broadcast to everyone in room
          io.to(roomId).emit("chat-message", chatData);
        }
      });

      // SCREEN SHARE - Single user at a time
      socket.on("screen-share-started", ({ roomId }) => {
        const room = rooms.get(roomId);
        if (room && room.users.has(socket.id)) {
          // If someone else is sharing, stop them first
          if (
            room.screenSharingUserId &&
            room.screenSharingUserId !== socket.id
          ) {
            socket
              .to(room.screenSharingUserId)
              .emit("force-stop-screen-share", {
                reason: "Another user started sharing",
              });

            // Notify room that previous user stopped
            socket.to(roomId).emit("screen-share-stopped", {
              userId: room.screenSharingUserId,
            });
          }

          // Set new screen sharing user
          room.screenSharingUserId = socket.id;

          // Notify everyone
          socket.to(roomId).emit("screen-share-started", {
            userId: socket.id,
          });

          `Screen share started by ${socket.id} in ${roomId}`;
        }
      });

      socket.on("screen-share-stopped", ({ roomId }) => {
        const room = rooms.get(roomId);
        if (room && room.screenSharingUserId === socket.id) {
          room.screenSharingUserId = null;
          socket.to(roomId).emit("screen-share-stopped", {
            userId: socket.id,
          });
          `Screen share stopped by ${socket.id}`;
        }
      });

      // LEAVE ROOM
      socket.on("leave-room", (roomId: string) => {
        if (!roomId) return;
        handleUserLeaving(socket, roomId.trim());
      });

      // DISCONNECT
      socket.on("disconnect", () => {
        `User disconnected: ${socket.id}`;
        const roomId = userRoomMap.get(socket.id);
        if (roomId) {
          handleUserLeaving(socket, roomId);
        }
        userFingerprintMap.delete(socket.id);
      });

      function handleUserLeaving(socket: any, roomId: string) {
        const room = rooms.get(roomId);

        if (room) {
          // If user was screen sharing, clear it
          if (room.screenSharingUserId === socket.id) {
            room.screenSharingUserId = null;
            socket.to(roomId).emit("screen-share-stopped", {
              userId: socket.id,
            });
          }

          room.users.delete(socket.id);
          userRoomMap.delete(socket.id);
          socket.leave(roomId);

          socket.to(roomId).emit("user-left", { userId: socket.id });

          `User ${socket.id} left room "${roomId}"`;

          if (room.users.size === 0) {
            rooms.delete(roomId);
            `Room "${roomId}" deleted (empty)`;
          }
        }
      }
    });

    res.socket.server.io = io;
  }

  res.end();
}

export const config = {
  api: {
    bodyParser: false,
  },
};

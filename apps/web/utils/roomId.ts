import { v4 as uuidv4 } from "uuid";

export const generateRoomId = (): string => {
  return uuidv4().slice(0, 8);
};

export const validateRoomId = (roomId: string): boolean => {
  return roomId.length >= 4 && /^[a-zA-Z0-9-]+$/.test(roomId);
};

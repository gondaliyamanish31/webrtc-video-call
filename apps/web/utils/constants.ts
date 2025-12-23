export const STUN_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export const PEER_CONFIG = {
  host: "peerjs.com",
  port: 443,
  secure: true,
  config: STUN_SERVERS,
};

export const CONNECTION_STATUS = {
  NEW: "new",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
  FAILED: "failed",
  WAITING: "waiting",
} as const;

export type ConnectionStatus =
  (typeof CONNECTION_STATUS)[keyof typeof CONNECTION_STATUS];

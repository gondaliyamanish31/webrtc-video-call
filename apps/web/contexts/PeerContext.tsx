// "use client";

// import React, {
//   createContext,
//   useContext,
//   useState,
//   useCallback,
//   ReactNode,
// } from "react";
// import Peer from "peerjs";
// import { usePeerService } from "../services/peerService";

// interface PeerContextType {
//   peer: Peer | null;
//   peerId: string | null;
//   initializePeer: (id?: string) => Promise<void>;
//   disconnectPeer: () => void;
//   isInitializing: boolean;
//   error: string | null;
// }

// const PeerContext = createContext<PeerContextType | undefined>(undefined);

// export const PeerProvider: React.FC<{ children: ReactNode }> = ({
//   children,
// }) => {
//   const { initializePeerService, disconnectPeerService } = usePeerService();
//   const [peer, setPeer] = useState<Peer | null>(null);
//   const [peerId, setPeerId] = useState<string | null>(null);
//   const [isInitializing, setIsInitializing] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const initializePeer = useCallback(
//     async (id?: string) => {
//       setIsInitializing(true);
//       setError(null);
//       try {
//         const newPeer = await initializePeerService(id);
//         setPeer(newPeer);
//         setPeerId(newPeer.id);
//       } catch (err) {
//         setError("Failed to initialize peer connection");
//         console.error(err);
//       } finally {
//         setIsInitializing(false);
//       }
//     },
//     [initializePeerService]
//   );

//   const disconnectPeer = useCallback(() => {
//     disconnectPeerService();
//     setPeer(null);
//     setPeerId(null);
//   }, [disconnectPeerService]);

//   return (
//     <PeerContext.Provider
//       value={{
//         peer,
//         peerId,
//         initializePeer,
//         disconnectPeer,
//         isInitializing,
//         error,
//       }}
//     >
//       {children}
//     </PeerContext.Provider>
//   );
// };

// export const usePeer = () => {
//   const context = useContext(PeerContext);
//   if (!context) {
//     throw new Error("usePeer must be used within PeerProvider");
//   }
//   return context;
// };

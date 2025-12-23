// import { useState, useEffect, useCallback } from "react";
// import Peer, { MediaConnection } from "peerjs";
// import { PEER_CONFIG } from "../utils/constants";

// export const usePeerService = () => {
//   const [peer, setPeer] = useState<Peer | null>(null);
//   const [currentCall, setCurrentCall] = useState<MediaConnection | null>(null);

//   // Initialize peer
//   const initializePeerService = useCallback((peerId?: string) => {
//     return new Promise<Peer>((resolve, reject) => {
//       const newPeer = new Peer(peerId, PEER_CONFIG);

//       newPeer.on("open", () => {
//         setPeer(newPeer);
//         resolve(newPeer);
//       });

//       newPeer.on("error", (error) => {
//         console.error("Peer error:", error);
//         reject(error);
//       });
//     });
//   }, []);

//   // Make a call to a remote peer
//   const makeCall = useCallback(
//     (remotePeerId: string, localStream: MediaStream) => {
//       if (!peer) {
//         throw new Error("Peer not initialized");
//       }
//       const call = peer.call(remotePeerId, localStream);
//       setCurrentCall(call);
//       return call;
//     },
//     [peer]
//   );

//   // Answer an incoming call
//   const answerCall = useCallback(
//     (call: MediaConnection, localStream: MediaStream) => {
//       setCurrentCall(call);
//       call.answer(localStream);
//     },
//     []
//   );

//   // Handle incoming calls
//   const onIncomingCall = useCallback(
//     (callback: (call: MediaConnection) => void) => {
//       if (peer) {
//         peer.on("call", callback);
//       }
//     },
//     [peer]
//   );

//   // Disconnect from the current call
//   const disconnectPeerService = useCallback(() => {
//     if (currentCall) {
//       currentCall.close();
//       setCurrentCall(null);
//     }
//     if (peer) {
//       peer.destroy();
//       setPeer(null);
//     }
//   }, [currentCall, peer]);

//   // Get the peer ID
//   const getPeerId = useCallback(() => {
//     return peer?.id || null;
//   }, [peer]);

//   // Clean up on component unmount
//   useEffect(() => {
//     return () => {
//       if (peer) {
//         peer.destroy();
//       }
//     };
//   }, [peer]);

//   return {
//     peer,
//     currentCall,
//     initializePeerService,
//     makeCall,
//     answerCall,
//     onIncomingCall,
//     disconnectPeerService,
//     getPeerId,
//   };
// };

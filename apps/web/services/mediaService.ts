// import { useCallback, useRef } from "react";

// export function useMediaService() {
//   const localStreamRef = useRef<MediaStream | null>(null);

//   const getMediaStream = useCallback(
//     async (
//       constraints: MediaStreamConstraints = {
//         video: true,
//         audio: true,
//       }
//     ): Promise<MediaStream> => {
//       try {
//         const stream = await navigator.mediaDevices.getUserMedia(constraints);
//         localStreamRef.current = stream;
//         return stream;
//       } catch (error) {
//         console.error("Error accessing media devices:", error);
//         throw new Error(
//           "Failed to access camera/microphone. Please check permissions."
//         );
//       }
//     },
//     []
//   );

//   const toggleAudioService = useCallback((enabled: boolean) => {
//     localStreamRef.current?.getAudioTracks().forEach((track) => {
//       track.enabled = enabled;
//     });
//   }, []);

//   const toggleVideoService = useCallback((enabled: boolean) => {
//     localStreamRef.current?.getVideoTracks().forEach((track) => {
//       track.enabled = enabled;
//     });
//   }, []);

//   const stopStream = useCallback(() => {
//     localStreamRef.current?.getTracks().forEach((track) => track.stop());
//     localStreamRef.current = null;
//   }, []);

//   const getLocalStream = useCallback(() => {
//     return localStreamRef.current;
//   }, []);

//   return {
//     getMediaStream,
//     toggleAudioService,
//     toggleVideoService,
//     stopStream,
//     getLocalStream,
//   };
// }

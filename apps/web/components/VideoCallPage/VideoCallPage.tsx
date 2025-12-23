import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Grid,
  Box,
  CircularProgress,
  Alert,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Paper,
  Chip,
  Avatar,
  Stack,
  IconButton,
  Badge,
  Snackbar,
  Tooltip,
} from "@mui/material";
import {
  People,
  Videocam,
  PersonAdd,
  Chat as ChatIcon,
  Close,
} from "@mui/icons-material";
import { LocalVideo } from "../Video/LocalVideo";
import { VideoControls } from "../Video/VideoControls";
import { RemoteVideo } from "../Video/RemoteVideo";
import { ChatPanel } from "../Chat/ChatPanel";
import { useVideoCall } from "@/contexts/VideoCallContext";
import styled from "styled-components";
import { CopyButton } from "../common/CopyButton";

type VideoCallPageProps = {
  roomId: string;
  isCreating: boolean;
};

const RoomIdBox = styled(Box)`
  display: flex;
  align-items: center;
  gap: 12px;
`;

function calculateGridLayout(participantCount: number) {
  if (participantCount === 1) return { xs: 12, md: 12 };
  if (participantCount === 2) return { xs: 12, md: 6 };
  if (participantCount <= 4) return { xs: 12, sm: 6, md: 6 };
  if (participantCount <= 6) return { xs: 12, sm: 6, md: 4 };
  if (participantCount <= 9) return { xs: 12, sm: 6, md: 4 };
  return { xs: 12, sm: 6, md: 3 };
}

export function VideoCallPage({ roomId, isCreating }: VideoCallPageProps) {
  const router = useRouter();

  const headerRef = React.useRef<HTMLDivElement>(null);
  const controlsRef = React.useRef<HTMLDivElement>(null);

  const [layoutOffset, setLayoutOffset] = React.useState(0);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showParticipants, setShowParticipants] = useState(true);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  const {
    localStream,
    remoteStreams,
    screenStream,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    connectionStatus,
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
  } = useVideoCall();

  const totalParticipants = useMemo(
    () => remoteStreams.size + 1,
    [remoteStreams.size]
  );

  const gridLayout = useMemo(
    () => calculateGridLayout(totalParticipants),
    [totalParticipants]
  );

  const remoteStreamArray = useMemo(
    () => Array.from(remoteStreams.entries()),
    [remoteStreams]
  );

  useEffect(() => {
    const initialize = async () => {
      try {
        if (!hasPermissions) {
          setIsInitializing(false);
          return;
        }

        if (!localStream) {
          setIsInitializing(false);
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 500));

        if (isCreating) {
          await createRoom(roomId);
        } else {
          await joinRoom(roomId);
        }

        setIsInitializing(false);
      } catch (err: any) {
        console.error("Initialization error:", err);
        setIsInitializing(false);
      }
    };

    initialize();
  }, [roomId, isCreating, hasPermissions, localStream, createRoom, joinRoom]);

  useEffect(() => {
    const updateHeight = () => {
      const headerH = headerRef.current?.offsetHeight ?? 0;
      const controlsH = controlsRef.current?.offsetHeight ?? 0;
      setLayoutOffset(headerH + controlsH);
    };

    if (totalParticipants > 1) updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, [totalParticipants]);

  useEffect(() => {
    if (remoteStreams.size > 0) {
      setNotificationMessage("Participant joined the call");
      setShowNotification(true);
    }
  }, [remoteStreams.size]);

  const handleEndCall = useCallback(() => {
    endCall();
    router.push("/");
  }, [endCall, router]);

  const handleRequestPermissions = useCallback(async () => {
    try {
      await requestPermissions();
    } catch (err) {
      console.error("Permission error:", err);
    }
  }, [requestPermissions]);

  const toggleParticipantPanel = useCallback(() => {
    setShowParticipants((prev) => !prev);
  }, []);

  const toggleChatPanel = useCallback(() => {
    setChatOpen(!isChatOpen);
  }, [isChatOpen, setChatOpen]);

  const handleToggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      await startScreenShare();
    }
  }, [isScreenSharing, startScreenShare, stopScreenShare]);

  if (!hasPermissions) {
    return (
      <Dialog open={true} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: "center", pt: 4 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              backgroundColor: "primary.light",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2,
            }}
          >
            <Videocam sx={{ fontSize: 32, color: "primary.main" }} />
          </Box>
          <Typography component="div" variant="h5" fontWeight="bold">
            Camera & Microphone Access
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom textAlign="center">
            This application needs access to your camera and microphone to
            enable video calling.
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            Your browser will ask for permission. Please click "Allow" to
            continue.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
          <Button
            onClick={handleRequestPermissions}
            variant="contained"
            size="large"
            startIcon={<Videocam />}
          >
            Grant Permissions
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  if (isInitializing) {
    return (
      <Container maxWidth="lg" sx={{ minHeight: "100vh" }}>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="100vh"
          gap={2}
        >
          <CircularProgress size={60} />
          <Typography variant="h6">
            {isCreating ? "Creating room..." : "Joining room..."}
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#f5f7fa",
      }}
    >
      {/* Header */}
      <Paper
        ref={headerRef}
        elevation={0}
        sx={{
          borderBottom: "1px solid",
          borderColor: "divider",
          px: 3,
          py: 2,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <RoomIdBox>
              <Typography variant="body2" color="text.secondary">
                Room ID:
              </Typography>

              <Typography variant="h6" fontFamily="monospace">
                {roomId}
              </Typography>

              <CopyButton text={roomId} label="Copy Room ID" />
            </RoomIdBox>
            <Chip
              label={`${totalParticipants} ${
                totalParticipants === 1 ? "Participant" : "Participants"
              }`}
              color="primary"
              size="small"
            />
            <Chip
              label={connectionStatus.toUpperCase()}
              color={
                connectionStatus === "connected"
                  ? "success"
                  : connectionStatus === "connecting"
                    ? "warning"
                    : "default"
              }
              size="small"
            />
            {isScreenSharing && (
              <Chip
                label="SHARING SCREEN"
                color="primary"
                size="small"
                variant="outlined"
              />
            )}
          </Stack>

          <Stack direction="row" spacing={1}>
            <Tooltip title="Chat">
              <IconButton onClick={toggleChatPanel} size="small">
                <Badge
                  badgeContent={isChatOpen ? 0 : unreadCount}
                  color="error"
                  max={99}
                >
                  <ChatIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            <Tooltip title="Participants">
              <IconButton onClick={toggleParticipantPanel} size="small">
                <Badge badgeContent={totalParticipants} color="primary">
                  <People />
                </Badge>
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mx: 3, mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Main Content */}
      <Box
        sx={{
          height: `calc(100vh - ${layoutOffset}px)`,
          display: "flex",
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        {/* Video Grid */}
        <Box
          sx={{
            flex: 1,
            p: 2,
            overflowY: "auto",
            overflowX: "hidden",

            // Custom scrollbar
            "&::-webkit-scrollbar": {
              width: "8px",
            },
            "&::-webkit-scrollbar-track": {
              bgcolor: "#f1f1f1",
            },
            "&::-webkit-scrollbar-thumb": {
              bgcolor: "#c1c1c1",
              borderRadius: "4px",
              "&:hover": {
                bgcolor: "#a8a8a8",
              },
            },
          }}
        >
          <Grid container spacing={2}>
            <Grid
              size={{
                xs: gridLayout.xs,
                sm: gridLayout.sm,
                md: gridLayout.md,
              }}
            >
              <LocalVideo
                stream={isScreenSharing ? screenStream : localStream}
                isAudioEnabled={isAudioEnabled}
                isVideoEnabled={isVideoEnabled}
              />
            </Grid>

            {remoteStreamArray.map(([userId, stream]) => (
              <Grid
                size={{
                  xs: gridLayout.xs,
                  sm: gridLayout.sm,
                  md: gridLayout.md,
                }}
                key={userId}
              >
                <RemoteVideo stream={stream} userId={userId} />
              </Grid>
            ))}

            {remoteStreams.size === 0 && (
              <Grid size={{ xs: 12 }}>
                <Paper
                  sx={{
                    p: 6,
                    textAlign: "center",
                    bgcolor: "background.paper",
                    borderRadius: 2,
                  }}
                >
                  <PersonAdd
                    sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
                  />
                  <Typography variant="h6" gutterBottom>
                    Waiting for participants to join
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Share your Room ID with others to start the call
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Box>

        {/* Participants Panel */}
        {showParticipants && (
          <Paper
            elevation={0}
            sx={{
              width: 280,
              borderLeft: "1px solid",
              borderColor: "divider",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box
              sx={{
                p: 2,
                borderBottom: "1px solid",
                borderColor: "divider",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="subtitle1" fontWeight="600">
                Participants ({totalParticipants})
              </Typography>
              <IconButton size="small" onClick={toggleParticipantPanel}>
                <Close fontSize="small" />
              </IconButton>
            </Box>

            <Box
              sx={{
                flex: 1,
                overflowY: "auto",
                overflowX: "hidden",
                p: 2,

                "&::-webkit-scrollbar": {
                  width: "6px",
                },
                "&::-webkit-scrollbar-track": {
                  bgcolor: "#f1f1f1",
                },
                "&::-webkit-scrollbar-thumb": {
                  bgcolor: "#c1c1c1",
                  borderRadius: "3px",
                },
              }}
            >
              <Stack spacing={1}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    bgcolor: "primary.50",
                  }}
                >
                  <Avatar
                    sx={{ bgcolor: "primary.main", width: 32, height: 32 }}
                  >
                    <Typography variant="caption">Y</Typography>
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight="500" noWrap>
                      You (Host)
                    </Typography>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          bgcolor: isVideoEnabled
                            ? "success.main"
                            : "error.main",
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {isVideoEnabled ? "Video On" : "Video Off"}
                      </Typography>
                    </Stack>
                  </Box>
                </Paper>

                {remoteStreamArray.map(([userId], index) => (
                  <Paper
                    key={userId}
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                    }}
                  >
                    <Avatar
                      sx={{ bgcolor: "secondary.main", width: 32, height: 32 }}
                    >
                      <Typography variant="caption">{index + 1}</Typography>
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight="500" noWrap>
                        User {userId.slice(0, 6)}
                      </Typography>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            bgcolor: "success.main",
                          }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          Connected
                        </Typography>
                      </Stack>
                    </Box>
                  </Paper>
                ))}
              </Stack>
            </Box>
          </Paper>
        )}

        {/* Chat Panel */}
        {isChatOpen && (
          <ChatPanel
            messages={messages}
            onSendMessage={sendMessage}
            currentUserId={currentUserId}
          />
        )}
      </Box>

      {/* Controls */}
      <Box
        ref={controlsRef}
        sx={{
          display: "flex",
          justifyContent: "center",
          py: 1,
          borderTop: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <VideoControls
          isAudioEnabled={isAudioEnabled}
          isVideoEnabled={isVideoEnabled}
          isScreenSharing={isScreenSharing}
          onToggleAudio={toggleAudio}
          onToggleVideo={toggleVideo}
          onToggleScreenShare={handleToggleScreenShare}
          onToggleChat={toggleChatPanel}
          onEndCall={handleEndCall}
        />
      </Box>

      {/* Notification */}
      <Snackbar
        open={showNotification}
        autoHideDuration={3000}
        onClose={() => setShowNotification(false)}
        message={notificationMessage}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      />
    </Box>
  );
}

import React, { memo } from "react";
import { Box, IconButton, Tooltip, Paper, Stack } from "@mui/material";
import {
  Mic,
  MicOff,
  Videocam,
  VideocamOff,
  CallEnd,
  ScreenShare,
  StopScreenShare,
  Chat,
} from "@mui/icons-material";

type VideoControlsProps = {
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleChat?: () => void;
  onEndCall: () => void;
};

const VideoControlsComponent = ({
  isAudioEnabled,
  isVideoEnabled,
  isScreenSharing,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleChat,
  onEndCall,
}: VideoControlsProps) => {
  return (
    <Paper
      elevation={4}
      sx={{
        display: "inline-flex",
        borderRadius: 6,
        px: 1,
        py: 1,
        bgcolor: "background.paper",
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <Tooltip
          title={isAudioEnabled ? "Mute microphone" : "Unmute microphone"}
          arrow
        >
          <Box>
            <IconButton
              onClick={onToggleAudio}
              sx={{
                width: 40,
                height: 40,
                bgcolor: isAudioEnabled ? "action.hover" : "error.main",
                color: isAudioEnabled ? "text.primary" : "white",
                "&:hover": {
                  bgcolor: isAudioEnabled ? "action.selected" : "error.dark",
                },
                transition: "all 0.2s",
              }}
            >
              {isAudioEnabled ? <Mic /> : <MicOff />}
            </IconButton>
          </Box>
        </Tooltip>

        <Tooltip
          title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
          arrow
        >
          <Box>
            <IconButton
              onClick={onToggleVideo}
              sx={{
                width: 40,
                height: 40,
                bgcolor: isVideoEnabled ? "action.hover" : "error.main",
                color: isVideoEnabled ? "text.primary" : "white",
                "&:hover": {
                  bgcolor: isVideoEnabled ? "action.selected" : "error.dark",
                },
                transition: "all 0.2s",
              }}
            >
              {isVideoEnabled ? <Videocam /> : <VideocamOff />}
            </IconButton>
          </Box>
        </Tooltip>

        <Tooltip
          title={isScreenSharing ? "Stop sharing screen" : "Share screen"}
          arrow
        >
          <Box>
            <IconButton
              onClick={onToggleScreenShare}
              sx={{
                width: 40,
                height: 40,
                bgcolor: isScreenSharing ? "primary.main" : "action.hover",
                color: isScreenSharing ? "white" : "text.primary",
                "&:hover": {
                  bgcolor: isScreenSharing ? "primary.dark" : "action.selected",
                },
                transition: "all 0.2s",
              }}
            >
              {isScreenSharing ? <StopScreenShare /> : <ScreenShare />}
            </IconButton>
          </Box>
        </Tooltip>

        {onToggleChat && (
          <Tooltip title="Toggle chat" arrow>
            <Box>
              <IconButton
                onClick={onToggleChat}
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: "action.hover",
                  color: "text.primary",
                  "&:hover": {
                    bgcolor: "action.selected",
                  },
                  transition: "all 0.2s",
                }}
              >
                <Chat />
              </IconButton>
            </Box>
          </Tooltip>
        )}

        <Box
          sx={{
            width: 1,
            height: 40,
            bgcolor: "divider",
            mx: 0.5,
          }}
        />

        <Tooltip title="End call" arrow>
          <Box>
            <IconButton
              onClick={onEndCall}
              sx={{
                width: 40,
                height: 40,
                bgcolor: "error.main",
                color: "white",
                "&:hover": {
                  bgcolor: "error.dark",
                  transform: "scale(1.05)",
                },
                transition: "all 0.2s",
              }}
            >
              <CallEnd />
            </IconButton>
          </Box>
        </Tooltip>
      </Stack>
    </Paper>
  );
};

export const VideoControls = memo(
  VideoControlsComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.isAudioEnabled === nextProps.isAudioEnabled &&
      prevProps.isVideoEnabled === nextProps.isVideoEnabled &&
      prevProps.isScreenSharing === nextProps.isScreenSharing &&
      prevProps.onToggleAudio === nextProps.onToggleAudio &&
      prevProps.onToggleVideo === nextProps.onToggleVideo &&
      prevProps.onToggleScreenShare === nextProps.onToggleScreenShare &&
      prevProps.onToggleChat === nextProps.onToggleChat &&
      prevProps.onEndCall === nextProps.onEndCall
    );
  }
);

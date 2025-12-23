import React, { forwardRef, memo } from "react";
import {
  Paper,
  Box,
  Typography,
  Chip,
  Stack,
  CircularProgress,
  alpha,
  Avatar,
} from "@mui/material";
import { Mic, MicOff, SignalCellularAlt } from "@mui/icons-material";
import { useMediaStream } from "../../hooks/useMediaStream";

const Video = forwardRef<HTMLVideoElement>((props, ref) => (
  <video
    ref={ref}
    autoPlay
    playsInline
    style={{
      width: "100%",
      height: "100%",
      objectFit: "cover",
    }}
    {...props}
  />
));
Video.displayName = "Video";

type RemoteVideoProps = {
  stream: MediaStream | null;
  userId?: string;
  connectionQuality?: "good" | "poor" | "connecting";
  isAudioEnabled?: boolean;
};

const RemoteVideoComponent = ({
  stream,
  userId,
  connectionQuality = "good",
  isAudioEnabled = true,
}: RemoteVideoProps) => {
  const videoRef = useMediaStream(stream);
  const displayName = userId ? `User ${userId.slice(0, 6)}` : "Remote User";

  const getQualityColor = () => {
    switch (connectionQuality) {
      case "good":
        return "#4caf50";
      case "poor":
        return "#ff9800";
      case "connecting":
        return "#2196f3";
      default:
        return "#4caf50";
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        position: "relative",
        background: "#000",
        borderRadius: 2,
        overflow: "hidden",
        aspectRatio: "16/9",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      {stream ? (
        <>
          <Video ref={videoRef} />

          <Box
            sx={{
              position: "absolute",
              top: 12,
              left: 12,
              right: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Chip
              label={displayName}
              size="small"
              sx={{
                bgcolor: alpha("#000", 0.7),
                color: "white",
                fontWeight: 500,
                backdropFilter: "blur(10px)",
              }}
            />

            <Box
              sx={{
                bgcolor: alpha("#000", 0.7),
                borderRadius: 1,
                px: 1,
                py: 0.5,
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                backdropFilter: "blur(10px)",
              }}
            >
              <SignalCellularAlt
                sx={{
                  fontSize: 14,
                  color: getQualityColor(),
                }}
              />
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  bgcolor: getQualityColor(),
                }}
              />
            </Box>
          </Box>

          <Box
            sx={{
              position: "absolute",
              bottom: 12,
              left: 12,
            }}
          >
            <Box
              sx={{
                bgcolor: alpha("#000", 0.7),
                borderRadius: 1,
                p: 0.5,
                display: "flex",
                alignItems: "center",
                backdropFilter: "blur(10px)",
              }}
            >
              {isAudioEnabled ? (
                <Mic sx={{ fontSize: 16, color: "white" }} />
              ) : (
                <MicOff sx={{ fontSize: 16, color: "#f44336" }} />
              )}
            </Box>
          </Box>
        </>
      ) : (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "#1a1a1a",
            gap: 2,
          }}
        >
          <Avatar
            sx={{
              width: 64,
              height: 64,
              bgcolor: "primary.main",
              fontSize: 24,
            }}
          >
            {displayName.charAt(0)}
          </Avatar>

          <Stack alignItems="center" spacing={1}>
            <CircularProgress size={20} />

            <Typography variant="caption" color="#999">
              Connecting...
            </Typography>
          </Stack>
        </Box>
      )}
    </Paper>
  );
};

export const RemoteVideo = memo(
  RemoteVideoComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.stream === nextProps.stream &&
      prevProps.userId === nextProps.userId &&
      prevProps.connectionQuality === nextProps.connectionQuality &&
      prevProps.isAudioEnabled === nextProps.isAudioEnabled
    );
  }
);

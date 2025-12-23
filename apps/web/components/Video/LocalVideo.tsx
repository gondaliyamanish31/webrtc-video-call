import React, { forwardRef, memo } from "react";
import { Paper, Box, Typography, Chip, Stack, alpha } from "@mui/material";
import { Mic, MicOff, Videocam, VideocamOff } from "@mui/icons-material";
import { useMediaStream } from "../../hooks/useMediaStream";

const Video = forwardRef<HTMLVideoElement>((props, ref) => (
  <video
    ref={ref}
    autoPlay
    muted
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

type LocalVideoProps = {
  stream: MediaStream | null;
  isAudioEnabled?: boolean;
  isVideoEnabled?: boolean;
};

const LocalVideoComponent = ({
  stream,
  isAudioEnabled = true,
  isVideoEnabled = true,
}: LocalVideoProps) => {
  const videoRef = useMediaStream(stream);

  return (
    <Paper
      elevation={3}
      sx={{
        position: "relative",
        background: "#000",
        borderRadius: 2,
        overflow: "hidden",
        aspectRatio: "16/9",
        border: "2px solid",
        borderColor: "primary.main",
      }}
    >
      {isVideoEnabled && stream ? (
        <Video ref={videoRef} />
      ) : (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "#1a1a1a",
          }}
        >
          <Box textAlign="center">
            <VideocamOff sx={{ fontSize: 48, color: "#666", mb: 1 }} />
            <Typography variant="body2" color="#999">
              Camera Off
            </Typography>
          </Box>
        </Box>
      )}

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
          label="You"
          size="small"
          sx={{
            bgcolor: alpha("#667eea", 0.9),
            color: "white",
            fontWeight: 600,
            backdropFilter: "blur(10px)",
          }}
        />
      </Box>

      <Box
        sx={{
          position: "absolute",
          bottom: 12,
          left: 12,
          right: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Stack direction="row" spacing={0.5}>
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
            {isVideoEnabled ? (
              <Videocam sx={{ fontSize: 16, color: "white" }} />
            ) : (
              <VideocamOff sx={{ fontSize: 16, color: "#f44336" }} />
            )}
          </Box>
        </Stack>
      </Box>
    </Paper>
  );
};

export const LocalVideo = memo(LocalVideoComponent, (prevProps, nextProps) => {
  return (
    prevProps.stream === nextProps.stream &&
    prevProps.isAudioEnabled === nextProps.isAudioEnabled &&
    prevProps.isVideoEnabled === nextProps.isVideoEnabled
  );
});

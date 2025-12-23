import React, { Fragment, useEffect, useRef, useState } from "react";
import {
  Paper,
  Box,
  Typography,
  TextField,
  IconButton,
  Stack,
  Avatar,
  Divider,
} from "@mui/material";
import { Send } from "@mui/icons-material";
import { ChatMessage } from "@/contexts/VideoCallContext";

type ChatPanelProps = {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  currentUserId: string | null;
};

export const ChatPanel = ({
  messages,
  onSendMessage,
  currentUserId,
}: ChatPanelProps) => {
  const [input, setInput] = useState("");
  const [panelWidth, setPanelWidth] = useState(380);
  const [isResizing, setIsResizing] = useState(false);

  const messagesRef = useRef<HTMLDivElement>(null);
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(0);

  /* -------------------- AUTO SCROLL -------------------- */
  useEffect(() => {
    messagesRef.current?.scrollTo({
      top: messagesRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length]);

  /* -------------------- RESIZE -------------------- */
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const dx = resizeStartX.current - e.clientX;
      setPanelWidth(
        Math.min(800, Math.max(320, resizeStartWidth.current + dx))
      );
    };

    const onUp = () => setIsResizing(false);

    if (isResizing) {
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    }

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isResizing]);

  /* -------------------- HELPERS -------------------- */
  const getInitials = (name: string) =>
    name
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput("");
  };

  return (
    <Paper
      elevation={0}
      sx={{
        width: panelWidth,
        display: "flex",
        flexDirection: "column",
        borderLeft: "1px solid #e0e0e0",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        bgcolor: "#fff",
      }}
    >
      {/* Resize handle */}
      <Box
        onMouseDown={(e) => {
          setIsResizing(true);
          resizeStartX.current = e.clientX;
          resizeStartWidth.current = panelWidth;
        }}
        sx={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 6,
          cursor: "ew-resize",
          zIndex: 10,
        }}
      />

      {/* Header */}
      <Box
        sx={{
          px: 3,
          py: 2,
          borderBottom: "1px solid #f0f0f0",
          flexShrink: 0,
        }}
      >
        <Typography fontWeight={600}>Chat</Typography>
      </Box>

      {/* Messages (ONLY THIS SCROLLS) */}
      <Box
        ref={messagesRef}
        sx={{
          flex: 1,
          overflowY: "auto",
          px: 3,
          py: 2,
          bgcolor: "#fafafa",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          minHeight: 0,

          "&::-webkit-scrollbar": { width: 6 },
          "&::-webkit-scrollbar-thumb": {
            bgcolor: "#c1c1c1",
            borderRadius: 3,
          },
        }}
      >
        {messages.map((msg, index) => {
          const isOwn = msg.userId === currentUserId;

          const showDateDivider =
            index > 0 &&
            new Date(msg.timestamp).toDateString() !==
              new Date(messages[index - 1].timestamp).toDateString();

          return (
            <Fragment key={msg.id}>
              {showDateDivider && (
                <Divider>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(msg.timestamp).toLocaleDateString()}
                  </Typography>
                </Divider>
              )}

              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  alignItems: "flex-end",
                  justifyContent: isOwn ? "flex-end" : "flex-start",
                }}
              >
                {!isOwn && (
                  <Avatar sx={{ width: 32, height: 32, fontSize: 12 }}>
                    {getInitials(msg.userId)}
                  </Avatar>
                )}

                <Box sx={{ maxWidth: "70%" }}>
                  <Box
                    sx={{
                      px: 2,
                      py: 1.25,
                      bgcolor: isOwn ? "#1976d2" : "#fff",
                      color: isOwn ? "#fff" : "#111",
                      borderRadius: 2,
                      boxShadow: 1,
                      display: "flex",
                      alignItems: "flex-end",
                      gap: 1,
                      maxWidth: "100%",
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "0.9rem",
                        lineHeight: 1.4,
                        wordBreak: "break-word",
                        flex: 1,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {msg.message}
                    </Typography>

                    <Typography
                      sx={{
                        fontSize: "0.65rem",
                        opacity: 0.6,
                        whiteSpace: "nowrap",
                        lineHeight: 1,
                        alignSelf: "flex-end",
                      }}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Fragment>
          );
        })}
      </Box>

      <Box
        sx={{
          px: 2.5,
          py: 2,
          borderTop: "1px solid #f0f0f0",
          flexShrink: 0,
        }}
      >
        <Stack direction="row" spacing={1}>
          <TextField
            fullWidth
            size="small"
            placeholder="Type a message…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />

          <IconButton
            onClick={handleSend}
            disabled={!input.trim()}
            color="primary"
          >
            <Send />
          </IconButton>
        </Stack>
      </Box>
    </Paper>
  );
};

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Divider,
  Alert,
  Skeleton,
} from "@mui/material";
import { VideoCall, Add, Login } from "@mui/icons-material";
import { useForm } from "react-hook-form";
import { generateRoomId, validateRoomId } from "../../utils/roomId";
import {
  ActionSection,
  Header,
  IconWrapper,
  MainCard,
  PageContainer,
} from "./HomePage.styled";

type JoinRoomForm = {
  roomId: string;
};

export const HomePage = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JoinRoomForm>();

  const handleCreateRoom = () => {
    const roomId = generateRoomId();
    router.push(`/room/${roomId}?create=true`);
  };

  const onJoinRoom = (data: JoinRoomForm) => {
    const trimmedRoomId = data.roomId.trim();

    if (!validateRoomId(trimmedRoomId)) {
      setError("Invalid room ID format");
      return;
    }

    router.push(`/room/${trimmedRoomId}`);
  };

  return (
    <PageContainer>
      <MainCard elevation={4}>
        <Header>
          <IconWrapper>
            <VideoCall sx={{ fontSize: 48 }} />
          </IconWrapper>

          <Typography variant="h4" fontWeight="bold" gutterBottom>
            WebRTC Video Call
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Connect face-to-face with peer-to-peer video calls
          </Typography>
        </Header>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <ActionSection>
          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={<Add />}
            onClick={handleCreateRoom}
            sx={{ py: 1.5, fontSize: "1rem" }}
          >
            Create New Room
          </Button>
        </ActionSection>

        <Divider sx={{ my: 3 }}>
          <Typography variant="body2" color="text.secondary">
            OR
          </Typography>
        </Divider>

        <form onSubmit={handleSubmit(onJoinRoom)}>
          <ActionSection>
            <Typography variant="subtitle2" gutterBottom fontWeight="medium">
              Join Existing Room
            </Typography>

            <TextField
              fullWidth
              placeholder="Enter room ID"
              variant="outlined"
              {...register("roomId", {
                required: "Room ID is required",
                minLength: {
                  value: 4,
                  message: "Room ID must be at least 4 characters",
                },
              })}
              error={!!errors.roomId}
              helperText={errors.roomId?.message}
              sx={{ mb: 2 }}
            />

            <Button
              fullWidth
              variant="outlined"
              size="large"
              type="submit"
              startIcon={<Login />}
              sx={{ py: 1.5 }}
            >
              Join Room
            </Button>
          </ActionSection>
        </form>

        <Box sx={{ mt: 4, p: 2, bgcolor: "#f5f5f5", borderRadius: 2 }}>
          <Typography variant="caption" color="text.secondary">
            <strong>How it works:</strong>
            <br />
            1. Create a room and share the Room ID with someone
            <br />
            2. They join using your Room ID
            <br />
            3. Start your video call instantly!
          </Typography>
        </Box>
      </MainCard>
    </PageContainer>
  );
};

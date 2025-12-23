"use client";

import React from "react";
import styled from "styled-components";
import { Paper, Typography, Chip, Box } from "@mui/material";
import { CopyButton } from "../common/CopyButton";
import { People } from "@mui/icons-material";
import { InfoContainer, RoomIdBox } from "./RoomInfo.styled";

type RoomInfoProps = {
  roomId: string;
  connectionStatus: string;
  participantCount?: number;
  // participants?: string[];
};

export const RoomInfo = ({
  roomId,
  connectionStatus,
  participantCount = 0,
  // participants = [],
}: RoomInfoProps) => {
  const getStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "success";
      case "connecting":
        return "warning";
      case "disconnected":
        return "default";
      case "failed":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <InfoContainer elevation={2}>
      <RoomIdBox>
        <Typography variant="body2" color="text.secondary">
          Room ID:
        </Typography>
        <Typography variant="h6" fontFamily="monospace">
          {roomId}
        </Typography>
        <CopyButton text={roomId} label="Copy Room ID" />
      </RoomIdBox>

      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        {/* Participant Count Chip */}
        <Chip
          icon={<People />}
          label={`${participantCount} participant${participantCount !== 1 ? "s" : ""}`}
          color="primary"
          size="small"
          variant="outlined"
        />

        {/* Connection Status Chip */}
        <Chip
          label={connectionStatus.toUpperCase()}
          color={getStatusColor()}
          size="small"
        />
      </Box>
    </InfoContainer>
  );
};

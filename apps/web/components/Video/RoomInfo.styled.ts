import { Box, Paper } from "@mui/material";
import styled from "styled-components";

const InfoContainer = styled(Paper)`
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-radius: 12px;
`;

const RoomIdBox = styled(Box)`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export { InfoContainer, RoomIdBox };

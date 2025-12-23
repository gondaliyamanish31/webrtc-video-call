import { Box, Container, Paper } from "@mui/material";
import styled from "styled-components";

const PageContainer = styled(Container)`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

const MainCard = styled(Paper)`
  padding: 48px;
  max-width: 500px;
  width: 100%;
  border-radius: 16px;
`;

const Header = styled(Box)`
  text-align: center;
  margin-bottom: 32px;
`;

const IconWrapper = styled(Box)`
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  color: white;
`;

const ActionSection = styled(Box)`
  margin: 24px 0;
`;

export { PageContainer, MainCard, Header, IconWrapper, ActionSection };

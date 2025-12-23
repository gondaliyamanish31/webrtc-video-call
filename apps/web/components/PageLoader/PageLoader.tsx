import { Box } from "@mui/material";
import { FacebookCircularProgress } from "@repo/ui/Loader/FacebookCircularProgress";

export const PageLoader = () => {
  return (
    <Box
      sx={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      }}
    >
      <FacebookCircularProgress size={60} />
    </Box>
  );
};

import {
  Box,
  CircularProgress,
  circularProgressClasses,
  type CircularProgressProps,
} from "@mui/material";

export function FacebookCircularProgress(
  props: Readonly<CircularProgressProps>
) {
  return (
    <Box sx={{ position: "relative" }}>
      <CircularProgress
        variant="determinate"
        sx={{
          color: (theme) => theme.palette.grey[200],
        }}
        size={40}
        thickness={4}
        {...props}
        value={100}
      />
      <CircularProgress
        variant="indeterminate"
        disableShrink
        sx={{
          color: "hsla(203, 79%, 57%, 1)",
          animationDuration: "400ms",
          position: "absolute",
          left: 0,
          [`& .${circularProgressClasses.circle}`]: {
            strokeLinecap: "round",
          },
        }}
        size={40}
        thickness={4}
        {...props}
      />
    </Box>
  );
}

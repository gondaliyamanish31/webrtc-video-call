import React, { useState } from "react";
import { IconButton, Tooltip } from "@mui/material";
import { ContentCopy, Check } from "@mui/icons-material";

type CopyButtonProps = {
  text: string;
  label?: string;
};

export const CopyButton = ({ text, label = "Copy" }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <Tooltip title={copied ? "Copied!" : label}>
      <IconButton onClick={handleCopy} size="small">
        {copied ? <Check /> : <ContentCopy />}
      </IconButton>
    </Tooltip>
  );
};

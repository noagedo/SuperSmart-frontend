import React from 'react';
import { Box, BoxProps } from '@mui/material';
import { MessageCircle } from 'lucide-react';

interface ChatBadgeProps extends BoxProps {
  count: number;
  showIcon?: boolean;  // האם להציג אייקון של הודעה
  badgePosition?: 'top-right' | 'top-left';  // מיקום ה-Badge
}

/**
 * רכיב שמציג התראת מספר ההודעות הלא נקראות
 */
const ChatBadge: React.FC<ChatBadgeProps> = ({ 
  count, 
  showIcon = true, 
  badgePosition = 'top-right',
  ...boxProps 
}) => {
  if (count <= 0) return null;

  // קביעת המיקום לפי הפרופ שהתקבל
  const positionStyles = badgePosition === 'top-right' 
    ? { top: 10, right: 10 }
    : { top: 10, left: 10 };

  return (
    <Box
      {...boxProps}
      sx={{
        position: "absolute",
        ...positionStyles,
        zIndex: 5,
        bgcolor: "#ef4444",
        color: "white",
        borderRadius: "50%",
        padding: "2px 8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "0.85rem",
        fontWeight: "bold",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        minWidth: "24px",
        height: "24px",
        ...boxProps.sx
      }}
    >
      {showIcon && (
        <MessageCircle size={14} style={{ marginRight: count > 9 ? 2 : 4 }} />
      )}
      {count}
    </Box>
  );
};

export default ChatBadge;

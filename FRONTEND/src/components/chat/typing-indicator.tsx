// ==========================================================
// ⌨️ C.H.A.O.S. TYPING INDICATOR COMPONENT ⌨️
// ==========================================================
// - MSN MESSENGER INSPIRED TYPING ANIMATION
// - REAL-TIME USER STATUS FEEDBACK
// - ANIMATED DOT SEQUENCE FOR VISUAL FEEDBACK
// - CROSS-PLATFORM COMPATIBILITY LAYER
// ==========================================================

import { motion } from 'framer-motion';

interface TypingIndicatorProps {
  name: string;
}

export function TypingIndicator({ name }: TypingIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex justify-start"
    >
      <div className="message-bubble received max-w-fit bg-muted/50 py-2 px-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-medium">{name}</span>
          <span className="text-muted-foreground">is typing</span>
          <span className="flex space-x-1">
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              className="text-muted-foreground"
            >
              ●
            </motion.span>
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
              className="text-muted-foreground"
            >
              ●
            </motion.span>
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
              className="text-muted-foreground"
            >
              ●
            </motion.span>
          </span>
        </div>
      </div>
    </motion.div>
  );
}

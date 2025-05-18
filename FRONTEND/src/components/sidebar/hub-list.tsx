// ==========================================================
// 🏠 C.H.A.O.S. HUBS LIST COMPONENT 🏠
// ==========================================================
// - DISCORD-INSPIRED COMMUNITY HUB LISTING
// - INTERACTIVE SERVER/HUB SELECTION
// - ANIMATED TRANSITIONS AND HOVER EFFECTS
// - CROSS-PLATFORM INTERACTION PATTERNS
// ==========================================================

import { motion } from 'framer-motion';

// Types
import { Hub } from '@/lib/types';

// Icons
import { Users } from 'lucide-react';

interface HubListProps {
  hubs: Hub[];
  onHubClick: (hubId: string) => void;
}

export function HubList({ hubs, onHubClick }: HubListProps) {
  // If no hubs are available, show empty state
  if (hubs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border p-8 text-center">
        <Users size={24} className="mb-2 text-muted-foreground" />
        <h3 className="mb-1 text-sm font-medium">No Hubs Found</h3>
        <p className="text-xs text-muted-foreground">
          {`Join or create a hub to start collaborating.`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {hubs.map((hub) => (
        <motion.button
          key={hub.id}
          onClick={() => onHubClick(hub.id)}
          className="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-muted"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Hub icon/avatar */}
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            {hub.iconUrl ? (
              <img
                src={hub.iconUrl}
                alt={hub.name}
                className="h-full w-full rounded-md object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-md text-sm font-semibold">
                {hub.name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          {/* Hub info */}
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{hub.name}</div>
            {hub.description && (
              <div className="truncate text-xs text-muted-foreground">
                {hub.description}
              </div>
            )}
          </div>

          {/* Member count */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users size={12} />
            <span>{hub.memberCount}</span>
          </div>
        </motion.button>
      ))}
    </div>
  );
}

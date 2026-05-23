/**
 * PresenceIndicator
 *
 * Shows a live count of connected users in the header.
 * Clicking it opens a small popover listing all online user IDs.
 * Uses the usePresence hook which connects via WebSocket.
 */

import { useRef, useState, useEffect } from "react";
import { Users, Wifi, WifiOff } from "lucide-react";
import { usePresence } from "@/hooks/use-presence";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface PresenceIndicatorProps {
  userId: string | null | undefined;
}

export function PresenceIndicator({ userId }: PresenceIndicatorProps) {
  const { online, connected } = usePresence(userId);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const count = online.length;

  return (
    <div className="relative" ref={ref}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => setOpen((o) => !o)}
            className={cn(
              "h-8 px-2.5 flex items-center gap-1.5 rounded-xl border transition-all",
              connected
                ? "text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10"
                : "text-muted-foreground border-border/60 hover:bg-muted/60",
            )}
            aria-label={`${count} user${count !== 1 ? "s" : ""} online`}
          >
            {connected ? (
              <Wifi className="size-3.5 shrink-0" />
            ) : (
              <WifiOff className="size-3.5 shrink-0" />
            )}
            <span className="text-[11px] font-bold font-mono">{count}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {connected ? `${count} online` : "Connecting…"}
        </TooltipContent>
      </Tooltip>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-border/60 bg-background/95 backdrop-blur-sm shadow-lg z-[9999] overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border/60">
            <Users className="size-3.5 text-primary" />
            <span className="text-sm font-semibold">Online now</span>
            <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
              {count}
            </span>
          </div>

          {/* Status dot + connection state */}
          <div className="px-4 py-2 flex items-center gap-2 border-b border-border/60">
            <span
              className={cn(
                "size-2 rounded-full shrink-0",
                connected ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground",
              )}
            />
            <span className="text-[11px] text-muted-foreground">
              {connected ? "WebSocket connected" : "Reconnecting…"}
            </span>
          </div>

          {/* User list */}
          <div className="max-h-48 overflow-y-auto scrollbar-thin p-2">
            {count === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 gap-1 text-muted-foreground">
                <Users className="size-6 opacity-20" />
                <p className="text-xs">No one else online</p>
              </div>
            ) : (
              <ul className="space-y-0.5">
                {online.map((uid) => (
                  <li
                    key={uid}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-muted/40 transition-colors"
                  >
                    <div className="size-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold grid place-items-center shrink-0 uppercase">
                      {uid.slice(0, 2)}
                    </div>
                    <span className="text-xs font-mono text-muted-foreground truncate flex-1">
                      {uid === userId ? (
                        <>
                          <span className="text-foreground font-semibold">you</span>
                          <span className="ml-1 opacity-50">({uid.slice(0, 8)}…)</span>
                        </>
                      ) : (
                        uid.slice(0, 16) + (uid.length > 16 ? "…" : "")
                      )}
                    </span>
                    <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {!connected && (
            <div className="px-4 py-2.5 border-t border-border/60 bg-amber-500/5 text-amber-500 text-[10px] flex items-center gap-1.5">
              <WifiOff className="size-3 shrink-0" />
              Presence unavailable — retrying…
            </div>
          )}
        </div>
      )}
    </div>
  );
}

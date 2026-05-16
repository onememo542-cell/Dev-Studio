import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageSectionProps {
  children: ReactNode;
  className?: string;
}

export function PageSection({ children, className }: PageSectionProps) {
  return (
    <div
      className={cn(
        "px-4 sm:px-8 pt-6 sm:pt-8 pb-4 sm:pb-6 border-b border-border bg-background shrink-0",
        className
      )}
    >
      <div className="max-w-[1400px] mx-auto w-full min-w-0">
        {children}
      </div>
    </div>
  );
}

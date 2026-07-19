"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const cycle = { light: "dark", dark: "system", system: "light" } as const;

// Theme is unknown until hydration; render a stable icon on the server to avoid a mismatch.
function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  const current = mounted && theme && theme in cycle ? (theme as keyof typeof cycle) : "system";
  const Icon = current === "light" ? Sun : current === "dark" ? Moon : Monitor;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant="ghost" size="icon" onClick={() => setTheme(cycle[current])}>
            <Icon className="size-4" />
            <span className="sr-only">Switch theme</span>
          </Button>
        }
      />
      <TooltipContent>Theme: {current}</TooltipContent>
    </Tooltip>
  );
}

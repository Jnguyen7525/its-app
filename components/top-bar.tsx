"use client";

import {
  SettingsContext,
  ThemeContext,
  ThemeSwitcher,
} from "@/shared/settings-context";
import { bindAll } from "bind-event-listener";
import {
  Code,
  Moon,
  PanelTopClose,
  PanelTopOpen,
  Settings,
  Sun,
  Wand2,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useContext, useEffect, useRef, useState } from "react";
import { FPSPanel } from "./fps-panel";
import { SettingsDialog } from "./settings-dialog";

type TRoute = { title: string; href: string };

const routes = {
  board: { title: "Board", href: "/board" },
  oneColumn: { title: "One Column", href: "/one-column" },
  twoColumns: { title: "Two Columns", href: "/two-columns" },
} as const satisfies { [key: string]: TRoute };

export function TopBar() {
  const pathname = usePathname();
  const [isTopBarExpanded, setIsTopBarExpanded] = useState<boolean>(true);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] =
    useState<boolean>(false);
  const settingsDialogRef = useRef<HTMLDivElement | null>(null);
  const settingsTriggerRef = useRef<HTMLButtonElement | null>(null);
  const { settings } = useContext(SettingsContext);

  const themeContext = useContext(ThemeContext);
  if (!themeContext) {
    throw new Error("Header must be used within a ThemeProvider");
  }

  const { theme } = themeContext;

  const triggerContent =
    theme === "light" ? (
      <div className="flex items-center gap-1 rounded-lg  transition hover:cursor-pointer">
        <Sun size={18} />
      </div>
    ) : theme === "dark" ? (
      <div className="flex items-center gap-1 rounded-lg  transition hover:cursor-pointer">
        <Moon size={18} />
      </div>
    ) : (
      theme.charAt(0).toUpperCase() + theme.slice(1) + " " + "mode" // Other themes just display their names
    );

  useEffect(() => {
    return bindAll(window, [
      {
        type: "keydown",
        listener(event) {
          if (event.key !== "Escape") {
            return;
          }

          if (isSettingsDialogOpen) {
            setIsSettingsDialogOpen(false);
            return;
          }
          setIsTopBarExpanded((current) => !current);
        },
      },
      {
        type: "click",
        listener(event) {
          if (!(event.target instanceof Element)) {
            return;
          }

          if (!isSettingsDialogOpen) {
            return;
          }

          const dialog = settingsDialogRef.current;
          const trigger = settingsTriggerRef.current;
          if (!dialog || !trigger) {
            return;
          }
          if (trigger.contains(event.target)) {
            return;
          }

          if (dialog.contains(event.target)) {
            return;
          }

          setIsSettingsDialogOpen(false);
        },
      },
    ]);
  }, [isTopBarExpanded, isSettingsDialogOpen]);

  return (
    <>
      <header
        className={`flex h-14 flex-row items-center justify-between gap-1 border-b border-zinc-900  px-3`}
      >
        <Link
          href={"/board"}
          className={`flex shrink gap-[2px] rounded p-2 leading-none  sm:text-xl sm:leading-none`}
        >
          <span>O</span> <span className="text-purple-500">Bo</span>
        </Link>
        <div className="z-1 flex items-center justify-center gap-1">
          {settings.isFPSPanelEnabled ? <FPSPanel /> : null}
          <ThemeSwitcher
            triggerContent={triggerContent}
            className="p-1 rounded-md hover:bg-zinc-800 transition-colors duration-200 cursor-pointer px-2 py-2 z-50 bg-zinc-900  text-white  "
          />
          <button
            type="button"
            ref={settingsTriggerRef}
            className="p-1 rounded-md hover:bg-zinc-800 transition-colors duration-200 cursor-pointer"
            onClick={() => setIsSettingsDialogOpen((current) => !current)}
            aria-label="toggle top bar visibility"
          >
            <Wand2 size={24} />
          </button>
          <button
            type="button"
            ref={settingsTriggerRef}
            className="p-1 rounded-md hover:bg-zinc-800 transition-colors duration-200 cursor-pointer"
            onClick={() => setIsSettingsDialogOpen((current) => !current)}
            aria-label="toggle top bar visibility"
          >
            <Settings size={24} />
          </button>
          {isSettingsDialogOpen ? (
            <SettingsDialog ref={settingsDialogRef} />
          ) : null}
        </div>
      </header>
    </>
  );
}

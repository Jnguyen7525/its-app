"use client";

import { SettingsContext } from "@/shared/settings-context";
import { bindAll } from "bind-event-listener";
import {
  Code,
  Filter,
  FilterIcon,
  Menu,
  PanelTopClose,
  PanelTopOpen,
  Plus,
  Search,
  Settings,
  User2,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useContext, useEffect, useRef, useState } from "react";
import { FPSPanel } from "./fps-panel";
import { SettingsDialog } from "./settings-dialog";
import AddColumn from "./add-column";
import { addColumn } from "@/state/board";
import { useAppDispatch, useAppSelector } from "@/state/redux";
import { TCardField } from "@/shared/data";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import { DropdownMenuPortal } from "./ui/dropdown-menu";

type TRoute = { title: string; href: string };

const routes = {
  board: { title: "Board", href: "/board" },
  oneColumn: { title: "One Column", href: "/one-column" },
  twoColumns: { title: "Two Columns", href: "/two-columns" },
} as const satisfies { [key: string]: TRoute };

export function FilterBar() {
  const pathname = usePathname();
  const [isFilterBarExpanded, setIsFilterBarExpanded] = useState<boolean>(true);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] =
    useState<boolean>(false);
  const settingsDialogRef = useRef<HTMLDivElement | null>(null);
  const settingsTriggerRef = useRef<HTMLButtonElement | null>(null);
  const { settings } = useContext(SettingsContext);
  const [showAddColumn, setShowAddColumn] = useState(false);

  const dispatch = useAppDispatch();
  const columns = useAppSelector((state) => state.board.columns);

  // const handleAddColumn = (title: string, fields: TCardField[]) => {
  //   console.log("[Board] handleAddColumn:", title, fields);
  //   dispatch(addColumn({ title, fields }));
  // };
  const handleAddColumn = (title: string) => {
    console.log("[Board] handleAddColumn:", title);
    dispatch(addColumn({ title }));
  };

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
          setIsFilterBarExpanded((current) => !current);
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
  }, [isFilterBarExpanded, isSettingsDialogOpen]);

  return (
    <div
      className={`flex h-14 flex-row items-center justify-between gap-1 border-b border-zinc-900 px-3`}
    >
      <div
        className={`flex shrink gap-3 rounded p-2 leading-none sm:text-lg sm:leading-none items-center`}
      >
        <span>board name</span>
        <FilterIcon
          size={28}
          className="text-purple-500 p-1 rounded-md hover:bg-zinc-800 transition-colors duration-200 cursor-pointer"
        />
        <Search
          size={28}
          className="text-purple-500 p-1 rounded-md hover:bg-zinc-800 transition-colors duration-200 cursor-pointer"
        />
        <DropdownMenu open={showAddColumn} onOpenChange={setShowAddColumn}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="p-1 rounded-md hover:bg-zinc-800 transition-colors duration-200 cursor-pointer"
              aria-label="Add Column"
            >
              <Plus size={24} className="text-green-500" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="bottom"
            align="start"
            className="p-2 bg-zinc-950 border border-zinc-800 rounded-lg shadow-md w-fit z-50"
          >
            <AddColumn
              onAdd={(title) => {
                handleAddColumn(title);
                setShowAddColumn(false); // ✅ close on create
              }}
              onClose={() => setShowAddColumn(false)} // ✅ close on cancel
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="z-1 flex items-center justify-center gap-1">
        <button
          type="button"
          ref={settingsTriggerRef}
          className="p-1 rounded-md hover:bg-zinc-800 transition-colors duration-200 cursor-pointer"
          onClick={() => setIsSettingsDialogOpen((current) => !current)}
          aria-label="toggle top bar visibility"
        >
          <User2 size={24} />
        </button>

        <button
          type="button"
          ref={settingsTriggerRef}
          className="p-1 rounded-md hover:bg-zinc-800 transition-colors duration-200 cursor-pointer"
          onClick={() => setIsSettingsDialogOpen((current) => !current)}
          aria-label="toggle top bar visibility"
        >
          <Menu size={24} />
        </button>
      </div>
    </div>
  );
}

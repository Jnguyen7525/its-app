"use client";

import {
  createContext,
  ReactNode,
  useMemo,
  useState,
  useContext,
  useRef,
  useEffect,
} from "react";
import { fields, TFields, TSettings } from "./settings";

export type TSettingsContext = {
  fields: TFields;
  settings: TSettings;
  update: (args: Partial<TSettings>) => void;
  reset: () => void;
};

const defaultSettings: TSettings = {
  isBoardMoreObvious: false,
  isOverElementAutoScrollEnabled: true,
  boardScrollSpeed: "fast",
  columnScrollSpeed: "standard",
  isFPSPanelEnabled: false,
  isCPUBurnEnabled: false,
  isOverflowScrollingEnabled: true,
};

export const SettingsContext = createContext<TSettingsContext>({
  fields,
  settings: defaultSettings,
  update: () => {},
  reset: () => {},
});

export function SettingsContextProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<TSettings>(defaultSettings);

  const value = useMemo(() => {
    function update(partial: Partial<TSettings>) {
      const updated = { ...settings, ...partial };
      setSettings(updated);
    }

    return {
      fields,
      settings,
      update,
      reset: () => update(defaultSettings),
    };
  }, [settings]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

// added theme switcher below
type DropdownContextType = {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
  placement: "bottom" | "top" | "right" | "left";
};

export const DropdownContext = createContext<DropdownContextType | null>(null);

export const useDropdownContext = () => {
  const ctx = useContext(DropdownContext);
  if (!ctx)
    throw new Error("Dropdown components must be used within <Dropdown>");
  return ctx;
};

// Dropdown.tsx

type Option = { key: string; label: string; action?: () => void };

type DropdownProps = {
  children: React.ReactNode;
  placement?: "bottom" | "top" | "right" | "left";
};

const Dropdown: React.FC<DropdownProps> = ({
  children,
  placement = "bottom",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggle = () => setIsOpen((prev) => !prev);
  const close = () => setIsOpen(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        close();
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <DropdownContext.Provider value={{ isOpen, toggle, close, placement }}>
      <div className="relative inline-block" ref={dropdownRef}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
};

export default Dropdown;

// DropdownTrigger.tsx

type DropdownTriggerProps = {
  children: React.ReactNode;
  className?: string;
};

export const DropdownTrigger: React.FC<DropdownTriggerProps> = ({
  children,
  className = "",
}) => {
  const { toggle } = useDropdownContext();

  return (
    <button onClick={toggle} className={className}>
      {children}
    </button>
  );
};

// DropdownMenu.tsx

type DropdownMenuProps = {
  options: Option[];
  className?: string;
};

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  options,
  className = "",
}) => {
  const { isOpen, close, placement } = useDropdownContext();

  const placementStyles = {
    bottom: "top-full left-1/2 transform -translate-x-1/2 mt-2",
    top: "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
    right: "top-1/2 left-full transform -translate-y-1/2 ml-2",
    left: "top-1/2 right-full transform -translate-y-1/2 mr-2",
  };

  if (!isOpen) return null;

  return (
    <div
      className={`absolute ${placementStyles[placement]} ${className}`}
      role="menu"
    >
      {options.map((option) => (
        <button
          key={option.key}
          onClick={() => {
            option.action?.();
            close();
          }}
          className={`block hover:opacity-60 hover:cursor-pointer`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

// 1️⃣ Define theme structure
interface CustomTheme {
  background: string;
  text: string;
  [key: string]: string;
}

interface ThemeContextType {
  theme: string; // Current selected theme name
  themes: Record<string, CustomTheme>; // ✅ Now stores all available themes
  setTheme: (theme: string) => void;
}

// 3️⃣ Create the context
export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined
);

// 4️⃣ Provider props allowing dynamic themes
interface ThemeProviderProps {
  children: ReactNode;
  themes: Record<string, CustomTheme>; // Supports multiple themes
  defaultTheme?: string;
}

interface ThemeSwitcherProps {
  triggerContent?: React.ReactNode | string; // ✅ Custom content for the button (text, icons, etc.)
  className?: string;
}

// 5️⃣ Create ThemeProvider supporting multiple themes
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  themes,
  defaultTheme = "dark",
}) => {
  const [theme, setTheme] = useState<string>(defaultTheme);

  return (
    <ThemeContext.Provider value={{ theme, themes, setTheme }}>
      <div
        className={`${themes[theme]?.background} ${themes[theme]?.text} transition-colors duration-300 w-full h-full`}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

// 6️⃣ Create ThemeSwitcher for dynamic switching
export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  triggerContent = "Switch Theme", // Default label if no custom content provided
  className,
}) => {
  const themeContext = useContext(ThemeContext);
  if (!themeContext) {
    throw new Error("ThemeSwitcher must be used within a ThemeProvider");
  }

  const { themes, setTheme } = themeContext;

  return (
    <Dropdown placement="bottom">
      <DropdownTrigger className={`z-40 ${className}`}>
        {triggerContent}
      </DropdownTrigger>
      <DropdownMenu
        options={Object.keys(themes).map((themeKey) => ({
          key: themeKey,
          label: themeKey.charAt(0).toUpperCase() + themeKey.slice(1),
          action: () => setTheme(themeKey), // ✅ Set selected theme and close dropdown
        }))}
        className={`w-fit items-start space-y-2 p-4 z-50  border  rounded-md shadow-lg flex flex-col ${className}`}
      />
    </Dropdown>
  );
};

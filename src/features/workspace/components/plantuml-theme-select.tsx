"use client";

import {
  PLANTUML_THEME_NONE,
  PLANTUML_THEMES,
  type PlantUmlTheme,
} from "@/features/rendering/plantuml-theme";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PlantUmlThemeSelectProps {
  value: PlantUmlTheme;
  onValueChange: (theme: PlantUmlTheme) => void;
}

export function PlantUmlThemeSelect({
  value,
  onValueChange,
}: PlantUmlThemeSelectProps) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="hidden text-xs font-bold text-slate-500 dark:text-slate-400 xl:inline">
        Theme
      </span>
      <Select<PlantUmlTheme>
        value={value}
        onValueChange={(nextTheme) =>
          onValueChange(nextTheme ?? PLANTUML_THEME_NONE)
        }
      >
        <SelectTrigger className="w-36 sm:w-44 lg:w-52" title="PlantUML theme">
          <SelectValue>
            {(theme: PlantUmlTheme | null) => theme ?? PLANTUML_THEME_NONE}
          </SelectValue>
        </SelectTrigger>
        <SelectContent sideOffset={8}>
          {PLANTUML_THEMES.map((theme) => (
            <SelectItem key={theme} value={theme} label={theme}>
              {theme}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

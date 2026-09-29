"use client";

import { Check, Globe, Monitor, Moon, Sun } from "lucide-react";
import { LOCALES, localeInfo } from "@/lib/i18n/config";
import { useSwitchLocale } from "@/lib/i18n/navigation";
import { useI18n } from "@/lib/i18n/provider";
import { useTheme, type ThemePreference } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/overlay";
import { cn } from "@/lib/cn";

export function LanguageSwitcher({ variant = "icon", className }: { variant?: "icon" | "full"; className?: string }) {
  const { locale, t } = useI18n();
  const switchLocale = useSwitchLocale();
  const current = localeInfo(locale);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "icon" ? (
          <Button variant="ghost" size="sm" className={cn("gap-1.5 px-2.5", className)} aria-label={t("nav.language")}>
            <Globe />
            <span className="text-xs font-semibold uppercase">{current.code.split("-")[0]}</span>
          </Button>
        ) : (
          <Button variant="secondary" size="sm" className={cn("gap-2", className)} aria-label={t("nav.language")}>
            <Globe />
            {current.native}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>{t("nav.language")}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={locale} onValueChange={switchLocale}>
          {LOCALES.map((l) => (
            <DropdownMenuRadioItem key={l.code} value={l.code} lang={l.code} dir={l.dir}>
              <span className="flex-1">{l.native}</span>
              <span className="text-xs text-faint">{l.english !== l.native ? l.code : ""}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const { t } = useI18n();
  const { preference, resolved, setPreference } = useTheme();
  const Icon = resolved === "dark" ? Moon : Sun;
  const options: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
    { value: "light", label: t("nav.themeLight"), icon: Sun },
    { value: "dark", label: t("nav.themeDark"), icon: Moon },
    { value: "system", label: t("nav.themeSystem"), icon: Monitor },
  ];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("size-9", className)} aria-label={t("nav.theme")}>
          <Icon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-44">
        <DropdownMenuLabel>{t("nav.theme")}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={preference} onValueChange={(v) => setPreference(v as ThemePreference)}>
          {options.map((o) => (
            <DropdownMenuRadioItem key={o.value} value={o.value}>
              <o.icon />
              {o.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Inline three-way toggle for the mobile menu / footer. */
export function ThemeSegmented() {
  const { t } = useI18n();
  const { preference, setPreference } = useTheme();
  const items: { value: ThemePreference; icon: typeof Sun; label: string }[] = [
    { value: "light", icon: Sun, label: t("nav.themeLight") },
    { value: "dark", icon: Moon, label: t("nav.themeDark") },
    { value: "system", icon: Monitor, label: t("nav.themeSystem") },
  ];
  return (
    // max-w-full + truncating labels: in the narrow menu drawer even a long translation can never push it past the screen edge.
    <div role="radiogroup" aria-label={t("nav.theme")} className="inline-flex max-w-full rounded-xl border border-line bg-surface-2 p-1">
      {items.map((i) => (
        <button
          key={i.value}
          role="radio"
          aria-checked={preference === i.value}
          onClick={() => setPreference(i.value)}
          className={cn(
            "inline-flex h-8 min-w-0 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors pointer-coarse:h-10 pointer-coarse:text-sm",
            preference === i.value ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink",
          )}
        >
          <i.icon className="size-3.5 shrink-0" />
          <span className="truncate">{i.label}</span>
        </button>
      ))}
    </div>
  );
}

export { Check };

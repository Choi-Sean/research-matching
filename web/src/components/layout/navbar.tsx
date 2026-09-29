"use client";

import {
  BookOpen,
  ChevronDown,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Menu,
  PenLine,
  Sparkles,
  X,
  Compass,
  Layers,
  CalendarClock,
  Lightbulb,
} from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useEffect, useState, type ReactNode } from "react";
import { Avatar } from "@/components/ui/surface";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/overlay";
import { Container } from "@/components/ui/layout";
import { cn } from "@/lib/cn";
import { useAuth } from "@/lib/auth";
import { Link, useLocaleRouter, usePathnameNoLocale } from "@/lib/i18n/navigation";
import { useI18n } from "@/lib/i18n/provider";
import { LogoMark, Wordmark } from "./logo";
import { LanguageSwitcher, ThemeSegmented, ThemeToggle } from "./preferences";

export function Logo({ className }: { className?: string }) {
  const { t } = useI18n();
  return (
    <Link href="/" className={cn("flex min-h-11 items-center gap-2.5 text-ink", className)} aria-label={t("nav.home")}>
      <LogoMark />
      <Wordmark />
    </Link>
  );
}

function useNavLinks() {
  const { t } = useI18n();
  const { user } = useAuth();
  const aiHref = user?.role === "student" ? "/dashboard/matches" : user?.role === "professor" ? "/dashboard/talent" : "/ai-match";
  const resources = [
    { href: "/tools/email-checker", label: t("nav.emailChecker"), desc: t("nav.emailCheckerDesc"), icon: PenLine },
    { href: "/tools/follow-up", label: t("nav.followUp"), desc: t("nav.followUpDesc"), icon: CalendarClock },
    { href: "/framework", label: t("nav.framework"), desc: t("nav.frameworkDesc"), icon: Layers },
    { href: "/examples", label: t("nav.examples"), desc: t("nav.examplesDesc"), icon: Lightbulb },
    { href: "/fields", label: t("nav.fields"), desc: t("nav.fieldsDesc"), icon: Compass },
    { href: "/blog", label: t("nav.blog"), desc: t("nav.blogDesc"), icon: BookOpen },
  ];
  const main = [
    { href: "/discover", label: t("nav.discover") },
    { href: "/positions", label: t("nav.positions") },
    { href: aiHref, label: t("nav.aiMatch"), sparkle: true },
    { href: "/pricing", label: t("nav.pricing") },
  ];
  return { main, resources };
}

function NavLink({ href, children, sparkle }: { href: string; children: ReactNode; sparkle?: boolean }) {
  const path = usePathnameNoLocale();
  const active = path === href || (href !== "/" && path.startsWith(`${href}/`));
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors",
        active ? "text-ink" : "text-muted hover:text-ink",
      )}
    >
      {sparkle && <Sparkles className="size-3.5 text-accent" aria-hidden />}
      {children}
      {active && <span className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-brand" aria-hidden />}
    </Link>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const router = useLocaleRouter();
  if (!user) return null;
  const signOut = () => {
    logout();
    router.push("/");
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="group flex items-center gap-2 rounded-full border border-line bg-surface p-1 pe-2.5 shadow-sm transition-colors hover:border-line-2"
          aria-label={t("nav.account")}
        >
          <Avatar name={user.full_name} size={28} />
          <ChevronDown className="size-3.5 text-faint transition-transform group-data-[state=open]:rotate-180" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60">
        <div className="px-2.5 py-2">
          <p className="truncate text-sm font-semibold text-ink">{user.full_name}</p>
          <p className="truncate text-xs text-faint">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard">
            <LayoutDashboard /> {t("nav.dashboard")}
          </Link>
        </DropdownMenuItem>
        {user.role === "student" && (
          <DropdownMenuItem asChild>
            <Link href="/dashboard/applications">
              <FileText /> {t("dash.nav.applications")}
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href="/dashboard/billing">
            <CreditCard /> {t("dash.nav.billing")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/feedback">
            <MessageSquare /> {t("nav.feedback")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut}>
          <LogOut /> {t("nav.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Navbar() {
  const { t } = useI18n();
  const { user, loading, logout } = useAuth();
  const router = useLocaleRouter();
  const { main, resources } = useNavLinks();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 6);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-300",
        scrolled ? "border-b border-line bg-canvas/80 backdrop-blur-xl" : "border-b border-transparent bg-canvas/0",
      )}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-canvas"
      >
        {t("nav.skip")}
      </a>
      <Container className="flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-7">
          <Logo />
          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main">
            {main.slice(0, 3).map((l) => (
              <NavLink key={l.href} href={l.href} sparkle={l.sparkle}>
                {l.label}
              </NavLink>
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="group inline-flex h-9 items-center gap-1 rounded-lg px-3 text-sm font-medium text-muted transition-colors hover:text-ink data-[state=open]:text-ink">
                  {t("nav.resources")}
                  <ChevronDown className="size-3.5 transition-transform group-data-[state=open]:rotate-180" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[19rem] p-2">
                {resources.map((r) => (
                  <DropdownMenuItem key={r.href} asChild className="items-start gap-3 p-2.5">
                    <Link href={r.href}>
                      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-text">
                        <r.icon className="!text-brand-text" />
                      </span>
                      <span>
                        <span className="block text-sm font-medium text-ink">{r.label}</span>
                        <span className="block text-xs leading-snug text-muted">{r.desc}</span>
                      </span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {main.slice(3).map((l) => (
              <NavLink key={l.href} href={l.href}>
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-1.5 lg:flex">
          <LanguageSwitcher />
          <ThemeToggle />
          <div className="ms-2 flex items-center gap-2">
            {loading ? (
              <div className="h-9 w-28" />
            ) : user ? (
              <>
                <Button asChild variant="secondary" size="sm">
                  <Link href="/dashboard">{t("nav.dashboard")}</Link>
                </Button>
                <UserMenu />
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">{t("nav.signIn")}</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/register">{t("nav.getStarted")}</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Mobile */}
        <div className="flex items-center gap-1 lg:hidden">
          <ThemeToggle />
          <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
            <DialogPrimitive.Trigger asChild>
              <Button variant="ghost" size="icon" aria-label={t("nav.menu")} className="size-9">
                <Menu />
              </Button>
            </DialogPrimitive.Trigger>
            <DialogPrimitive.Portal>
              <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[var(--overlay)] data-[state=open]:animate-[fade-in_0.2s_ease-out]" />
              <DialogPrimitive.Content className="fixed inset-y-0 end-0 z-50 flex w-[min(24rem,92vw)] flex-col overflow-y-auto overscroll-contain border-s border-line bg-canvas p-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-pop focus:outline-none">
                <DialogPrimitive.Title className="sr-only">{t("nav.menu")}</DialogPrimitive.Title>
                <DialogPrimitive.Description className="sr-only">{t("nav.menu")}</DialogPrimitive.Description>
                <div className="flex items-center justify-between">
                  <Logo />
                  <DialogPrimitive.Close asChild>
                    <Button variant="ghost" size="icon" aria-label={t("common.close")} className="size-9">
                      <X />
                    </Button>
                  </DialogPrimitive.Close>
                </div>
                <nav className="mt-6 flex flex-col gap-1" onClick={() => setOpen(false)}>
                  {main.map((l) => (
                    <Link key={l.href} href={l.href} className="flex items-center gap-2 rounded-xl px-3 py-3 text-base font-medium text-ink hover:bg-surface-2">
                      {l.sparkle && <Sparkles className="size-4 text-accent" />}
                      {l.label}
                    </Link>
                  ))}
                  <p className="eyebrow mt-5 mb-1 px-3 !text-faint">{t("nav.resources")}</p>
                  {resources.map((r) => (
                    <Link key={r.href} href={r.href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.9375rem] text-muted hover:bg-surface-2 hover:text-ink">
                      <r.icon className="size-4" />
                      {r.label}
                    </Link>
                  ))}
                </nav>
                <div className="mt-auto space-y-4 pt-8">
                  <div className="flex flex-wrap items-center gap-2">
                    <LanguageSwitcher variant="full" />
                    <ThemeSegmented />
                  </div>
                  {loading ? null : user ? (
                    <div className="flex gap-2" onClick={() => setOpen(false)}>
                      <Link href="/dashboard" className={cn(buttonVariants({ variant: "secondary" }), "flex-1")}>
                        {t("nav.dashboard")}
                      </Link>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          logout();
                          setOpen(false);
                          router.push("/");
                        }}
                      >
                        <LogOut /> {t("nav.signOut")}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2" onClick={() => setOpen(false)}>
                      <Link href="/login" className={cn(buttonVariants({ variant: "secondary" }), "flex-1")}>
                        {t("nav.signIn")}
                      </Link>
                      <Link href="/register" className={cn(buttonVariants(), "flex-1")}>
                        {t("nav.getStarted")}
                      </Link>
                    </div>
                  )}
                </div>
              </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
          </DialogPrimitive.Root>
        </div>
      </Container>
    </header>
  );
}

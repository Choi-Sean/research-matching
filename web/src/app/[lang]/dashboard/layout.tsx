"use client";

import {
  Bookmark,
  Briefcase,
  CreditCard,
  FileText,
  FlaskConical,
  LayoutDashboard,
  Mail,
  Repeat,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useEffect, useRef, type ComponentType, type ReactNode } from "react";
import { Container } from "@/components/ui/layout";
import { Avatar, Skeleton } from "@/components/ui/surface";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { useApi } from "@/lib/hooks";
import { Link, useLocaleRouter, usePathnameNoLocale } from "@/lib/i18n/navigation";
import { useI18n } from "@/lib/i18n/provider";
import { useLabels } from "@/lib/labels";

interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  badge?: number;
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const labels = useLabels();
  const { user, loading } = useAuth();
  const router = useLocaleRouter();
  const pathname = usePathnameNoLocale();
  const invitations = useApi(user?.role === "student" ? "my-invitations" : null, () => api.myInvitations());

  useEffect(() => {
    if (!loading && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [loading, user, router, pathname]);

  // On phones the menu is a swipeable row: bring the current section into view so it is never hidden off-screen.
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const nav = navRef.current;
    const current = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !current || nav.scrollWidth <= nav.clientWidth) return;
    const n = nav.getBoundingClientRect();
    const c = current.getBoundingClientRect();
    nav.scrollBy({ left: c.left - n.left - (n.width - c.width) / 2 });
  }, [pathname, user]);

  if (!user)
    return (
      <Container className="py-12">
        <Skeleton className="h-96 w-full" />
      </Container>
    );

  const pending = invitations.data?.filter((i) => i.status === "pending").length ?? 0;
  const student: NavItem[] = [
    { href: "/dashboard", label: t("dash.nav.overview"), icon: LayoutDashboard },
    { href: "/dashboard/matches", label: t("dash.nav.matches"), icon: Sparkles },
    { href: "/dashboard/applications", label: t("dash.nav.applications"), icon: FileText },
    { href: "/dashboard/invitations", label: t("dash.nav.invitations"), icon: Mail, badge: pending },
    { href: "/dashboard/outreach", label: t("dash.nav.outreach"), icon: Repeat },
    { href: "/dashboard/saved", label: t("dash.nav.saved"), icon: Bookmark },
    { href: "/dashboard/profile", label: t("dash.nav.profile"), icon: UserRound },
    { href: "/dashboard/billing", label: t("dash.nav.billing"), icon: CreditCard },
  ];
  const professor: NavItem[] = [
    { href: "/dashboard", label: t("dash.nav.overview"), icon: LayoutDashboard },
    { href: "/dashboard/talent", label: t("dash.nav.talent"), icon: UsersRound },
    { href: "/dashboard/positions", label: t("dash.nav.positions"), icon: Briefcase },
    { href: "/dashboard/invitations", label: t("dash.nav.invitations"), icon: Mail },
    { href: "/dashboard/lab", label: t("dash.nav.lab"), icon: FlaskConical },
  ];
  const items: NavItem[] = [
    ...(user.role === "student" ? student : professor),
    { href: "/dashboard/settings", label: t("dash.nav.settings"), icon: Settings },
    ...(user.is_admin ? [{ href: "/admin", label: t("dash.nav.admin"), icon: ShieldCheck }] : []),
  ];
  const active = (href: string) => (href === "/dashboard" ? pathname === href : pathname.startsWith(href));

  return (
    <Container className="grid gap-8 py-8 lg:grid-cols-[15rem_1fr] lg:gap-12 lg:py-12">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="mb-5 hidden items-center gap-3 lg:flex">
          <Avatar name={user.full_name} size={44} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{user.full_name}</p>
            <p className="text-xs text-faint">{labels.role(user.role)}</p>
          </div>
        </div>
        <nav
          ref={navRef}
          aria-label="Dashboard"
          className="no-scrollbar -mx-5 flex gap-1.5 overflow-x-auto px-5 pb-1 max-lg:[mask-image:linear-gradient(to_right,transparent,#000_1.25rem,#000_calc(100%_-_1.75rem),transparent)] sm:-mx-8 sm:px-8 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0"
        >
          {items.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              aria-current={active(i.href) ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors pointer-coarse:py-3",
                active(i.href) ? "bg-brand-soft text-brand-text" : "text-muted hover:bg-surface-2 hover:text-ink",
              )}
            >
              <i.icon className="size-[1.05rem]" />
              {i.label}
              {i.badge ? <span className="ms-auto grid min-w-5 place-items-center rounded-full bg-brand px-1.5 py-0.5 text-[0.6875rem] font-semibold text-brand-fg">{i.badge}</span> : null}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </Container>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ClipboardList, UserCircle, Settings, Flame, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMobileSidebar } from "@/context/MobileSidebarContext";

const navItems = [
  { title: "Dashboard", href: "/staff/dashboard", icon: LayoutDashboard },
  { title: "Orders",    href: "/staff/orders",    icon: ClipboardList },
  { title: "Profile",   href: "/staff/profile",   icon: UserCircle },
  { title: "Settings",  href: "/staff/settings",  icon: Settings },
];

function NavLinks({ onLinkClick }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
      {navItems.map(({ title, href, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onLinkClick}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-orange-500 text-white"
                : "text-neutral-300 hover:bg-white/10 hover:text-white"
            )}
          >
            <Icon className="size-5 shrink-0" />
            <span className="truncate">{title}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function StaffSidebar() {
  const { mobileOpen, setMobileOpen } = useMobileSidebar();

  return (
    <>
      {/* ── Mobile overlay ───────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile slide-over ────────────────────────────────── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-neutral-900 text-white transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          <div className="flex items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-orange-500">
              <Flame className="size-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-wide">FIRE — Staff</span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="flex size-7 items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="size-4" />
          </button>
        </div>
        <NavLinks onLinkClick={() => setMobileOpen(false)} />
      </aside>

      {/* ── Desktop sidebar ──────────────────────────────────── */}
      <aside className="hidden lg:flex h-screen w-64 shrink-0 flex-col bg-neutral-900 text-white">
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-orange-500">
            <Flame className="size-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-wide">FIRE — Staff</span>
        </div>
        <NavLinks />
      </aside>
    </>
  );
}

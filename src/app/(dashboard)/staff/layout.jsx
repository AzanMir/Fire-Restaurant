"use client";

import { ToastProvider } from "@/components/ui/toast";
import { CartProvider } from "@/context/CartContext";
import { MobileSidebarProvider, useMobileSidebar } from "@/context/MobileSidebarContext";
import StaffSidebar from "@/components/layout/StaffSidebar";
import TopNavbar from "@/components/layout/TopNavbar";

function StaffLayoutInner({ children }) {
  const { toggleMobile } = useMobileSidebar();
  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      <StaffSidebar />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <TopNavbar title="Staff Dashboard" profileHref="/staff/profile" onMenuClick={toggleMobile} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function StaffLayout({ children }) {
  return (
    <ToastProvider>
      <MobileSidebarProvider>
        <CartProvider>
          <StaffLayoutInner>{children}</StaffLayoutInner>
        </CartProvider>
      </MobileSidebarProvider>
    </ToastProvider>
  );
}

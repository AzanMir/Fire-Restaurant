"use client";

import { ToastProvider } from "@/components/ui/toast";
import { CartProvider } from "@/context/CartContext";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import AdminSidebar from "@/components/layout/AdminSidebar";
import TopNavbar from "@/components/layout/TopNavbar";

function AdminLayoutInner({ children }) {
  const { toggleMobile } = useSidebar();
  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <TopNavbar title="Admin Dashboard" profileHref="/admin/profile" onMenuClick={toggleMobile} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }) {
  return (
    <ToastProvider>
      <SidebarProvider>
        <CartProvider>
          <AdminLayoutInner>{children}</AdminLayoutInner>
        </CartProvider>
      </SidebarProvider>
    </ToastProvider>
  );
}

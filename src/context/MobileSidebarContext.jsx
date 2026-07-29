"use client";

import { createContext, useContext, useState } from "react";

const MobileSidebarContext = createContext(null);

export function MobileSidebarProvider({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <MobileSidebarContext.Provider value={{ mobileOpen, setMobileOpen, toggleMobile: () => setMobileOpen((v) => !v) }}>
      {children}
    </MobileSidebarContext.Provider>
  );
}

export function useMobileSidebar() {
  const ctx = useContext(MobileSidebarContext);
  if (!ctx) throw new Error("useMobileSidebar must be inside MobileSidebarProvider");
  return ctx;
}

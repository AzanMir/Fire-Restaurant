"use client";

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <Button variant="outline" onClick={logout} className="gap-2">
      <LogOut className="size-4" />
      Logout
    </Button>
  );
}

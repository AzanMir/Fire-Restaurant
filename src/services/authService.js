import { supabase } from "@/lib/supabase";

export async function getUserRole(userId) {

    const { data, error } = await supabase

        .from("profiles")

        .select("role")

        .eq("id", userId)

        .single();

    if (error) {

        return null;

    }

    return data.role;

}
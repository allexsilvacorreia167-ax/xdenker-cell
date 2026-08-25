import { supabase } from "./supabase";

export type AdminRole = "staff" | "master";

export async function getAdminSession() {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
        .from("admin_users")
        .select("id, role")
        .eq("id", user.id)
        .maybeSingle();

    if (error || !data) return null;

    return { user, role: data.role as AdminRole };
}
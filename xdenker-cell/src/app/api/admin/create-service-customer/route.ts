import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const { email, name, phone } = await req.json();

    if (!email || !name) {
        return NextResponse.json({ error: "E-mail e nome são obrigatórios" }, { status: 400 });
    }

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Confere se o e-mail já tem conta
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const alreadyExists = existingUsers?.users?.some(
        (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!alreadyExists) {
        const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            data: { full_name: name, phone: phone ?? "" },
        });

        if (inviteError) {
            return NextResponse.json({ error: inviteError.message }, { status: 500 });
        }
    }

    return NextResponse.json({ success: true, alreadyExists });
}
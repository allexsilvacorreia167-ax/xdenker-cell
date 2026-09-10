import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const OWNER_EMAIL = "allexsilvacorreia167@gmail.com";
const RESTRICTED_PASSWORD = "Axsilva167adm";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const email = body?.email;

        if (email !== OWNER_EMAIL) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
        }

        await resend.emails.send({
            from: "XDENKER CELL <noreply@cell.xdenker.com.br>",
            to: OWNER_EMAIL,
            subject: "Senha de acesso — Área Restrita XDENKER CELL",
            html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #0f172a;">Área Restrita — XDENKER CELL</h2>
          <p>Você solicitou a senha de acesso ao <strong>Balanço Financeiro</strong> e às <strong>Configurações Avançadas</strong>.</p>
          <p style="font-size: 18px; background: #f1f5f9; padding: 12px 16px; border-radius: 8px; letter-spacing: 1px;">
            <strong>${RESTRICTED_PASSWORD}</strong>
          </p>
          <p style="color: #64748b; font-size: 13px;">
            Lembrete: a senha das áreas restritas é sempre a senha de login do admin + a palavra <strong>adm</strong>.
          </p>
          <p style="color: #94a3b8; font-size: 12px;">Se você não solicitou este e-mail, ignore-o.</p>
        </div>
      `,
        });

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Erro ao enviar e-mail" }, { status: 500 });
    }
}
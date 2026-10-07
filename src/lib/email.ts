// Aviso por e-mail via Resend (https://resend.com -- plano gratis). Sem
// RESEND_API_KEY / ALERT_EMAIL_TO configurados, nao faz nada: alerta nunca
// pode derrubar a sincronizacao que ele esta tentando proteger.
//
// Sem dominio verificado, o Resend so entrega no e-mail da propria conta
// que criou a chave (remetente onboarding@resend.dev) -- e justamente o caso
// aqui: o aviso vai pra propria Lari.
export async function sendAlertEmail(subject: string, text: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ALERT_EMAIL_TO;
  if (!apiKey || !to) {
    console.warn("Alerta nao enviado: RESEND_API_KEY/ALERT_EMAIL_TO nao configurados.");
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.ALERT_EMAIL_FROM ?? "Central de Producao <onboarding@resend.dev>",
        to: [to],
        subject,
        text,
      }),
    });
    if (!res.ok) {
      console.error("Resend recusou o e-mail:", res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("Falha ao enviar e-mail de alerta:", err);
    return false;
  }
}

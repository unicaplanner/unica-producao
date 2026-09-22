import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const FIELDS = ["printUrl", "siteUrl", "specs"] as const;
type Field = (typeof FIELDS)[number];

function isField(value: unknown): value is Field {
  return typeof value === "string" && (FIELDS as readonly string[]).includes(value);
}

// Grava um campo (PDF de impressao, link do site ou especificacoes) de um
// grupo de produto. Valor vazio limpa o campo.
export async function PUT(req: Request) {
  const { key, field, value } = await req.json();

  if (typeof key !== "string" || key.length === 0 || !isField(field) || typeof value !== "string") {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const clean = value.trim();
  const maxLength = field === "specs" ? 5000 : 1000;
  if (clean.length > maxLength) {
    return NextResponse.json({ error: "Texto muito longo." }, { status: 400 });
  }
  if (field === "siteUrl" && clean !== "" && !/^https?:\/\//i.test(clean)) {
    return NextResponse.json(
      { error: "O link do site precisa começar com http:// ou https://" },
      { status: 400 }
    );
  }

  const data = { [field]: clean === "" ? null : clean };
  const info = await prisma.productInfo.upsert({
    where: { key },
    create: { key, ...data },
    update: data,
  });

  return NextResponse.json({
    ok: true,
    info: { printUrl: info.printUrl, siteUrl: info.siteUrl, specs: info.specs },
  });
}

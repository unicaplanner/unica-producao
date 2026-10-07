import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Grava o nome de uma cliente (chave: customerId do Shopify). Nome vazio
// apaga o cadastro.
export async function PUT(req: Request) {
  const { customerId, nome } = await req.json();

  if (typeof customerId !== "string" || customerId.length === 0 || typeof nome !== "string") {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }
  const clean = nome.trim().replace(/\s+/g, " ");
  if (clean.length > 120) {
    return NextResponse.json({ error: "Nome muito longo." }, { status: 400 });
  }

  if (clean === "") {
    await prisma.customer.deleteMany({ where: { id: customerId } });
    return NextResponse.json({ ok: true, nome: null });
  }

  const customer = await prisma.customer.upsert({
    where: { id: customerId },
    create: { id: customerId, nome: clean },
    update: { nome: clean },
  });
  return NextResponse.json({ ok: true, nome: customer.nome });
}

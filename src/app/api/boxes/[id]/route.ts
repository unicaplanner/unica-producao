import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TOGGLE_FIELDS = [
  "montada",
  "finalizada",
  "notaFiscalGerada",
  "etiquetaGerada",
  "despachado",
] as const;
type ToggleField = (typeof TOGGLE_FIELDS)[number];

function isToggleField(field: string): field is ToggleField {
  return (TOGGLE_FIELDS as readonly string[]).includes(field);
}

// Alterna um item do checklist da caixa (montada, finalizada, nota fiscal,
// etiqueta, despachado). O status e da caixa, nao do pedido -- todo pedido
// agrupado na mesma caixa ve o mesmo checklist.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { field, value } = await req.json();

  if (typeof field !== "string" || !isToggleField(field) || typeof value !== "boolean") {
    return NextResponse.json({ error: "Campo ou valor inválido." }, { status: 400 });
  }

  const box = await prisma.box.update({
    where: { id },
    data: { [field]: value },
  });

  return NextResponse.json({ ok: true, box });
}

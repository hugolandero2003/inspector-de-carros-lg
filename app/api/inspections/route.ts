import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const payload = getTokenFromRequest(req);
  if (!payload) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const inspections = await prisma.inspection.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        placa: true,
        interno: true,
        tipo: true,
        marca: true,
        linea: true,
        modelo: true,
        kilometraje: true,
        ruta: true,
        conductor: true,
        licencia: true,
        inspector: true,
        fecha: true,
        hora: true,
        concepto: true,
        observaciones: true,
        checklist: true,
        createdAt: true,
        user: { select: { username: true } },
      },
    });
    return NextResponse.json(inspections);
  } catch (err) {
    console.error("GET inspections error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const payload = getTokenFromRequest(req);

  try {
    const body = await req.json();
    const {
      placa, interno, tipo, marca, linea, modelo, kilometraje, ruta,
      conductor, licencia, inspector, fecha, hora, concepto, observaciones, checklist,
    } = body;

    const inspection = await prisma.inspection.create({
      data: {
        placa, interno, tipo, marca, linea, modelo, kilometraje, ruta,
        conductor, licencia, inspector, fecha, hora, concepto, observaciones,
        checklist: typeof checklist === "string" ? checklist : JSON.stringify(checklist),
        userId: payload?.userId,
      },
    });

    return NextResponse.json(inspection, { status: 201 });
  } catch (err) {
    console.error("POST inspection error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

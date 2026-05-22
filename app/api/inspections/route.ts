import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest } from "@/lib/auth";

function normalizePlate(plate: string) {
  return plate.toUpperCase().replace(/\s+/g, "").trim();
}

function getBogotaDayRange(baseDate = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const [year, month, day] = formatter.format(baseDate).split("-").map(Number);
  const startUtc = new Date(Date.UTC(year, month - 1, day, 5, 0, 0, 0));
  const endUtc = new Date(Date.UTC(year, month - 1, day + 1, 5, 0, 0, 0));

  return { startUtc, endUtc };
}

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

    const normalizedPlate = normalizePlate(String(placa ?? ""));
    if (!normalizedPlate) {
      return NextResponse.json({ error: "La placa es obligatoria" }, { status: 400 });
    }

    const { startUtc, endUtc } = getBogotaDayRange();
    const existingToday = await prisma.inspection.findFirst({
      where: {
        placa: normalizedPlate,
        createdAt: {
          gte: startUtc,
          lt: endUtc,
        },
      },
      select: { id: true },
    });

    if (existingToday) {
      return NextResponse.json(
        {
          error: `La placa ${normalizedPlate} ya tiene una inspección registrada hoy.`,
          suggestion: "Puedes revisar el historial en el panel admin o esperar al siguiente día para un nuevo registro.",
        },
        { status: 409 },
      );
    }

    const inspection = await prisma.inspection.create({
      data: {
        placa: normalizedPlate, interno, tipo, marca, linea, modelo, kilometraje, ruta,
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

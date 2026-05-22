import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ placa: string }> }
) {
  const { placa } = await params;
  const normalizedPlate = normalizePlate(decodeURIComponent(placa));

  if (!normalizedPlate) {
    return NextResponse.json({ error: "Placa invalida" }, { status: 400 });
  }

  try {
    const { startUtc, endUtc } = getBogotaDayRange();
    const todayInspection = await prisma.inspection.findFirst({
      where: {
        placa: normalizedPlate,
        createdAt: {
          gte: startUtc,
          lt: endUtc,
        },
      },
      select: {
        id: true,
      },
    });

    const latestInspection = await prisma.inspection.findFirst({
      where: { placa: normalizedPlate },
      orderBy: { createdAt: "desc" },
      select: {
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
        checklist: true,
      },
    });

    if (!latestInspection) {
      return NextResponse.json({ error: "Sin historial para la placa" }, { status: 404 });
    }

    return NextResponse.json({
      ...latestInspection,
      alreadyRegisteredToday: Boolean(todayInspection),
    });
  } catch (err) {
    console.error("GET inspection by plate error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ placa: string }> },
) {
  const { placa } = await params;
  const normalizedPlate = normalizePlate(decodeURIComponent(placa));

  if (!normalizedPlate) {
    return NextResponse.json({ error: "Placa invalida" }, { status: 400 });
  }

  try {
    await prisma.inspection.deleteMany({
      where: { placa: normalizedPlate },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE inspection by plate error:", err);
    return NextResponse.json({ error: "No fue posible eliminar la placa" }, { status: 500 });
  }
}

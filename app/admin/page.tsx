"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

type InspectionRecord = {
  id: string;
  vehiculo: {
    placa: string;
    marca: string;
    modelo: string;
    tipo: string;
    conductor: string;
    licenciaConduccion: string;
    inspector: string;
    fechaInspeccion: string;
    horaInspeccion: string;
  };
  inspeccion: {
    conceptoFinal: string;
    observaciones: string;
    fechaRegistro: string;
    checklist: Array<{
      id: string;
      item: string;
      estado: string;
      criticidad: string;
      seccion?: string;
    }>;
  };
};

type ApiInspection = {
  id: string;
  placa: string;
  tipo: string;
  marca: string;
  modelo: string;
  conductor: string;
  licencia: string;
  inspector: string;
  fecha: string;
  hora: string;
  concepto: string;
  observaciones: string;
  checklist: string;
  createdAt: string;
};

export default function AdminPage() {
  const [records, setRecords] = useState<InspectionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<InspectionRecord | null>(null);
  const [filterPlaca, setFilterPlaca] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ username: string } | null>(null);
  const router = useRouter();
  const auth = useAuth();

  const mapApiToRecord = (entry: ApiInspection): InspectionRecord => {
    let checklistParsed: InspectionRecord["inspeccion"]["checklist"] = [];
    try {
      const parsed = JSON.parse(entry.checklist);
      checklistParsed = Array.isArray(parsed) ? parsed : [];
    } catch {
      checklistParsed = [];
    }

    return {
      id: entry.id,
      vehiculo: {
        placa: entry.placa,
        marca: entry.marca,
        modelo: entry.modelo,
        tipo: entry.tipo,
        conductor: entry.conductor,
        licenciaConduccion: entry.licencia,
        inspector: entry.inspector,
        fechaInspeccion: entry.fecha,
        horaInspeccion: entry.hora,
      },
      inspeccion: {
        conceptoFinal: entry.concepto,
        observaciones: entry.observaciones,
        fechaRegistro: entry.createdAt,
        checklist: checklistParsed,
      },
    };
  };

  const loadRecords = async (token: string) => {
    try {
      setLoading(true);
      const response = await fetch("/api/inspections", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401) {
          auth.logout();
          router.push("/login");
          return;
        }
        throw new Error("No se pudieron cargar los registros");
      }

      const data = (await response.json()) as ApiInspection[];
      setRecords(data.map(mapApiToRecord));
    } catch (error) {
      console.error("Error loading records:", error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!auth.isAuthenticated || !auth.user || !auth.token) {
      setAuthenticated(false);
      setCurrentUser(null);
      setLoading(false);
      router.push("/login");
      return;
    }

    setAuthenticated(true);
    setCurrentUser(auth.user);
    void loadRecords(auth.token);
  }, [auth.isAuthenticated, auth.user, auth.token, router]);

  const handleLogout = () => {
    auth.logout();
    router.push("/login");
  };

  const handleDeleteRecord = async (id: string) => {
    if (!auth.token) {
      router.push("/login");
      return;
    }

    if (confirm("¿Estás seguro de que quieres eliminar este registro?")) {
      try {
        const response = await fetch(`/api/inspections/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${auth.token}` },
        });

        if (!response.ok) {
          throw new Error("No fue posible eliminar el registro");
        }

        setRecords((prev) => prev.filter((r) => r.id !== id));
        setSelectedRecord(null);
      } catch (error) {
        console.error("Error deleting record:", error);
      }
    }
  };

  const today = new Date().toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });
  const fileName = `Inspecciones_PESV_${new Date().toISOString().split("T")[0]}`;

  const handleExportPDF = () => {
    if (filteredRecords.length === 0) return;
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();

    // Cabecera
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageW, 22, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("SISTEMA DE INSPECCIÓN PREOPERACIONAL PESV", pageW / 2, 10, { align: "center" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Reporte generado: ${today}   |   Total registros: ${filteredRecords.length}`, pageW / 2, 17, { align: "center" });

    // Tabla resumen
    autoTable(doc, {
      startY: 28,
      head: [["Placa", "Tipo", "Marca / Modelo", "Conductor", "Lic. Conducción", "Inspector", "Fecha", "Hora", "Concepto", "Observaciones"]],
      body: filteredRecords.map((r) => [
        r.vehiculo.placa,
        r.vehiculo.tipo ?? "-",
        `${r.vehiculo.marca} ${r.vehiculo.modelo}`,
        r.vehiculo.conductor,
        r.vehiculo.licenciaConduccion ?? "-",
        r.vehiculo.inspector,
        r.vehiculo.fechaInspeccion,
        r.vehiculo.horaInspeccion,
        r.inspeccion.conceptoFinal,
        r.inspeccion.observaciones || "-",
      ]),
      headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: "bold", fontSize: 8 },
      bodyStyles: { fontSize: 7.5, textColor: [30, 30, 30] },
      alternateRowStyles: { fillColor: [241, 245, 249] },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 18 },
        8: { fontStyle: "bold", cellWidth: 26 },
        9: { cellWidth: 45 },
      },
      didParseCell(data) {
        if (data.column.index === 8 && data.section === "body") {
          const val = String(data.cell.raw);
          data.cell.styles.textColor =
            val === "Apto" ? [5, 150, 105] : val === "No apto" ? [220, 38, 38] : [180, 120, 0];
        }
      },
      margin: { left: 8, right: 8 },
    });

    // Detalle del checklist por registro
    filteredRecords.forEach((r, idx) => {
      doc.addPage();
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageW, 18, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`INSPECCIÓN DETALLADA — Placa: ${r.vehiculo.placa}  (${idx + 1}/${filteredRecords.length})`, pageW / 2, 8, { align: "center" });
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(`Conductor: ${r.vehiculo.conductor}   Inspector: ${r.vehiculo.inspector}   Fecha: ${r.vehiculo.fechaInspeccion} ${r.vehiculo.horaInspeccion}   Concepto: ${r.inspeccion.conceptoFinal}`, pageW / 2, 14, { align: "center" });

      autoTable(doc, {
        startY: 22,
        head: [["#", "Sección", "Ítem", "Criticidad", "Estado"]],
        body: r.inspeccion.checklist.map((item, i) => [
          i + 1,
          item.seccion ?? "-",
          item.item,
          item.criticidad,
          item.estado,
        ]),
        headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: "bold", fontSize: 8 },
        bodyStyles: { fontSize: 7, textColor: [30, 30, 30] },
        alternateRowStyles: { fillColor: [241, 245, 249] },
        columnStyles: {
          0: { cellWidth: 8 },
          1: { cellWidth: 38 },
          3: { cellWidth: 22, halign: "center" },
          4: { cellWidth: 24, halign: "center", fontStyle: "bold" },
        },
        didParseCell(data) {
          if (data.column.index === 4 && data.section === "body") {
            const val = String(data.cell.raw);
            data.cell.styles.textColor =
              val === "Cumple" ? [5, 150, 105] : val === "No cumple" ? [220, 38, 38] : [100, 116, 139];
          }
        },
        margin: { left: 8, right: 8 },
      });

      if (r.inspeccion.observaciones) {
        const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 30, 30);
        doc.text("Observaciones:", 8, finalY);
        doc.setFont("helvetica", "normal");
        doc.text(r.inspeccion.observaciones, 8, finalY + 5, { maxWidth: pageW - 16 });
      }
    });

    // Pie de página en todas las páginas
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text(`Sistema PESV — Página ${p} de ${totalPages}`, pageW / 2, doc.internal.pageSize.getHeight() - 4, { align: "center" });
    }

    doc.save(`${fileName}.pdf`);
  };

  const handleExportExcel = () => {
    if (filteredRecords.length === 0) return;

    const wb = XLSX.utils.book_new();

    // --- Hoja 1: Resumen ---
    const resumenData = [
      ["SISTEMA DE INSPECCIÓN PREOPERACIONAL PESV"],
      [`Reporte generado: ${today}`],
      [],
      ["Placa", "Tipo", "Marca", "Modelo", "Conductor", "Lic. Conducción", "Inspector", "Fecha", "Hora", "Concepto", "Observaciones"],
      ...filteredRecords.map((r) => [
        r.vehiculo.placa,
        r.vehiculo.tipo ?? "-",
        r.vehiculo.marca,
        r.vehiculo.modelo,
        r.vehiculo.conductor,
        r.vehiculo.licenciaConduccion ?? "-",
        r.vehiculo.inspector,
        r.vehiculo.fechaInspeccion,
        r.vehiculo.horaInspeccion,
        r.inspeccion.conceptoFinal,
        r.inspeccion.observaciones || "-",
      ]),
    ];
    const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
    wsResumen["!cols"] = [14, 20, 14, 14, 22, 18, 22, 14, 10, 22, 40].map((w) => ({ wch: w }));
    wsResumen["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 10 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } }];
    XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen");

    // --- Hojas por registro (checklist) ---
    filteredRecords.forEach((r) => {
      const sheetName = r.vehiculo.placa.slice(0, 28); // max 31 chars
      const headerRows = [
        [`INSPECCIÓN PREOPERACIONAL — ${r.vehiculo.placa}`],
        [],
        ["Placa", r.vehiculo.placa, "", "Inspector", r.vehiculo.inspector],
        ["Tipo", r.vehiculo.tipo ?? "-", "", "Conductor", r.vehiculo.conductor],
        ["Marca", r.vehiculo.marca, "", "Lic. Conducción", r.vehiculo.licenciaConduccion ?? "-"],
        ["Modelo", r.vehiculo.modelo, "", "Fecha", r.vehiculo.fechaInspeccion],
        ["Concepto", r.inspeccion.conceptoFinal, "", "Hora", r.vehiculo.horaInspeccion],
        [],
        ["#", "Sección", "Ítem", "Criticidad", "Estado"],
        ...r.inspeccion.checklist.map((item, i) => [
          i + 1,
          item.seccion ?? "-",
          item.item,
          item.criticidad,
          item.estado,
        ]),
        [],
        ["Observaciones", r.inspeccion.observaciones || "-"],
      ];
      const ws = XLSX.utils.aoa_to_sheet(headerRows);
      ws["!cols"] = [{ wch: 6 }, { wch: 30 }, { wch: 52 }, { wch: 14 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  const filteredRecords = records.filter((r) =>
    r.vehiculo.placa.toLowerCase().includes(filterPlaca.toLowerCase())
  );

  if (!authenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-6 sm:px-6 sm:py-8">
      <main className="mx-auto w-full max-w-7xl flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white sm:text-4xl">Panel Administrativo</h1>
            <p className="mt-2 text-sm text-slate-300">
              Bienvenido, <strong>{currentUser?.username}</strong>
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => router.push("/")}
              className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 py-2.5 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
            >
              ← Nueva inspección
            </button>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20"
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 backdrop-blur-sm">
            <p className="text-sm font-semibold text-slate-400">Total de registros</p>
            <p className="mt-2 text-3xl font-bold text-white">{records.length}</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 backdrop-blur-sm">
            <p className="text-sm font-semibold text-slate-400">Aptos</p>
            <p className="mt-2 text-3xl font-bold text-emerald-400">
              {records.filter((r) => r.inspeccion.conceptoFinal === "Apto").length}
            </p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 backdrop-blur-sm">
            <p className="text-sm font-semibold text-slate-400">No aptos</p>
            <p className="mt-2 text-3xl font-bold text-rose-400">
              {records.filter((r) => r.inspeccion.conceptoFinal === "No apto").length}
            </p>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por placa..."
              value={filterPlaca}
              onChange={(e) => setFilterPlaca(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportExcel}
              disabled={filteredRecords.length === 0}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:shadow-lg disabled:cursor-not-allowed disabled:from-slate-600 disabled:to-slate-700"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8 11h8v1.5H8V11zm0 3h8v1.5H8V14zm0 3h5v1.5H8V17z"/></svg>
              Excel
            </button>
            <button
              onClick={handleExportPDF}
              disabled={filteredRecords.length === 0}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:shadow-lg disabled:cursor-not-allowed disabled:from-slate-600 disabled:to-slate-700"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM7 13h2.5v1H7v-1zm0 2h10v1H7v-1zm0 2h10v1H7v-1z"/></svg>
              PDF
            </button>
          </div>
        </div>

        {/* Records Table */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-400">Cargando registros...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-8 text-center">
            <p className="text-slate-400">
              {records.length === 0 ? "No hay registros guardados aún" : "No se encontraron registros para esa placa"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                    Placa
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                    Vehículo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                    Conductor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                    Concepto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-300">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="transition hover:bg-slate-700/30">
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-sm font-bold text-cyan-300">
                        {record.vehiculo.placa}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {record.vehiculo.marca} {record.vehiculo.modelo}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">{record.vehiculo.conductor}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${
                          record.inspeccion.conceptoFinal === "Apto"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                            : record.inspeccion.conceptoFinal === "No apto"
                              ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
                              : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                        }`}
                      >
                        {record.inspeccion.conceptoFinal}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {new Date(record.inspeccion.fechaRegistro).toLocaleDateString("es-CO")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedRecord(record)}
                        className="mr-2 inline-flex rounded border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-300 transition hover:bg-blue-500/20"
                      >
                        Ver
                      </button>
                      <button
                        onClick={() => handleDeleteRecord(record.id)}
                        className="inline-flex rounded border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Detail Modal */}
        {selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-600 bg-slate-800 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Detalles de la inspección</h2>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="rounded-lg bg-slate-700 p-2 text-slate-300 transition hover:bg-slate-600 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Vehicle Info */}
                <div>
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-300">Información del vehículo</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-slate-400">Placa</p>
                      <p className="text-sm font-semibold text-white">{selectedRecord.vehiculo.placa}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Tipo</p>
                      <p className="text-sm font-semibold text-white">{selectedRecord.vehiculo.tipo}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Marca</p>
                      <p className="text-sm font-semibold text-white">{selectedRecord.vehiculo.marca}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Modelo</p>
                      <p className="text-sm font-semibold text-white">{selectedRecord.vehiculo.modelo}</p>
                    </div>
                  </div>
                </div>

                {/* Inspector Info */}
                <div>
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-300">Información de la inspección</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-slate-400">Inspector</p>
                      <p className="text-sm font-semibold text-white">{selectedRecord.vehiculo.inspector}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Conductor</p>
                      <p className="text-sm font-semibold text-white">{selectedRecord.vehiculo.conductor}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Fecha</p>
                      <p className="text-sm font-semibold text-white">{selectedRecord.vehiculo.fechaInspeccion}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Hora</p>
                      <p className="text-sm font-semibold text-white">{selectedRecord.vehiculo.horaInspeccion}</p>
                    </div>
                  </div>
                </div>

                {/* Concept */}
                <div>
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-300">Concepto</h3>
                  <p
                    className={`inline-flex rounded-full border px-4 py-2 text-sm font-bold ${
                      selectedRecord.inspeccion.conceptoFinal === "Apto"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        : selectedRecord.inspeccion.conceptoFinal === "No apto"
                          ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                    }`}
                  >
                    {selectedRecord.inspeccion.conceptoFinal}
                  </p>
                </div>

                {/* Observations */}
                {selectedRecord.inspeccion.observaciones && (
                  <div>
                    <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-300">Observaciones</h3>
                    <div className="rounded-lg border border-slate-600 bg-slate-900/50 p-3">
                      <p className="whitespace-pre-wrap text-sm text-slate-300">{selectedRecord.inspeccion.observaciones}</p>
                    </div>
                  </div>
                )}

                {/* Checklist */}
                <div>
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-300">Resultados del checklist</h3>
                  <div className="space-y-2">
                    {selectedRecord.inspeccion.checklist.map((item) => (
                      <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/30 p-3 text-sm">
                        <div>
                          <p className="text-slate-300">{item.item}</p>
                          <p className="text-xs text-slate-500">{item.seccion}</p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                            item.estado === "Cumple"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : item.estado === "No cumple"
                                ? "bg-rose-500/20 text-rose-300"
                                : "bg-slate-500/20 text-slate-300"
                          }`}
                        >
                          {item.estado}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Close Button */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const single = [selectedRecord];
                      const tmp = filteredRecords;
                      // exportar solo ese registro en PDF
                      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
                      const pageW = doc.internal.pageSize.getWidth();
                      const r = selectedRecord;
                      doc.setFillColor(15, 23, 42);
                      doc.rect(0, 0, pageW, 18, "F");
                      doc.setTextColor(255, 255, 255);
                      doc.setFontSize(11);
                      doc.setFont("helvetica", "bold");
                      doc.text(`INSPECCIÓN DETALLADA — Placa: ${r.vehiculo.placa}`, pageW / 2, 8, { align: "center" });
                      doc.setFontSize(8);
                      doc.setFont("helvetica", "normal");
                      doc.text(`Conductor: ${r.vehiculo.conductor}   Inspector: ${r.vehiculo.inspector}   Fecha: ${r.vehiculo.fechaInspeccion} ${r.vehiculo.horaInspeccion}   Concepto: ${r.inspeccion.conceptoFinal}`, pageW / 2, 14, { align: "center" });
                      autoTable(doc, {
                        startY: 22,
                        head: [["#", "Sección", "Ítem", "Criticidad", "Estado"]],
                        body: r.inspeccion.checklist.map((item, i) => [i + 1, item.seccion ?? "-", item.item, item.criticidad, item.estado]),
                        headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: "bold", fontSize: 8 },
                        bodyStyles: { fontSize: 7, textColor: [30, 30, 30] },
                        alternateRowStyles: { fillColor: [241, 245, 249] },
                        columnStyles: { 0: { cellWidth: 8 }, 1: { cellWidth: 38 }, 3: { cellWidth: 22, halign: "center" }, 4: { cellWidth: 24, halign: "center", fontStyle: "bold" } },
                        didParseCell(data) {
                          if (data.column.index === 4 && data.section === "body") {
                            const val = String(data.cell.raw);
                            data.cell.styles.textColor = val === "Cumple" ? [5, 150, 105] : val === "No cumple" ? [220, 38, 38] : [100, 116, 139];
                          }
                        },
                        margin: { left: 8, right: 8 },
                      });
                      if (r.inspeccion.observaciones) {
                        const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;
                        doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(30, 30, 30);
                        doc.text("Observaciones:", 8, finalY);
                        doc.setFont("helvetica", "normal");
                        doc.text(r.inspeccion.observaciones, 8, finalY + 5, { maxWidth: pageW - 16 });
                      }
                      doc.save(`Inspeccion_${r.vehiculo.placa}_${r.vehiculo.fechaInspeccion}.pdf`);
                      void single; void tmp;
                    }}
                    className="flex-1 rounded-lg bg-gradient-to-r from-rose-700 to-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:shadow-lg"
                  >
                    Descargar PDF
                  </button>
                  <button
                    onClick={() => setSelectedRecord(null)}
                    className="flex-1 rounded-lg bg-gradient-to-r from-slate-700 to-slate-600 px-4 py-3 text-sm font-semibold text-white transition hover:shadow-lg"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

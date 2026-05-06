"use client";

import { FormEvent, useMemo, useState } from "react";

type VehicleRegistration = {
  placa: string;
  interno: string;
  tipo: string;
  marca: string;
  linea: string;
  modelo: string;
  kilometraje: string;
  sede: string;
  ruta: string;
  conductor: string;
  licenciaConduccion: string;
  inspector: string;
  fechaInspeccion: string;
  horaInspeccion: string;
};

type Compliance = "Cumple" | "No cumple" | "No aplica";
type Concepto = "Apto" | "Apto con observaciones" | "No apto";

type ChecklistItem = {
  id: string;
  section: string;
  label: string;
  critical: boolean;
};

const checklistItems: ChecklistItem[] = [
  {
    id: "doc_soat",
    section: "Documentacion",
    label: "SOAT vigente y legible",
    critical: true,
  },
  {
    id: "doc_tecno",
    section: "Documentacion",
    label: "Revision tecnomecanica vigente",
    critical: true,
  },
  {
    id: "doc_licencia",
    section: "Documentacion",
    label: "Licencia de conduccion vigente",
    critical: true,
  },
  {
    id: "seg_extintor",
    section: "Seguridad activa y pasiva",
    label: "Extintor vigente y con manometro en rango",
    critical: true,
  },
  {
    id: "seg_botiquin",
    section: "Seguridad activa y pasiva",
    label: "Botiquin completo",
    critical: false,
  },
  {
    id: "seg_cinturones",
    section: "Seguridad activa y pasiva",
    label: "Cinturones de seguridad funcionales",
    critical: true,
  },
  {
    id: "mec_frenos",
    section: "Condiciones tecnico-mecanicas",
    label: "Sistema de frenos sin novedad",
    critical: true,
  },
  {
    id: "mec_direccion",
    section: "Condiciones tecnico-mecanicas",
    label: "Direccion estable y sin holguras",
    critical: true,
  },
  {
    id: "mec_llantas",
    section: "Condiciones tecnico-mecanicas",
    label: "Llantas en buen estado y labrado suficiente",
    critical: true,
  },
  {
    id: "mec_luces",
    section: "Condiciones tecnico-mecanicas",
    label: "Luces delanteras, traseras y direccionales operativas",
    critical: true,
  },
  {
    id: "mec_espejos",
    section: "Condiciones tecnico-mecanicas",
    label: "Espejos y parabrisas en buen estado",
    critical: false,
  },
  {
    id: "mec_fluidos",
    section: "Condiciones tecnico-mecanicas",
    label: "Sin fugas de aceite, combustible o refrigerante",
    critical: true,
  },
  {
    id: "eq_herramienta",
    section: "Equipo de carretera",
    label: "Gato, cruceta y llanta de repuesto disponibles",
    critical: false,
  },
  {
    id: "eq_senales",
    section: "Equipo de carretera",
    label: "Dos senales de carretera (conos o triangulos)",
    critical: false,
  },
  {
    id: "eq_linterna",
    section: "Equipo de carretera",
    label: "Linterna y chaleco reflectivo",
    critical: false,
  },
];

const groupedChecklist = checklistItems.reduce<Record<string, ChecklistItem[]>>((acc, item) => {
  if (!acc[item.section]) {
    acc[item.section] = [];
  }
  acc[item.section].push(item);
  return acc;
}, {});

const initialVehicle: VehicleRegistration = {
  placa: "",
  interno: "",
  tipo: "",
  marca: "",
  linea: "",
  modelo: "",
  kilometraje: "",
  sede: "",
  ruta: "",
  conductor: "",
  licenciaConduccion: "",
  inspector: "",
  fechaInspeccion: "",
  horaInspeccion: "",
};

const requiredVehicleFields: Array<keyof VehicleRegistration> = [
  "placa",
  "tipo",
  "marca",
  "modelo",
  "kilometraje",
  "conductor",
  "licenciaConduccion",
  "inspector",
  "fechaInspeccion",
  "horaInspeccion",
];

const initialChecklistState: Record<string, Compliance> = checklistItems.reduce(
  (acc, item) => {
    acc[item.id] = "Cumple";
    return acc;
  },
  {} as Record<string, Compliance>,
);

export default function Home() {
  const [vehicleDraft, setVehicleDraft] = useState<VehicleRegistration>(initialVehicle);
  const [registeredVehicle, setRegisteredVehicle] = useState<VehicleRegistration | null>(null);
  const [checklistState, setChecklistState] =
    useState<Record<string, Compliance>>(initialChecklistState);
  const [observaciones, setObservaciones] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    concepto: Concepto;
    payload: string;
    noCumpleCriticos: string[];
  } | null>(null);

  const missingVehicleFields = useMemo(
    () => requiredVehicleFields.filter((field) => !vehicleDraft[field].trim()),
    [vehicleDraft],
  );

  const findings = useMemo(() => {
    const noCumpleCriticos = checklistItems
      .filter((item) => item.critical && checklistState[item.id] === "No cumple")
      .map((item) => item.label);

    const noCumpleNoCriticos = checklistItems
      .filter((item) => !item.critical && checklistState[item.id] === "No cumple")
      .map((item) => item.label);

    return {
      noCumpleCriticos,
      noCumpleNoCriticos,
      hasAnyNoCumple: noCumpleCriticos.length > 0 || noCumpleNoCriticos.length > 0,
    };
  }, [checklistState]);

  const conceptoSugerido: Concepto = useMemo(() => {
    if (findings.noCumpleCriticos.length > 0) {
      return "No apto";
    }
    if (findings.noCumpleNoCriticos.length > 0) {
      return "Apto con observaciones";
    }
    return "Apto";
  }, [findings.noCumpleCriticos.length, findings.noCumpleNoCriticos.length]);

  const handleRegisterVehicle = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setResult(null);

    if (missingVehicleFields.length > 0) {
      setError("Completa los campos obligatorios del encabezado para registrar el vehiculo.");
      return;
    }

    setRegisteredVehicle({
      ...vehicleDraft,
      placa: vehicleDraft.placa.toUpperCase().replace(/\s+/g, ""),
    });
  };

  const handleSubmitInspection = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!registeredVehicle) {
      setError("Primero debes registrar el vehiculo en el encabezado.");
      return;
    }

    if (findings.hasAnyNoCumple && !observaciones.trim()) {
      setError("Debes diligenciar observaciones cuando exista al menos un item en 'No cumple'.");
      return;
    }

    const payload = {
      vehiculo: registeredVehicle,
      inspeccion: {
        checklist: checklistItems.map((item) => ({
          id: item.id,
          item: item.label,
          seccion: item.section,
          criticidad: item.critical ? "Critico" : "No critico",
          estado: checklistState[item.id],
        })),
        observaciones,
        conceptoFinal: conceptoSugerido,
        fechaRegistro: new Date().toISOString(),
      },
    };

    setResult({
      concepto: conceptoSugerido,
      payload: JSON.stringify(payload, null, 2),
      noCumpleCriticos: findings.noCumpleCriticos,
    });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#fef3c7_0%,_#f8fafc_48%,_#ffffff_100%)] px-4 py-8 sm:px-8">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-[0_16px_40px_-24px_rgba(120,53,15,0.55)]">
          <div className="bg-amber-700 px-6 py-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.2em]">
              Inspeccion preoperacional PESV
            </p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Encabezado de registro del vehiculo</h1>
            <p className="mt-2 text-sm text-amber-100">
              Este registro se diligencia antes del checklist para asociar cada inspeccion a un carro y
              una placa.
            </p>
          </div>

          <form className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4" onSubmit={handleRegisterVehicle}>
            <Field
              label="Placa *"
              value={vehicleDraft.placa}
              placeholder="ABC123"
              onChange={(value) => setVehicleDraft((prev) => ({ ...prev, placa: value }))}
            />
            <Field
              label="Interno"
              value={vehicleDraft.interno}
              placeholder="Movil 12"
              onChange={(value) => setVehicleDraft((prev) => ({ ...prev, interno: value }))}
            />
            <Field
              label="Tipo de vehiculo *"
              value={vehicleDraft.tipo}
              placeholder="Camioneta"
              onChange={(value) => setVehicleDraft((prev) => ({ ...prev, tipo: value }))}
            />
            <Field
              label="Marca *"
              value={vehicleDraft.marca}
              placeholder="Renault"
              onChange={(value) => setVehicleDraft((prev) => ({ ...prev, marca: value }))}
            />
            <Field
              label="Linea"
              value={vehicleDraft.linea}
              placeholder="Duster"
              onChange={(value) => setVehicleDraft((prev) => ({ ...prev, linea: value }))}
            />
            <Field
              label="Modelo *"
              value={vehicleDraft.modelo}
              placeholder="2023"
              onChange={(value) => setVehicleDraft((prev) => ({ ...prev, modelo: value }))}
            />
            <Field
              label="Kilometraje *"
              value={vehicleDraft.kilometraje}
              placeholder="63800"
              onChange={(value) => setVehicleDraft((prev) => ({ ...prev, kilometraje: value }))}
            />
            <Field
              label="Sede"
              value={vehicleDraft.sede}
              placeholder="Bogota"
              onChange={(value) => setVehicleDraft((prev) => ({ ...prev, sede: value }))}
            />
            <Field
              label="Ruta"
              value={vehicleDraft.ruta}
              placeholder="Bodega - Cliente"
              onChange={(value) => setVehicleDraft((prev) => ({ ...prev, ruta: value }))}
            />
            <Field
              label="Conductor *"
              value={vehicleDraft.conductor}
              placeholder="Nombre completo"
              onChange={(value) => setVehicleDraft((prev) => ({ ...prev, conductor: value }))}
            />
            <Field
              label="Licencia de conduccion *"
              value={vehicleDraft.licenciaConduccion}
              placeholder="12345678"
              onChange={(value) => setVehicleDraft((prev) => ({ ...prev, licenciaConduccion: value }))}
            />
            <Field
              label="Inspector responsable *"
              value={vehicleDraft.inspector}
              placeholder="Inspector PESV"
              onChange={(value) => setVehicleDraft((prev) => ({ ...prev, inspector: value }))}
            />
            <DateField
              label="Fecha de inspeccion *"
              value={vehicleDraft.fechaInspeccion}
              onChange={(value) => setVehicleDraft((prev) => ({ ...prev, fechaInspeccion: value }))}
            />
            <TimeField
              label="Hora de inspeccion *"
              value={vehicleDraft.horaInspeccion}
              onChange={(value) => setVehicleDraft((prev) => ({ ...prev, horaInspeccion: value }))}
            />

            <div className="flex flex-wrap items-center gap-3 pt-2 sm:col-span-2 lg:col-span-4">
              <button
                type="submit"
                className="h-11 rounded-lg bg-amber-700 px-5 text-sm font-semibold text-white transition hover:bg-amber-800"
              >
                Registrar encabezado
              </button>
              {registeredVehicle ? (
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
                  Vehiculo activo: {registeredVehicle.placa} - {registeredVehicle.marca} {registeredVehicle.modelo}
                </p>
              ) : (
                <p className="text-sm text-slate-600">
                  Debes registrar el encabezado para habilitar la inspeccion.
                </p>
              )}
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900">Checklist de requisitos PESV</h2>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                registeredVehicle ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
              }`}
            >
              {registeredVehicle ? "Habilitado" : "Bloqueado hasta registrar encabezado"}
            </span>
          </div>

          <form className="space-y-6" onSubmit={handleSubmitInspection}>
            {Object.entries(groupedChecklist).map(([sectionName, items]) => (
              <section key={sectionName} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-700">
                  {sectionName}
                </h3>

                <div className="space-y-3">
                  {items.map((item) => (
                    <ChecklistRow
                      key={item.id}
                      item={item}
                      value={checklistState[item.id]}
                      disabled={!registeredVehicle}
                      onChange={(nextValue) =>
                        setChecklistState((prev) => ({
                          ...prev,
                          [item.id]: nextValue,
                        }))
                      }
                    />
                  ))}
                </div>
              </section>
            ))}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Observaciones (obligatorio si hay No cumple)
                </label>
                <textarea
                  rows={4}
                  value={observaciones}
                  onChange={(event) => setObservaciones(event.target.value)}
                  disabled={!registeredVehicle}
                  placeholder="Registrar hallazgos, acciones correctivas y responsable."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-amber-300 transition focus:border-amber-500 focus:ring disabled:bg-slate-100"
                />
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-700">Concepto sugerido por el sistema</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{conceptoSugerido}</p>
                <p className="mt-3 text-xs text-slate-600">
                  Regla: cualquier no conformidad critica marca No apto. Si solo hay no conformidades
                  no criticas, el concepto es Apto con observaciones.
                </p>
              </div>
            </div>

            {error ? <p className="text-sm font-semibold text-rose-700">{error}</p> : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={!registeredVehicle}
                className="h-11 rounded-lg bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                Guardar inspeccion (frontend)
              </button>
              <button
                type="button"
                onClick={() => {
                  setChecklistState(initialChecklistState);
                  setObservaciones("");
                  setResult(null);
                  setError("");
                }}
                className="h-11 rounded-lg border border-slate-300 px-6 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Restablecer checklist
              </button>
            </div>
          </form>
        </section>

        {result ? (
          <section className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-slate-100 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-amber-300">
              Registro generado para persistencia
            </h3>
            <p className="mt-2 text-sm">
              Concepto final: <strong>{result.concepto}</strong>
            </p>

            {result.noCumpleCriticos.length > 0 ? (
              <div className="mt-3 rounded-lg border border-rose-800 bg-rose-950/40 p-3">
                <p className="text-sm font-semibold text-rose-200">Hallazgos criticos:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-rose-100">
                  {result.noCumpleCriticos.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <pre className="mt-4 max-h-96 overflow-auto rounded-lg bg-black/30 p-3 text-xs leading-5">
              {result.payload}
            </pre>
          </section>
        ) : null}
      </main>
    </div>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

function Field({ label, value, onChange, placeholder }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 rounded-lg border border-slate-300 px-3 text-sm outline-none ring-amber-300 transition focus:border-amber-500 focus:ring"
      />
    </div>
  );
}

type DateFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function DateField({ label, value, onChange }: DateFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-lg border border-slate-300 px-3 text-sm outline-none ring-amber-300 transition focus:border-amber-500 focus:ring"
      />
    </div>
  );
}

type TimeFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function TimeField({ label, value, onChange }: TimeFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      <input
        type="time"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-lg border border-slate-300 px-3 text-sm outline-none ring-amber-300 transition focus:border-amber-500 focus:ring"
      />
    </div>
  );
}

type ChecklistRowProps = {
  item: ChecklistItem;
  value: Compliance;
  disabled?: boolean;
  onChange: (value: Compliance) => void;
};

function ChecklistRow({ item, value, disabled, onChange }: ChecklistRowProps) {
  const options: Compliance[] = ["Cumple", "No cumple", "No aplica"];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="mb-2 flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-800">{item.label}</p>
        <span
          className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${
            item.critical ? "bg-rose-100 text-rose-700" : "bg-slate-200 text-slate-700"
          }`}
        >
          {item.critical ? "Critico" : "No critico"}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value === option;
          return (
            <button
              key={option}
              type="button"
              disabled={disabled}
              onClick={() => onChange(option)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                selected
                  ? "border-amber-600 bg-amber-100 text-amber-900"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

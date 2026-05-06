"use client";

import { FormEvent, useRef, useMemo, useState } from "react";

type VehicleRegistration = {
  placa: string;
  interno: string;
  tipo: string;
  marca: string;
  linea: string;
  modelo: string;
  kilometraje: string;
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

const TIPOS_VEHICULO: string[] = [
  "Turbo furgon seco",
  "Turbo furgon refrigerado",
  "Turbo estacado",
  "Turbo cisterna",
  "Turbo tanque",
  "Turbo volqueta",
  "Camion sencillo seco",
  "Camion sencillo refrigerado",
  "Camion sencillo estacado",
  "Camion sencillo cisterna",
  "Camion sencillo tanque",
  "Camion sencillo volqueta",
  "Doble troque seco",
  "Doble troque refrigerado",
  "Doble troque estacado",
  "Doble troque cisterna",
  "Doble troque volqueta",
  "Tractocamion (tracto)",
  "Mula seca",
  "Mula refrigerada",
  "Mula estacada",
  "Mula cisterna",
  "Mula tanque",
  "Minimula seca",
  "Minimula refrigerada",
  "Minimula estacada",
  "Trailer seco",
  "Trailer refrigerado",
  "Trailer estacado",
  "Camioneta furgon seco",
  "Camioneta furgon refrigerado",
  "Camioneta estacada",
  "Camioneta pick-up",
  "Automovil",
  "Microbus",
  "Bus",
  "Buseta",
];

const MARCAS_VEHICULO: string[] = [
  "International",
  "Freightliner",
  "Kenworth",
  "Peterbilt",
  "Volvo",
  "Scania",
  "Mercedes-Benz",
  "MAN",
  "DAF",
  "Mack",
  "Western Star",
  "Hino",
  "Isuzu",
  "Mitsubishi Fuso",
  "Foton",
  "Dongfeng",
  "Sinotruk",
  "FAW",
  "JAC",
  "DFSK",
  "Chevrolet",
  "Ford",
  "Renault",
  "Volkswagen",
  "Toyota",
  "Hyundai",
  "Kia",
  "Nissan",
  "Mazda",
  "Ram",
];

const LINEAS_POR_MARCA: Record<string, string[]> = {
  international: ["LT", "LoneStar", "RH", "MV", "CV"],
  freightliner: ["Cascadia", "Columbia", "Century", "M2", "FL"],
  kenworth: ["T680", "T660", "T800", "T370", "W900"],
  peterbilt: ["389", "579", "567", "348"],
  volvo: ["FH", "FM", "FMX", "VM", "VNL"],
  scania: ["R Series", "S Series", "G Series", "P Series"],
  "mercedes-benz": ["Actros", "Axor", "Atego", "Accelo"],
  man: ["TGX", "TGS", "TGM"],
  daf: ["XF", "CF", "LF"],
  mack: ["Anthem", "Granite", "Pinnacle"],
  "western star": ["4700", "4900"],
  hino: ["300", "500", "700"],
  isuzu: ["ELF", "FVR", "FRR"],
  "mitsubishi fuso": ["Canter", "Fighter"],
  foton: ["Auman", "Aumark", "Forland"],
  dongfeng: ["DFL", "KL"],
  sinotruk: ["Howo", "Sitrak"],
  faw: ["J6P", "Tiger V"],
  jac: ["N Series", "Sunray"],
  dfsk: ["C31", "C35", "K01S"],
  chevrolet: ["NHR", "NQR", "NPR", "Silverado", "S10"],
  ford: ["Cargo", "F-4000", "F-350", "Ranger"],
  renault: ["D", "C", "T", "Kangoo"],
  volkswagen: ["Delivery", "Constellation", "Meteor", "Amarok"],
  toyota: ["Hilux", "Land Cruiser"],
  hyundai: ["HD65", "HD78", "Mighty"],
  kia: ["K2700", "K3000"],
  nissan: ["Frontier", "NP300"],
  mazda: ["BT-50"],
  ram: ["700", "1200", "1500"],
};

function normalizeBrand(brand: string) {
  return brand.trim().toLowerCase();
}

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

const sectionMeta: Record<string, { icon: string; gradient: string; border: string; light: string; textLight: string }> = {
  Documentacion: {
    icon: "📋",
    gradient: "from-blue-700 to-blue-900",
    border: "border-blue-500/50",
    light: "bg-blue-950/50",
    textLight: "text-blue-300",
  },
  "Seguridad activa y pasiva": {
    icon: "🛡️",
    gradient: "from-rose-700 to-rose-900",
    border: "border-rose-500/50",
    light: "bg-rose-950/50",
    textLight: "text-rose-300",
  },
  "Condiciones tecnico-mecanicas": {
    icon: "⚙️",
    gradient: "from-violet-700 to-violet-900",
    border: "border-violet-500/50",
    light: "bg-violet-950/50",
    textLight: "text-violet-300",
  },
  "Equipo de carretera": {
    icon: "🧰",
    gradient: "from-teal-700 to-teal-900",
    border: "border-teal-500/50",
    light: "bg-teal-950/50",
    textLight: "text-teal-300",
  },
};

const initialVehicle: VehicleRegistration = {
  placa: "",
  interno: "",
  tipo: "",
  marca: "",
  linea: "",
  modelo: "",
  kilometraje: "",
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
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    Object.keys(groupedChecklist).reduce((acc, key) => ({ ...acc, [key]: true }), {}),
  );
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

  const lineasDisponibles = useMemo(() => {
    const key = normalizeBrand(vehicleDraft.marca);
    return LINEAS_POR_MARCA[key] ?? [];
  }, [vehicleDraft.marca]);

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

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleNuevoRegistro = () => {
    setVehicleDraft(initialVehicle);
    setRegisteredVehicle(null);
    setChecklistState(initialChecklistState);
    setObservaciones("");
    setError("");
    setResult(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
    <div className="min-h-screen bg-[#0b0e14] px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 sm:gap-6">
        <section className="relative overflow-visible rounded-xl border border-zinc-700 bg-[#13161f] shadow-[0_16px_40px_-24px_rgba(0,0,0,0.9)] sm:rounded-2xl">
          <div className="border-b border-zinc-700 bg-gradient-to-r from-zinc-800 to-zinc-900 px-4 py-4 text-white sm:px-6 sm:py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em]">
              Inspeccion preoperacional PESV
            </p>
            <div className="mt-1 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <h1 className="text-xl font-bold sm:text-2xl lg:text-3xl">Encabezado de registro del vehiculo</h1>
              <button
                type="button"
                onClick={handleNuevoRegistro}
                className="h-11 w-full rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 text-sm font-semibold text-cyan-300 backdrop-blur-sm transition hover:bg-cyan-500/20 sm:h-auto sm:w-auto sm:py-2"
              >
                + Nuevo registro
              </button>
            </div>
            <p className="mt-2 text-sm text-zinc-400">
              Este registro se diligencia antes del checklist para asociar cada inspeccion a un carro y
              una placa.
            </p>
          </div>

          <form className="grid gap-3 p-4 sm:grid-cols-2 sm:gap-4 sm:p-6 lg:grid-cols-4" onSubmit={handleRegisterVehicle}>
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
            <ComboField
              label="Tipo de vehiculo *"
              value={vehicleDraft.tipo}
              placeholder="Busca o escribe el tipo..."
              options={TIPOS_VEHICULO}
              onChange={(value) => setVehicleDraft((prev) => ({ ...prev, tipo: value }))}
            />
            <ComboField
              label="Marca *"
              value={vehicleDraft.marca}
              placeholder="Busca o escribe la marca..."
              options={MARCAS_VEHICULO}
              onChange={(value) => setVehicleDraft((prev) => ({ ...prev, marca: value }))}
            />
            <ComboField
              label="Linea"
              value={vehicleDraft.linea}
              placeholder={
                vehicleDraft.marca.trim()
                  ? "Selecciona o escribe una linea..."
                  : "Primero selecciona una marca"
              }
              options={lineasDisponibles}
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

            <div className="flex flex-col gap-3 pt-2 sm:col-span-2 sm:flex-row sm:flex-wrap sm:items-center lg:col-span-4">
              <button
                type="submit"
                className="h-11 w-full rounded-lg bg-cyan-600 px-5 text-sm font-semibold text-white transition hover:bg-cyan-500 sm:w-auto"
              >
                Registrar encabezado
              </button>
              {registeredVehicle ? (
                <p className="rounded-lg border border-emerald-700 bg-emerald-950/50 px-3 py-2 text-sm font-medium text-emerald-300">
                  Vehiculo activo: {registeredVehicle.placa} - {registeredVehicle.marca} {registeredVehicle.modelo}
                </p>
              ) : (
                <p className="text-sm text-zinc-500">
                  Debes registrar el encabezado para habilitar la inspeccion.
                </p>
              )}
            </div>
          </form>
        </section>

        <section className="rounded-xl border border-zinc-700 bg-[#13161f] p-4 shadow-sm sm:rounded-2xl sm:p-6">
          <div className="mb-4 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <h2 className="text-lg font-bold text-zinc-100 sm:text-xl">Checklist de requisitos PESV</h2>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                registeredVehicle ? "bg-emerald-900/60 text-emerald-300" : "bg-rose-900/60 text-rose-300"
              }`}
            >
              {registeredVehicle ? "Habilitado" : "Bloqueado hasta registrar encabezado"}
            </span>
          </div>

          <form className="space-y-4" onSubmit={handleSubmitInspection}>
            {Object.entries(groupedChecklist).map(([sectionName, items]) => {
              const criticalIssues = items.filter(
                (item) => item.critical && checklistState[item.id] === "No cumple",
              ).length;
              const minorIssues = items.filter(
                (item) => !item.critical && checklistState[item.id] === "No cumple",
              ).length;
              const noAplicaCount = items.filter(
                (item) => checklistState[item.id] === "No aplica",
              ).length;
              return (
                <AccordionSection
                  key={sectionName}
                  name={sectionName}
                  items={items}
                  isOpen={openSections[sectionName] ?? true}
                  criticalIssues={criticalIssues}
                  minorIssues={minorIssues}
                  noAplicaCount={noAplicaCount}
                  onToggle={() => toggleSection(sectionName)}
                  checklistState={checklistState}
                  disabled={!registeredVehicle}
                  onItemChange={(id, value) =>
                    setChecklistState((prev) => ({ ...prev, [id]: value }))
                  }
                />
              );
            })}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-zinc-300">
                  Observaciones (obligatorio si hay No cumple)
                </label>
                <textarea
                  rows={4}
                  value={observaciones}
                  onChange={(event) => setObservaciones(event.target.value)}
                  disabled={!registeredVehicle}
                  placeholder="Registrar hallazgos, acciones correctivas y responsable."
                  className="w-full rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none ring-cyan-500/30 transition focus:border-cyan-500 focus:ring disabled:opacity-50"
                />
              </div>

              <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4">
                <p className="text-sm font-semibold text-zinc-400">Concepto sugerido por el sistema</p>
                <p className="mt-2 text-2xl font-bold text-zinc-100">{conceptoSugerido}</p>
                <p className="mt-3 text-xs text-zinc-500">
                  Regla: cualquier no conformidad critica marca No apto. Si solo hay no conformidades
                  no criticas, el concepto es Apto con observaciones.
                </p>
                <p className="mt-2 text-xs text-amber-300">
                  Si presenta alguna falla, comunicarse con su desarrollador.
                </p>
              </div>
            </div>

            {error ? <p className="text-sm font-semibold text-rose-400">{error}</p> : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="submit"
                disabled={!registeredVehicle}
                className="h-11 w-full rounded-lg bg-cyan-600 px-6 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-500 sm:w-auto"
              >
                Guardar inspeccion
              </button>
              <button
                type="button"
                onClick={() => {
                  setChecklistState(initialChecklistState);
                  setObservaciones("");
                  setResult(null);
                  setError("");
                }}
                className="h-11 w-full rounded-lg border border-zinc-600 bg-zinc-800 px-6 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-700 sm:w-auto"
              >
                Restablecer checklist
              </button>
              <button
                type="button"
                onClick={handleNuevoRegistro}
                className="h-11 w-full rounded-lg border border-violet-500/50 bg-violet-900/30 px-6 text-sm font-semibold text-violet-300 transition hover:bg-violet-900/50 sm:w-auto"
              >
                + Nuevo registro
              </button>
            </div>
          </form>
        </section>

        {result ? (
          <section className="rounded-xl border border-zinc-700 bg-[#0b0e14] p-4 text-zinc-100 shadow-sm sm:rounded-2xl sm:p-5">
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-cyan-400">
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

type ComboFieldProps = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
};

function ComboField({ label, value, options, onChange, placeholder }: ComboFieldProps) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [value, options]);

  const handleBlur = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  };

  const handleSelect = (option: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    onChange(option);
    setOpen(false);
  };

  return (
    <div className="relative z-20 flex min-w-0 flex-col gap-1">
      <label className="text-sm font-semibold text-zinc-300">{label}</label>
      <div className="relative">
        <input
          value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          autoComplete="off"
          className="h-11 w-full rounded-lg border border-zinc-600 bg-zinc-800 px-3 pr-9 text-sm text-zinc-100 placeholder-zinc-500 outline-none ring-cyan-500/30 transition focus:border-cyan-500 focus:ring"
        />
        <svg
          className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {open && filtered.length > 0 && (
        <ul className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-56 overflow-y-auto rounded-xl border border-zinc-600 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.8)] backdrop-blur-sm" style={{ background: "#1a1d27" }}>
          {filtered.map((option) => (
            <li key={option}>
              <button
                type="button"
                onMouseDown={() => handleSelect(option)}
                className={`flex w-full items-center px-4 py-2.5 text-left text-sm transition-colors hover:bg-cyan-500/10 hover:text-cyan-300 ${
                  value === option ? "bg-cyan-900/40 text-cyan-300 font-semibold" : "text-zinc-200"
                }`}
              >
                {value === option && (
                  <svg className="mr-2 h-3.5 w-3.5 shrink-0 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {option}
              </button>
            </li>
          ))}
        </ul>
      )}
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
    <div className="min-w-0 flex flex-col gap-1">
      <label className="text-sm font-semibold text-zinc-300">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 rounded-lg border border-zinc-600 bg-zinc-800 px-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none ring-cyan-500/30 transition focus:border-cyan-500 focus:ring"
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
    <div className="min-w-0 flex flex-col gap-1">
      <label className="text-sm font-semibold text-zinc-300">{label}</label>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-lg border border-zinc-600 bg-zinc-800 px-3 text-sm text-zinc-100 outline-none ring-cyan-500/30 transition focus:border-cyan-500 focus:ring"
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
    <div className="min-w-0 flex flex-col gap-1">
      <label className="text-sm font-semibold text-zinc-300">{label}</label>
      <input
        type="time"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-lg border border-zinc-600 bg-zinc-800 px-3 text-sm text-zinc-100 outline-none ring-cyan-500/30 transition focus:border-cyan-500 focus:ring"
      />
    </div>
  );
}

type AccordionSectionProps = {
  name: string;
  items: ChecklistItem[];
  isOpen: boolean;
  criticalIssues: number;
  minorIssues: number;
  noAplicaCount: number;
  onToggle: () => void;
  checklistState: Record<string, Compliance>;
  disabled: boolean;
  onItemChange: (id: string, value: Compliance) => void;
};

function AccordionSection({
  name,
  items,
  isOpen,
  criticalIssues,
  minorIssues,
  noAplicaCount,
  onToggle,
  checklistState,
  disabled,
  onItemChange,
}: AccordionSectionProps) {
  const meta = sectionMeta[name] ?? {
    icon: "📌",
    gradient: "from-zinc-600 to-zinc-700",
    border: "border-zinc-600",
    light: "bg-zinc-800/60",
    textLight: "text-zinc-300",
  };

  const statusLabel =
    criticalIssues > 0
      ? `${criticalIssues} critico${criticalIssues > 1 ? "s" : ""}`
      : minorIssues > 0
        ? `${minorIssues} observacion${minorIssues > 1 ? "es" : ""}`
        : noAplicaCount > 0
          ? `${noAplicaCount} no aplica`
        : "OK";

  const statusStyle =
    criticalIssues > 0
      ? "border-rose-700 bg-rose-950/60 text-rose-300"
      : minorIssues > 0
        ? "border-amber-700 bg-amber-950/60 text-amber-300"
        : noAplicaCount > 0
          ? "border-sky-700 bg-sky-950/60 text-sky-300"
        : "border-emerald-700 bg-emerald-950/60 text-emerald-300";

  return (
    <div
      className={`overflow-hidden rounded-xl border-2 shadow-sm transition-shadow hover:shadow-md sm:rounded-2xl ${
        isOpen ? `${meta.border}` : "border-zinc-700"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center gap-3 px-3 py-3 text-left transition-all duration-200 sm:gap-4 sm:px-5 sm:py-4 ${
          isOpen
            ? `bg-gradient-to-r ${meta.gradient} text-white`
            : `${meta.light} hover:brightness-95`
        }`}
      >
        <span className="text-2xl leading-none">{meta.icon}</span>

        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-bold uppercase tracking-wider ${
              isOpen ? "text-white" : meta.textLight
            }`}
          >
            {name}
          </p>
          <p className={`text-xs ${isOpen ? "text-white/70" : "text-zinc-500"}`}>
            {items.length} items
          </p>
        </div>

        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold sm:px-3 sm:text-xs ${statusStyle}`}>
          {statusLabel}
        </span>

        <svg
          className={`h-5 w-5 shrink-0 transition-transform duration-300 ${
            isOpen ? "rotate-180 text-white" : "text-zinc-500"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden bg-zinc-900/60">
          <div className="space-y-3 p-3 sm:p-4">
            {items.map((item) => (
              <ChecklistRow
                key={item.id}
                item={item}
                value={checklistState[item.id]}
                disabled={disabled}
                onChange={(value) => onItemChange(item.id, value)}
              />
            ))}
          </div>
        </div>
      </div>
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

  const selectedOptionStyle = (option: Compliance) => {
    if (option === "No cumple") {
      return "border-rose-500 bg-rose-900/50 text-rose-300";
    }
    if (option === "No aplica") {
      return "border-sky-500 bg-sky-900/50 text-sky-300";
    }
    return "border-emerald-500 bg-emerald-900/50 text-emerald-300";
  };

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-800/60 p-3">
      <div className="mb-2 flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-zinc-200">{item.label}</p>
        <span
          className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${
            item.critical ? "bg-rose-950/70 text-rose-400" : "bg-zinc-700 text-zinc-400"
          }`}
        >
          {item.critical ? "Critico" : "No critico"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {options.map((option) => {
          const selected = value === option;
          return (
            <button
              key={option}
              type="button"
              disabled={disabled}
              onClick={() => onChange(option)}
              className={`w-full rounded-lg border px-3 py-2 text-center text-xs font-semibold transition ${
                selected
                  ? selectedOptionStyle(option)
                  : "border-zinc-600 bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
              } disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

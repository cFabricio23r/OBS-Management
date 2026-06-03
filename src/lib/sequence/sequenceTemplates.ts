import type { AppConfig, Sequence, SequenceStep } from "../../types/config";

export const uid = (prefix = "id") => `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;

export type TemplateDefinition = {
  label: string;
  build: (sources: string[]) => SequenceStep[];
};

export const sequenceTemplates: TemplateDefinition[] = [
  {
    label: "Animated entry -> static",
    build: ([entry = "", fondo = ""]) => [
      { type: "hide_all" },
      { type: "show", sources: [entry].filter(Boolean) },
      { type: "restart", sources: [entry].filter(Boolean) },
      { type: "wait", ms: 3000 },
      { type: "hide", sources: [entry].filter(Boolean) },
      { type: "show", sources: [fondo].filter(Boolean) },
    ],
  },
  {
    label: "Animated exit -> clear",
    build: ([, fondo = "", salida = ""]) => [
      { type: "hide", sources: [fondo].filter(Boolean) },
      { type: "show", sources: [salida].filter(Boolean) },
      { type: "restart", sources: [salida].filter(Boolean) },
      { type: "wait", ms: 2500 },
      { type: "hide_all" },
    ],
  },
  { label: "Lower third show", build: ([source = ""]) => [{ type: "show", sources: [source].filter(Boolean) }, { type: "restart", sources: [source].filter(Boolean) }] },
  { label: "Lower third hide", build: ([source = ""]) => [{ type: "hide", sources: [source].filter(Boolean) }] },
  { label: "Show static only", build: ([source = ""]) => [{ type: "hide_all" }, { type: "show", sources: [source].filter(Boolean) }] },
  { label: "Clear managed sources", build: () => [{ type: "hide_all" }] },
  { label: "Empty custom sequence", build: () => [] },
];

const makeSequence = (sceneName: string, label: string, slot: number, managedSources: string[], steps: SequenceStep[]): Sequence => ({
  id: uid("seq"),
  sceneName,
  label,
  slot,
  managedSources,
  steps,
});

export const createSampleConfig = (): AppConfig => {
  const esperaSources = ["Espera Entrada", "Espera Fondo", "Espera Salida"];
  const altarSources = ["Misa Entrada", "Misa Fondo", "Misa Salida", "Celebrante Entrada", "Celebrante Fondo", "Celebrante Salida"];
  const esperaEntrada = makeSequence("Espera", "Entrada de espera", 1, esperaSources, sequenceTemplates[0].build(esperaSources));
  const esperaSalida = makeSequence("Espera", "Salida de espera", 2, esperaSources, sequenceTemplates[1].build(esperaSources));
  const misaEntrada = makeSequence("Altar", "Entrada de misa", 1, altarSources, sequenceTemplates[0].build(["Misa Entrada", "Misa Fondo", "Misa Salida"]));
  const misaSalida = makeSequence("Altar", "Salida de misa", 2, altarSources, sequenceTemplates[1].build(["Misa Entrada", "Misa Fondo", "Misa Salida"]));
  const celebranteShow = makeSequence("Altar", "Mostrar celebrante", 3, altarSources, [
    { type: "show", sources: ["Celebrante Entrada"] },
    { type: "restart", sources: ["Celebrante Entrada"] },
    { type: "wait", ms: 2200 },
    { type: "hide", sources: ["Celebrante Entrada"] },
    { type: "show", sources: ["Celebrante Fondo"] },
  ]);
  const celebranteHide = makeSequence("Altar", "Quitar celebrante", 4, altarSources, [
    { type: "hide", sources: ["Celebrante Fondo"] },
    { type: "show", sources: ["Celebrante Salida"] },
    { type: "restart", sources: ["Celebrante Salida"] },
    { type: "wait", ms: 1800 },
    { type: "hide", sources: ["Celebrante Salida"] },
  ]);

  return {
    sequences: {
      Espera: [esperaEntrada, esperaSalida],
      Altar: [misaEntrada, misaSalida, celebranteShow, celebranteHide],
    },
    rundown: [
      { id: uid("cue"), title: "Prepare waiting screen", sceneName: "Espera", sequenceId: esperaEntrada.id, note: "Open with the waiting visual in Preview." },
      { id: uid("cue"), title: "Prepare altar / mass entrance", sceneName: "Altar", sequenceId: misaEntrada.id, note: "Prepare altar before going live." },
      { id: uid("cue"), title: "Show celebrant", sceneName: "Altar", sequenceId: celebranteShow.id },
      { id: uid("cue"), title: "Hide celebrant", sceneName: "Altar", sequenceId: celebranteHide.id },
      { id: uid("cue"), title: "Prepare mass exit", sceneName: "Altar", sequenceId: misaSalida.id },
      { id: uid("cue"), title: "Back to waiting", sceneName: "Espera", sequenceId: esperaEntrada.id },
    ],
  };
};

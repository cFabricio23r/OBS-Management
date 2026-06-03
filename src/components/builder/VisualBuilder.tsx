import { Copy, FlaskConical, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useAppStore } from "../../store/useAppStore";
import { useObsStore } from "../../store/useObsStore";
import type { Sequence, SequenceStep } from "../../types/config";
import { obsClient } from "../../lib/obs/obsClient";
import { sequenceRunner } from "../../lib/sequence/sequenceEngine";
import { sequenceTemplates, uid } from "../../lib/sequence/sequenceTemplates";
import { Button } from "../ui/Button";
import { Field, Input, Select } from "../ui/Field";
import { Modal } from "../ui/Modal";

const stepLabel = (step: SequenceStep) => {
  if (step.type === "wait") return `wait ${step.ms}ms`;
  if (step.type === "preview") return `preview ${step.sceneName}`;
  if ("sources" in step) return `${step.type} ${step.sources.join(", ") || "no source"}`;
  return step.type;
};

export const VisualBuilder = () => {
  const { config, upsertSequence, duplicateSequence, deleteSequence, addLog } = useAppStore();
  const obs = useObsStore();
  const scenes = useMemo(() => Array.from(new Set([...obs.state.scenes.map((s) => s.sceneName), ...Object.keys(config.sequences)])), [obs.state.scenes, config.sequences]);
  const [sceneName, setSceneName] = useState(scenes[0] ?? "Altar");
  const [editing, setEditing] = useState<Sequence | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Sequence | null>(null);
  const sources = obs.sceneSources[sceneName] ?? [];
  const sequences = config.sequences[sceneName] ?? [];
  const usedCount = (id: string) => config.rundown.filter((cue) => cue.sequenceId === id).length;

  const loadSources = async () => {
    try {
      await obs.loadSceneSources(sceneName);
      addLog("success", `Loaded sources for ${sceneName}`);
    } catch (error) {
      addLog("error", error instanceof Error ? error.message : "Could not load sources");
    }
  };

  const createFromTemplate = (templateIndex: number) => {
    const managedSources = sources.map((source) => source.sourceName);
    setEditing({
      id: uid("seq"),
      sceneName,
      label: sequenceTemplates[templateIndex].label,
      slot: sequences.length + 1 <= 9 ? sequences.length + 1 : undefined,
      managedSources,
      steps: sequenceTemplates[templateIndex].build(managedSources),
    });
  };

  const save = async () => {
    if (!editing) return;
    await upsertSequence(editing);
    addLog("success", `Saved ${editing.label}`);
    setEditing(null);
  };

  const updateStep = (index: number, step: SequenceStep) => {
    if (!editing) return;
    const steps = [...editing.steps];
    steps[index] = step;
    setEditing({ ...editing, steps });
  };

  const sourceOptions = editing?.managedSources ?? sources.map((item) => item.sourceName);

  return (
    <div className="grid gap-3 lg:grid-cols-[320px_1fr]">
      <aside className="rounded-2xl border border-white/[0.08] bg-slate-900/72 p-3 shadow-glow backdrop-blur-xl">
        <Field label="OBS Scene">
          <Select value={sceneName} onChange={(event) => setSceneName(event.target.value)}>
            {scenes.map((scene) => <option key={scene}>{scene}</option>)}
          </Select>
        </Field>
        <Button className="mt-2 w-full" onClick={loadSources}>Load real scene sources</Button>
        <div className="mt-4 text-xs font-black uppercase text-slate-400">Managed Sources</div>
        <div className="mt-2 grid max-h-64 gap-1 overflow-auto rounded-xl bg-slate-950/58 p-2">
          {(sources.length ? sources : (sequences[0]?.managedSources ?? []).map((sourceName) => ({ sourceName, sceneItemId: 0, sceneItemEnabled: false }))).map((source) => (
            <label key={source.sourceName} className="flex items-center gap-2 rounded px-2 py-1 text-sm text-slate-300 hover:bg-white/5">
              <input type="checkbox" checked={editing?.managedSources.includes(source.sourceName) ?? false} onChange={(event) => {
                if (!editing) return;
                setEditing({ ...editing, managedSources: event.target.checked ? [...editing.managedSources, source.sourceName] : editing.managedSources.filter((item) => item !== source.sourceName) });
              }} />
              {source.sourceName}
            </label>
          ))}
        </div>
        <div className="mt-4 grid gap-2">
          <div className="text-xs font-black uppercase text-slate-400">Quick Templates</div>
          {sequenceTemplates.map((template, index) => <Button key={template.label} icon={<Plus className="h-4 w-4" />} onClick={() => createFromTemplate(index)}>{template.label}</Button>)}
        </div>
      </aside>

      <section className="grid gap-3">
        <div className="rounded-2xl border border-white/[0.08] bg-slate-900/72 p-3 shadow-glow backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-lg font-black text-white">Sequences in {sceneName}</h2>
            <Button icon={<Plus className="h-4 w-4" />} onClick={() => createFromTemplate(6)}>New Custom</Button>
          </div>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {sequences.map((sequence) => (
              <article key={sequence.id} className="rounded-xl border border-white/[0.08] bg-white/[0.045] p-3 transition hover:border-white/18 hover:bg-white/[0.07]">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-black text-white">{sequence.label}</h3>
                    <p className="text-xs text-slate-400">Slot {sequence.slot ?? "-"} / {sequence.steps.length} steps / {sequence.managedSources.length} sources / used in {usedCount(sequence.id)} cues</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button icon={<Pencil className="h-4 w-4" />} onClick={() => setEditing(structuredClone(sequence))}>Edit</Button>
                  <Button icon={<Copy className="h-4 w-4" />} onClick={() => duplicateSequence(sequence)}>Duplicate</Button>
                  <Button icon={<FlaskConical className="h-4 w-4" />} onClick={async () => {
                    await obsClient.setCurrentPreviewScene(sequence.sceneName);
                    await sequenceRunner.runSequence(obsClient, sequence);
                  }}>Test</Button>
                  <Button variant="danger" icon={<Trash2 className="h-4 w-4" />} onClick={() => setDeleteTarget(sequence)}>Delete</Button>
                </div>
              </article>
            ))}
          </div>
        </div>

        {editing ? (
          <div className="rounded-2xl border border-cyan-200/30 bg-cyan-300/10 p-3 shadow-glow">
            <div className="grid gap-2 md:grid-cols-[1fr_120px_auto]">
              <Field label="Sequence label"><Input value={editing.label} onChange={(event) => setEditing({ ...editing, label: event.target.value })} /></Field>
              <Field label="Slot"><Input type="number" min={1} max={9} value={editing.slot ?? ""} onChange={(event) => setEditing({ ...editing, slot: event.target.value ? Number(event.target.value) : undefined })} /></Field>
              <Button className="self-end" variant="primary" icon={<Save className="h-4 w-4" />} onClick={save}>Save</Button>
            </div>
            <div className="mt-3 grid gap-2">
              {editing.steps.map((step, index) => (
                <div key={`${index}-${step.type}`} className="grid gap-2 rounded-xl border border-white/[0.08] bg-slate-950/50 p-2 md:grid-cols-[120px_1fr_auto]">
                  <Select value={step.type} onChange={(event) => {
                    const type = event.target.value as SequenceStep["type"];
                    const next: SequenceStep = type === "wait" ? { type, ms: 1000 } : type === "preview" ? { type, sceneName } : type === "take" || type === "hide_all" ? { type } : { type, sources: [] };
                    updateStep(index, next);
                  }}>
                    {["hide_all", "show", "hide", "restart", "wait", "preview", "take"].map((type) => <option key={type}>{type}</option>)}
                  </Select>
                  {"sources" in step ? (
                    <div className="flex flex-wrap gap-2">
                      {sourceOptions.map((source) => <label key={source} className="rounded bg-white/5 px-2 py-1 text-xs"><input className="mr-1" type="checkbox" checked={step.sources.includes(source)} onChange={(event) => updateStep(index, { ...step, sources: event.target.checked ? [...step.sources, source] : step.sources.filter((item) => item !== source) })} />{source}</label>)}
                    </div>
                  ) : step.type === "wait" ? <Input type="number" value={step.ms} onChange={(event) => updateStep(index, { type: "wait", ms: Number(event.target.value) })} /> : step.type === "preview" ? <Input value={step.sceneName} onChange={(event) => updateStep(index, { type: "preview", sceneName: event.target.value })} /> : <div className="text-sm text-slate-400">{stepLabel(step)}</div>}
                  <div className="flex gap-1">
                    <Button variant="ghost" onClick={() => setEditing({ ...editing, steps: editing.steps.filter((_, i) => i !== index) })}>Del</Button>
                    <Button variant="ghost" onClick={() => setEditing({ ...editing, steps: [...editing.steps.slice(0, index + 1), structuredClone(step), ...editing.steps.slice(index + 1)] })}>Dup</Button>
                    <Button variant="ghost" onClick={() => index > 0 && setEditing({ ...editing, steps: editing.steps.map((s, i) => i === index - 1 ? step : i === index ? editing.steps[index - 1] : s) })}>Up</Button>
                    <Button variant="ghost" onClick={() => index < editing.steps.length - 1 && setEditing({ ...editing, steps: editing.steps.map((s, i) => i === index + 1 ? step : i === index ? editing.steps[index + 1] : s) })}>Dn</Button>
                  </div>
                </div>
              ))}
              <Button onClick={() => setEditing({ ...editing, steps: [...editing.steps, { type: "hide_all" }] })}>Add visual step</Button>
            </div>
          </div>
        ) : null}
      </section>

      {deleteTarget ? (
        <Modal title="Delete sequence" onClose={() => setDeleteTarget(null)}>
          <p className="text-sm text-slate-300">This sequence is used by {usedCount(deleteTarget.id)} cues. Deleting it will also remove or unlink those cues.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => deleteSequence(deleteTarget.id, "remove-cues").then(() => setDeleteTarget(null))}>Delete and remove cues</Button>
            <Button variant="warning" onClick={() => deleteSequence(deleteTarget.id, "keep-broken").then(() => setDeleteTarget(null))}>Keep broken cues</Button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
};

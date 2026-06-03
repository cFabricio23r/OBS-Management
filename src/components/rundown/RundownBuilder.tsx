import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Copy, GripVertical, Send, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAppStore } from "../../store/useAppStore";
import type { Cue } from "../../types/config";
import { findSequence } from "../../lib/sequence/validators";
import { uid } from "../../lib/sequence/sequenceTemplates";
import { Button } from "../ui/Button";
import { Field, Input, Select, Textarea } from "../ui/Field";

const SortableCue = ({ cue, index }: { cue: Cue; index: number }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: cue.id });
  const { config, deleteCue, duplicateCue, selectCue, setView } = useAppStore();
  const sequence = findSequence(config, cue.sequenceId);
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`rounded-md border p-3 ${sequence ? "border-white/10 bg-obs-850" : "border-amber-400/50 bg-amber-500/10"}`}>
      <div className="flex items-center gap-2">
        <button className="cursor-grab rounded p-1 text-slate-400 hover:bg-white/10" {...attributes} {...listeners}><GripVertical className="h-5 w-5" /></button>
        <span className="grid h-7 w-7 place-items-center rounded bg-black/30 text-xs font-black">{index + 1}</span>
        <div className="min-w-0 flex-1">
          <div className="truncate font-black text-white">{cue.title}</div>
          <div className="truncate text-xs text-slate-400">{cue.sceneName} / {sequence?.label ?? "Missing sequence"}</div>
        </div>
        <Button variant="ghost" icon={<Send className="h-4 w-4" />} onClick={() => { selectCue(index); setView("operator"); }}>Send</Button>
        <Button variant="ghost" icon={<Copy className="h-4 w-4" />} onClick={() => duplicateCue(cue)}>Duplicate</Button>
        <Button variant="danger" icon={<Trash2 className="h-4 w-4" />} onClick={() => deleteCue(cue.id)}>Delete</Button>
      </div>
      {cue.note ? <p className="mt-2 text-sm text-slate-400">{cue.note}</p> : null}
    </div>
  );
};

export const RundownBuilder = () => {
  const { config, upsertCue, reorderRundown, addLog } = useAppStore();
  const sceneNames = Object.keys(config.sequences);
  const [sceneName, setSceneName] = useState(sceneNames[0] ?? "");
  const sequences = config.sequences[sceneName] ?? [];
  const { register, handleSubmit, reset, watch, setValue } = useForm<{ title: string; note: string; sequenceId: string }>({
    defaultValues: { title: "", note: "", sequenceId: sequences[0]?.id ?? "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    const sequence = findSequence(config, values.sequenceId);
    await upsertCue({ id: uid("cue"), title: values.title || sequence?.label || "Untitled cue", sceneName, sequenceId: values.sequenceId, note: values.note || undefined });
    reset({ title: "", note: "", sequenceId: values.sequenceId });
    addLog("success", "Cue added to rundown");
  });

  const onDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const oldIndex = config.rundown.findIndex((cue) => cue.id === active.id);
    const newIndex = config.rundown.findIndex((cue) => cue.id === over.id);
    if (oldIndex >= 0 && newIndex >= 0) {
      const next = arrayMove(config.rundown, oldIndex, newIndex);
      await reorderRundown(oldIndex, next.findIndex((cue) => cue.id === active.id));
    }
  };

  return (
    <div className="grid gap-3 lg:grid-cols-[360px_1fr]">
      <form onSubmit={onSubmit} className="rounded-lg border border-white/10 bg-obs-850 p-3 shadow-glow">
        <h2 className="mb-3 text-lg font-black text-white">Add Cue</h2>
        <div className="grid gap-3">
          <Field label="Scene">
            <Select value={sceneName} onChange={(event) => {
              setSceneName(event.target.value);
              setValue("sequenceId", config.sequences[event.target.value]?.[0]?.id ?? "");
            }}>
              {sceneNames.map((scene) => <option key={scene}>{scene}</option>)}
            </Select>
          </Field>
          <Field label="Sequence">
            <Select {...register("sequenceId")} value={watch("sequenceId") || sequences[0]?.id || ""}>
              {sequences.map((sequence) => <option key={sequence.id} value={sequence.id}>{sequence.label}</option>)}
            </Select>
          </Field>
          <Field label="Cue title"><Input {...register("title")} placeholder="Prepare altar / mass entrance" /></Field>
          <Field label="Cue note"><Textarea {...register("note")} placeholder="Operator note" /></Field>
          <Button variant="primary" type="submit">Add cue from sequence</Button>
        </div>
      </form>
      <section className="rounded-lg border border-white/10 bg-obs-950 p-3 shadow-glow">
        <h2 className="mb-3 text-lg font-black text-white">Livestream Rundown</h2>
        <DndContext onDragEnd={onDragEnd}>
          <SortableContext items={config.rundown.map((cue) => cue.id)} strategy={verticalListSortingStrategy}>
            <div className="grid gap-2">
              {config.rundown.map((cue, index) => <SortableCue key={cue.id} cue={cue} index={index} />)}
            </div>
          </SortableContext>
        </DndContext>
      </section>
    </div>
  );
};

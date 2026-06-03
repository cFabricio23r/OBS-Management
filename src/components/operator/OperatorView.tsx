import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  GripVertical,
  Layers3,
  ListPlus,
  Play,
  Plus,
  Radio,
  Square,
  StepForward,
  Trash2,
} from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { useObsStore } from "../../store/useObsStore";
import { obsClient } from "../../lib/obs/obsClient";
import { useT } from "../../lib/i18n/translations";
import { sequenceRunner } from "../../lib/sequence/sequenceEngine";
import { findSequence } from "../../lib/sequence/validators";
import { uid } from "../../lib/sequence/sequenceTemplates";
import type { Cue, Sequence } from "../../types/config";
import { Button } from "../ui/Button";
import { StatusBar } from "./StatusBar";

const glassPanel = "rounded-2xl border border-white/[0.08] bg-slate-900/72 shadow-[0_24px_80px_rgba(0,0,0,0.36),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl";

const SortableQueueItem = ({ cue, index }: { cue: Cue; index: number }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: cue.id });
  const { config, selectedCueIndex, preparedCueId, selectCue, deleteCue } = useAppStore();
  const sequence = findSequence(config, cue.sequenceId);
  const t = useT();
  const active = index === selectedCueIndex;
  const prepared = preparedCueId === cue.id;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group rounded-xl border px-2.5 py-2 transition ${
        active
          ? "border-cyan-200 bg-cyan-300/14 shadow-[inset_3px_0_0_#67e8f9]"
          : prepared
            ? "border-emerald-300/50 bg-emerald-500/10"
            : sequence
              ? "border-white/[0.08] bg-white/[0.04] hover:border-white/18 hover:bg-white/[0.07]"
              : "border-amber-400/50 bg-amber-500/10"
      }`}
    >
      <div className="flex items-center gap-2">
        <button className="cursor-grab rounded p-1 text-slate-500 hover:bg-white/10 hover:text-white" {...attributes} {...listeners}>
          <GripVertical className="h-4 w-4" />
        </button>
        <button className="min-w-0 flex-1 text-left" onClick={() => selectCue(index)}>
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-lg bg-white/10 text-[11px] font-black text-slate-200">{index + 1}</span>
            <span className="truncate text-sm font-black text-white">{sequence?.label ?? cue.title}</span>
          </div>
          <div className="mt-1 truncate pl-8 text-xs text-slate-400">{cue.sceneName}</div>
        </button>
        <button className="rounded p-2 text-slate-500 hover:bg-rose-500/15 hover:text-rose-200" onClick={() => deleteCue(cue.id)} title={t("removeFromQueue")}>
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export const OperatorView = () => {
  const {
    config,
    selectedCueIndex,
    preparedCueId,
    nextCue,
    previousCue,
    markPrepared,
    addLog,
    upsertCue,
    deleteCue,
    reorderRundown,
  } = useAppStore();
  const obs = useObsStore();
  const t = useT();
  const cue = config.rundown[selectedCueIndex];
  const sequence = cue ? findSequence(config, cue.sequenceId) : undefined;
  const configuredScenes = Object.keys(config.sequences);
  const sceneNames = obs.state.scenes.length ? obs.state.scenes.map((scene) => scene.sceneName) : configuredScenes;
  const previewScene = obs.state.previewScene ?? sceneNames[0];
  const previewSequences = previewScene ? (config.sequences[previewScene] ?? []) : [];

  const setPreviewScene = async (sceneName: string) => {
    try {
      await obsClient.setCurrentPreviewScene(sceneName);
      await obs.refreshState();
      addLog("success", `Preview set to ${sceneName}`);
    } catch (error) {
      addLog("error", error instanceof Error ? error.message : "Could not set Preview scene");
    }
  };

  const runSequence = async (target: Sequence, sceneName = target.sceneName) => {
    try {
      await sequenceRunner.runSequence(obsClient, target, sceneName);
      await obs.refreshState();
      addLog("success", `Ran ${target.label}`);
    } catch (error) {
      addLog("error", error instanceof Error ? error.message : "Sequence failed");
    }
  };

  const previewQueueItem = async () => {
    if (!cue) return;
    try {
      await obsClient.setCurrentPreviewScene(cue.sceneName);
      await obs.refreshState();
      if (!sequence) {
        addLog("warning", `Missing sequence for ${cue.title}`);
        return;
      }
      await sequenceRunner.runSequence(obsClient, sequence, cue.sceneName);
      markPrepared(cue.id);
      await obs.refreshState();
      addLog("success", `Previewing ${sequence.label}`);
    } catch (error) {
      addLog("error", error instanceof Error ? error.message : "Preview failed");
    }
  };

  const take = async () => {
    try {
      if (cue && sequence) {
        await obsClient.setCurrentPreviewScene(cue.sceneName);
        await obs.refreshState();
        await sequenceRunner.runSequence(obsClient, sequence, cue.sceneName);
        markPrepared(cue.id);
      } else if (cue && !sequence) {
        addLog("warning", `Missing sequence for ${cue.title}`);
        return;
      }
      await obsClient.triggerStudioModeTransition();
      await obs.refreshState();
      addLog("success", sequence ? `Took ${sequence.label}` : "Manual transition triggered");
    } catch (error) {
      addLog("error", error instanceof Error ? error.message : "Take failed");
    }
  };

  const addToQueue = async (target: Sequence) => {
    await upsertCue({ id: uid("cue"), title: target.label, sceneName: target.sceneName, sequenceId: target.id });
    addLog("success", `Queued ${target.label}`);
  };

  const onDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = config.rundown.findIndex((item) => item.id === active.id);
    const to = config.rundown.findIndex((item) => item.id === over.id);
    if (from >= 0 && to >= 0) await reorderRundown(from, to);
  };

  return (
    <div className="grid gap-3">
      <StatusBar />

      <section className={`${glassPanel} overflow-hidden`}>
        <div className="grid xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="p-2 sm:p-3 lg:p-4">
            <div className="mb-3 grid gap-2 sm:gap-3 lg:grid-cols-[1fr_auto]">
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.05] p-4">
                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wide text-cyan-200">
                  <Radio className="h-4 w-4" /> {t("switcherConsole")}
                </div>
                <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-xl font-black text-white sm:text-2xl">{sequence?.label ?? t("noSequenceArmed")}</div>
                    <div className="mt-1 line-clamp-2 text-sm text-slate-400 sm:truncate">{cue ? `${cue.sceneName} / ${t("nextInQueue")}` : t("addSequenceHint")}</div>
                  </div>
                  <div className={`rounded-full px-3 py-1 text-xs font-black ${preparedCueId === cue?.id ? "bg-emerald-400/18 text-emerald-100" : "bg-white/8 text-slate-300"}`}>
                    {preparedCueId === cue?.id ? t("inPreview") : t("standby")}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-2 sm:grid-cols-4">
                <Button variant="primary" className="min-h-[58px] px-2" shortcut="Space" icon={<Play className="h-5 w-5" />} onClick={previewQueueItem}>{t("preview")}</Button>
                <Button variant="danger" className="min-h-[58px] px-2" shortcut="T" icon={<StepForward className="h-5 w-5" />} onClick={take}>{t("take")}</Button>
                <Button className="min-h-[50px] px-2 sm:min-h-[56px]" shortcut="B" icon={<ArrowUp className="h-4 w-4" />} onClick={previousCue}>{t("back")}</Button>
                <Button className="min-h-[50px] px-2 sm:min-h-[56px]" shortcut="N" icon={<ArrowDown className="h-4 w-4" />} onClick={nextCue}>{t("next")}</Button>
              </div>
            </div>

            <div className="mb-3 grid gap-2 sm:gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-rose-300/28 bg-rose-500/10 p-3">
                <div className="text-[10px] font-black uppercase tracking-wide text-rose-200">{t("program")}</div>
                <div className="mt-2 truncate text-lg font-black text-white">{obs.state.programScene ?? t("unknown")}</div>
              </div>
              <div className="rounded-2xl border border-cyan-200/28 bg-cyan-300/10 p-3">
                <div className="text-[10px] font-black uppercase tracking-wide text-cyan-200">{t("preview")}</div>
                <div className="mt-2 truncate text-lg font-black text-white">{obs.state.previewScene ?? t("unknown")}</div>
              </div>
              <div className="rounded-2xl border border-emerald-300/25 bg-emerald-400/10 p-3">
                <div className="text-[10px] font-black uppercase tracking-wide text-emerald-200">{t("armedCue")}</div>
                <div className="mt-2 truncate text-lg font-black text-white">{sequence?.label ?? t("none")}</div>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.045] p-3">
                <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">{t("queue")}</div>
                <div className="mt-2 text-lg font-black text-white">{config.rundown.length} {t("transitions")}</div>
              </div>
            </div>

            <div className="grid gap-2 sm:gap-3 2xl:grid-cols-[0.86fr_1.14fr]">
              <section className="rounded-2xl border border-white/[0.08] bg-white/[0.045] p-3">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="text-[11px] font-black uppercase tracking-wide text-cyan-200">{t("scenes")}</div>
                  <div className="text-[11px] font-bold text-slate-500">Shift + 1-9</div>
                </div>
                <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2 md:grid-cols-3 2xl:grid-cols-2">
                  {sceneNames.slice(0, 9).map((sceneName, index) => {
                    const active = obs.state.previewScene === sceneName;
                    const live = obs.state.programScene === sceneName;
                    return (
                      <button
                        key={sceneName}
                        onClick={() => setPreviewScene(sceneName)}
                        className={`group min-h-[68px] rounded-xl border px-3 py-2 text-left transition sm:min-h-[74px] ${
                          live
                            ? "border-rose-300/70 bg-rose-500/14 shadow-[inset_0_-3px_0_rgba(251,113,133,0.85)]"
                            : active
                              ? "border-cyan-200/70 bg-cyan-300/14 shadow-[inset_0_-3px_0_rgba(103,232,249,0.85)]"
                              : "border-white/[0.08] bg-slate-950/38 hover:border-white/20 hover:bg-white/[0.07]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="min-w-0 truncate text-sm font-black text-white">{sceneName}</span>
                          <kbd className="rounded-md bg-black/35 px-1.5 py-0.5 text-[10px] font-black text-slate-200">S+{index + 1}</kbd>
                        </div>
                        <div className={`mt-4 inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${live ? "bg-rose-500/20 text-rose-100" : active ? "bg-sky-500/20 text-sky-100" : "bg-slate-700/55 text-slate-300"}`}>
                          {live ? t("program") : active ? t("preview") : t("available")}
                        </div>
                      </button>
                    );
                  })}
                {!sceneNames.length ? <div className="col-span-full rounded-xl border border-dashed border-white/15 p-4 text-sm text-slate-400">{t("connectObsOrCreateScenes")}</div> : null}
                </div>
              </section>

              <section className="rounded-2xl border border-white/[0.08] bg-white/[0.045] p-3">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-wide text-emerald-200">{t("quickSequences")}</div>
                    <div className="text-xs text-slate-500">{previewScene ?? t("noPreviewScene")}</div>
                  </div>
                  <Button variant="ghost" icon={<Square className="h-4 w-4" />} shortcut="X" onClick={() => sequenceRunner.stop()}>{t("stop")}</Button>
                </div>
                <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                  {previewSequences.slice(0, 9).map((item, index) => (
                    <article key={item.id} className="grid grid-cols-[minmax(0,1fr)_56px] overflow-hidden rounded-xl border border-white/[0.08] bg-slate-950/38 transition hover:border-white/20 hover:bg-white/[0.04]">
                      <button className="min-w-0 p-3 text-left hover:bg-white/[0.04]" onClick={() => runSequence(item, previewScene)}>
                        <div className="flex min-h-[52px] items-start justify-between gap-2">
                          <span className="min-w-0 flex-1 truncate font-black text-white"><Layers3 className="mr-2 inline h-4 w-4 text-emerald-200" />{item.label}</span>
                          <kbd className="shrink-0 rounded-md bg-emerald-500/18 px-1.5 py-0.5 text-[10px] font-black text-emerald-100">{item.slot ?? index + 1}</kbd>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                          <span>{item.steps.length} {t("steps")}</span>
                          <span className="h-1 w-1 rounded-full bg-slate-600" />
                          <span>{item.managedSources.length} {t("sources")}</span>
                        </div>
                      </button>
                      <button className="grid min-h-[84px] w-14 place-items-center border-l border-white/10 text-slate-300 hover:bg-sky-500/15 hover:text-sky-100" onClick={() => addToQueue(item)} title={t("addToQueue")}>
                        <Plus className="h-5 w-5" />
                      </button>
                    </article>
                  ))}
                  {!previewSequences.length ? <div className="col-span-full rounded-xl border border-dashed border-white/15 p-4 text-sm text-slate-400">{t("noQuickSequences")}</div> : null}
                </div>
              </section>
            </div>
          </div>

          <aside className="border-t border-white/[0.08] bg-slate-950/46 p-2 sm:p-3 xl:border-l xl:border-t-0">
            <div className="mb-3 rounded-2xl border border-white/[0.08] bg-white/[0.05] p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[11px] font-black uppercase tracking-wide text-slate-400">{t("upNext")}</div>
                {cue ? <Button variant="ghost" icon={<Trash2 className="h-4 w-4" />} onClick={() => deleteCue(cue.id)}>{t("clear")}</Button> : null}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <ChevronRight className="h-5 w-5 text-cyan-200" />
                <div className="min-w-0 flex-1 truncate text-lg font-black text-white">{sequence?.label ?? cue?.title ?? t("queueEmpty")}</div>
              </div>
            </div>

            <div className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-wide text-slate-300">
              <ListPlus className="h-4 w-4 text-cyan-200" /> {t("sequenceQueue")}
            </div>
            <DndContext onDragEnd={onDragEnd}>
              <SortableContext items={config.rundown.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                <div className="grid max-h-[46vh] gap-2 overflow-auto pr-1 sm:max-h-[520px] xl:max-h-[690px]">
                  {config.rundown.map((item, index) => <SortableQueueItem key={item.id} cue={item} index={index} />)}
                  {!config.rundown.length ? (
                    <div className="rounded-xl border border-dashed border-white/15 p-4 text-sm text-slate-400">
                      {t("queueHint")}
                    </div>
                  ) : null}
                </div>
              </SortableContext>
            </DndContext>
          </aside>
        </div>
      </section>
    </div>
  );
};

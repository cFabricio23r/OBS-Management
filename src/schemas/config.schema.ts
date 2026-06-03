import { z } from "zod";

export const sequenceStepSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("hide_all") }),
  z.object({ type: z.literal("show"), sources: z.array(z.string()) }),
  z.object({ type: z.literal("hide"), sources: z.array(z.string()) }),
  z.object({ type: z.literal("restart"), sources: z.array(z.string()) }),
  z.object({ type: z.literal("wait"), ms: z.number().int().min(0).max(120000) }),
  z.object({ type: z.literal("preview"), sceneName: z.string().min(1) }),
  z.object({ type: z.literal("take") }),
]);

export const sequenceSchema = z.object({
  id: z.string().min(1),
  sceneName: z.string().min(1),
  label: z.string().min(1),
  slot: z.number().int().min(1).max(9).optional(),
  managedSources: z.array(z.string()),
  steps: z.array(sequenceStepSchema),
});

export const cueSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  sceneName: z.string().min(1),
  sequenceId: z.string().min(1),
  note: z.string().optional(),
});

export const appConfigSchema = z.object({
  sequences: z.record(z.array(sequenceSchema)),
  rundown: z.array(cueSchema),
});

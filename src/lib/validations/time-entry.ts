import { z } from "zod";

export const createTimeEntrySchema = z.object({
  taskId: z.string().cuid("Invalid task ID"),
  description: z.string().max(500, "Description too long").optional().nullable(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date().optional().nullable(),
  duration: z.number().int().nonnegative().optional(),
  billable: z.boolean().default(true),
});

export const updateTimeEntrySchema = createTimeEntrySchema.partial().omit({ taskId: true });

export const startTimerSchema = z.object({
  taskId: z.string().cuid("Invalid task ID"),
  description: z.string().max(500).optional().nullable(),
});

export const stopTimerSchema = z.object({
  entryId: z.string().cuid("Invalid entry ID"),
});

export type CreateTimeEntryInput = z.infer<typeof createTimeEntrySchema>;
export type UpdateTimeEntryInput = z.infer<typeof updateTimeEntrySchema>;
export type StartTimerInput = z.infer<typeof startTimerSchema>;
export type StopTimerInput = z.infer<typeof stopTimerSchema>;

import { z } from "zod";

const sourceIdSchema = z.string().regex(/^source_[0-9a-f-]{36}$/);
const nodeIdSchema = z.string().regex(/^node_[0-9a-f-]{36}$/);

export const sourceRecordSchema = z.object({
  id: sourceIdSchema,
  name: z.string().min(1),
  type: z.string().min(1),
  version: z.string().min(1).optional(),
  origin: z.string().min(1).optional(),
});

export const nodeRecordSchema = z.object({
  id: nodeIdSchema,
  sourceId: sourceIdSchema,
  title: z.string().min(1),
  parentIds: z.array(z.string().min(1)),
  hasContent: z.boolean(),
  sourceRef: z.string().min(1).optional(),
  contentType: z.string().min(1).optional(),
  position: z.number().finite().optional(),
});

export type SourceRecord = z.infer<typeof sourceRecordSchema>;
export type NodeRecord = z.infer<typeof nodeRecordSchema>;

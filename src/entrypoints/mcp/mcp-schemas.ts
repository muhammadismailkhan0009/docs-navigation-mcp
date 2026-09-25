import { z } from "zod";

export const sourceIdSchema = z
  .string()
  .regex(/^source_[0-9a-f-]{36}$/)
  .describe("Canonical documentation source ID");

export const nodeIdSchema = z
  .string()
  .regex(/^node_[0-9a-f-]{36}$/)
  .describe("Canonical documentation node ID");

export const optionalNonEmptyString = z.string().min(1).optional();

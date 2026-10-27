import "server-only";
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.url({ error: "DATABASE_URL debe ser una URL de Postgres válida" }),
  BETTER_AUTH_SECRET: z.string().min(32, { error: "BETTER_AUTH_SECRET debe tener al menos 32 caracteres" }),
  BETTER_AUTH_URL: z.url().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Variables de entorno inválidas:\n${z.prettifyError(parsed.error)}`);
}

export const env = parsed.data;

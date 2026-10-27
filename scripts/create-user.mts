/**
 * Provisions (or resets the password of) a user account.
 *
 *   pnpm user:create --email ana@linc.cr --name "Ana Pérez" [--password "..."]
 *
 * If --password is omitted a strong one is generated and printed once.
 */
import { parseArgs } from "node:util";
import { randomBytes, randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { z } from "zod";
import { account, user } from "../src/server/db/schema.ts";

const { values } = parseArgs({
  options: {
    email: { type: "string" },
    name: { type: "string" },
    password: { type: "string" },
  },
});

const input = z
  .object({
    email: z.email().transform((v) => v.toLowerCase()),
    name: z.string().trim().min(2),
    password: z.string().min(8).optional(),
  })
  .safeParse(values);

if (!input.success) {
  console.error(z.prettifyError(input.error));
  console.error('\nUso: pnpm user:create --email correo@dominio --name "Nombre" [--password "..."]');
  process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL no está definida");

const client = postgres(url, { prepare: false, max: 1 });
const db = drizzle(client);

const { email, name } = input.data;
const generated = !input.data.password;
const password = input.data.password ?? randomBytes(12).toString("base64url");
const hash = await hashPassword(password);

try {
  await db.transaction(async (tx) => {
    const [existing] = await tx.select().from(user).where(eq(user.email, email));
    if (existing) {
      await tx
        .update(account)
        .set({ password: hash })
        .where(and(eq(account.userId, existing.id), eq(account.providerId, "credential")));
      await tx.update(user).set({ name }).where(eq(user.id, existing.id));
      console.log(`✔ Usuario existente actualizado: ${email}`);
      return;
    }

    const id = randomUUID();
    await tx.insert(user).values({ id, email, name, emailVerified: true });
    await tx.insert(account).values({
      id: randomUUID(),
      userId: id,
      accountId: id,
      providerId: "credential",
      password: hash,
    });
    console.log(`✔ Usuario creado: ${email}`);
  });

  if (generated) console.log(`  Contraseña temporal: ${password}`);
} finally {
  await client.end();
}

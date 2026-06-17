import "dotenv/config";
import { defineConfig } from "prisma/config";
import { PrismaLibSql } from "@prisma/adapter-libsql";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"] || "file:./dev.db",
    adapter: () => {
      const url = process.env["DATABASE_URL"] || "file:./dev.db";
      const libsqlUrl = url.startsWith("file:") ? url : `file:${url}`;
      return new PrismaLibSql({ url: libsqlUrl });
    },
  } as any,
});

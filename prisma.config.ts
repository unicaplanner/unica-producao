import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// O Next.js le .env.local sozinho em runtime; o CLI do Prisma so le .env por
// padrao, entao carregamos .env.local manualmente aqui tambem.
config({ path: ".env.local" });
config();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});

import path from 'node:path';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  datasource: {
    url: process.env.DATABASE_URL ?? 'postgresql://taskify:taskify@localhost:5433/taskify',
  },
  migrations: {
    seed: 'npx tsx prisma/seed.ts',
  },
});

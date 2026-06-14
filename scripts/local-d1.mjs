import { existsSync } from "node:fs";
import { mkdir, readFile, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const command = process.argv[2] || "reset";

if (command !== "reset") {
  console.error(`Unsupported command: ${command}`);
  process.exit(1);
}

const dbPath = resolve(process.cwd(), ".wrangler/state/local-dev/homepage.sqlite");

if (existsSync(dbPath)) {
  await rm(dbPath);
}

await mkdir(dirname(dbPath), { recursive: true });

const db = new DatabaseSync(dbPath);
try {
  db.exec(await readFile(resolve(process.cwd(), "db/schema.sql"), "utf8"));
  db.exec(await readFile(resolve(process.cwd(), "db/seed.sql"), "utf8"));
} finally {
  db.close();
}

console.log("Local dev database reset and seeded.");

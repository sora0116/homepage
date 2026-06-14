type D1Result<T> = Promise<T>;

type SQLiteStatement = {
  all: (...values: unknown[]) => unknown[];
  get: (...values: unknown[]) => unknown;
  run: (...values: unknown[]) => unknown;
};

type SQLiteDatabase = {
  exec: (sql: string) => void;
  prepare: (query: string) => SQLiteStatement;
  close: () => void;
};

type D1StatementBinding = {
  all: <T>() => D1Result<{ results?: T[] }>;
  first: <T>() => D1Result<T | null>;
  run: () => D1Result<unknown>;
};

type D1DatabaseLike = {
  prepare: (query: string) => {
    bind: (...values: unknown[]) => D1StatementBinding;
  };
};

type LocalDevRuntime = {
  db: D1DatabaseLike;
  env: Record<string, string>;
};

const globalState = globalThis as typeof globalThis & {
  __homepageLocalDevRuntime?: Promise<LocalDevRuntime>;
};

export async function getLocalDevRuntime() {
  if (!globalState.__homepageLocalDevRuntime) {
    globalState.__homepageLocalDevRuntime = createLocalDevRuntime();
  }

  return globalState.__homepageLocalDevRuntime;
}

export async function resetLocalDevDatabase() {
  const [{ existsSync }, { rm, mkdir, readFile }, { dirname, resolve }, sqlite] =
    await Promise.all([
      import("node:fs"),
      import("node:fs/promises"),
      import("node:path"),
      import("node:sqlite")
    ]);

  const dbPath = resolve(process.cwd(), ".wrangler/state/local-dev/homepage.sqlite");
  if (existsSync(dbPath)) {
    await rm(dbPath);
  }

  await mkdir(dirname(dbPath), { recursive: true });
  const db = new sqlite.DatabaseSync(dbPath);
  try {
    db.exec(await readFile(resolve(process.cwd(), "db/schema.sql"), "utf8"));
    db.exec(await readFile(resolve(process.cwd(), "db/seed.sql"), "utf8"));
  } finally {
    db.close();
  }

  globalState.__homepageLocalDevRuntime = undefined;
}

async function createLocalDevRuntime(): Promise<LocalDevRuntime> {
  const env = await loadLocalDevVars();
  const db = await createLocalDevDatabase();
  return { env, db };
}

async function loadLocalDevVars() {
  const [{ existsSync }, { readFile }] = await Promise.all([
    import("node:fs"),
    import("node:fs/promises")
  ]);

  const filePath = `${process.cwd()}/.dev.vars`;
  const values: Record<string, string> = {};

  if (existsSync(filePath)) {
    const source = await readFile(filePath, "utf8");
    for (const line of source.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex <= 0) continue;
      const key = trimmed.slice(0, separatorIndex).trim();
      const rawValue = trimmed.slice(separatorIndex + 1).trim();
      values[key] = normalizeDevVarValue(rawValue);
    }
  }

  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value === "string") {
      values[key] = value;
    }
  }

  return values;
}

function normalizeDevVarValue(rawValue: string) {
  if (
    (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
    (rawValue.startsWith("'") && rawValue.endsWith("'"))
  ) {
    return rawValue.slice(1, -1);
  }

  return rawValue;
}

async function createLocalDevDatabase() {
  const [{ mkdir, readFile }, { dirname, resolve }, sqlite] =
    await Promise.all([
      import("node:fs/promises"),
      import("node:path"),
      import("node:sqlite")
    ]);

  const dbPath = resolve(process.cwd(), ".wrangler/state/local-dev/homepage.sqlite");
  await mkdir(dirname(dbPath), { recursive: true });

  const db = new sqlite.DatabaseSync(dbPath);
  const hasTables = checkIfSchemaExists(db);

  if (!hasTables) {
    db.exec(await readFile(resolve(process.cwd(), "db/schema.sql"), "utf8"));
    db.exec(await readFile(resolve(process.cwd(), "db/seed.sql"), "utf8"));
  } else {
    await applyLocalDevMigrations(db);
  }

  return createD1Adapter(db);
}

function checkIfSchemaExists(db: SQLiteDatabase) {
  const row = db
    .prepare(
      "select name from sqlite_master where type = 'table' and name in ('posts', 'works', 'site_settings', 'inquiries') limit 1"
    )
    .get() as { name?: string } | undefined;
  return Boolean(row?.name);
}

async function applyLocalDevMigrations(db: SQLiteDatabase) {
  const [{ readFile }, { resolve }] = await Promise.all([
    import("node:fs/promises"),
    import("node:path")
  ]);

  const columns = db
    .prepare("pragma table_info(posts)")
    .all() as Array<{ name?: string }>;
  const hasVisibilityColumn = columns.some((column) => column.name === "visibility");
  if (!hasVisibilityColumn) {
    db.exec(
      await readFile(
        resolve(process.cwd(), "db/migrations/0002_posts_visibility.sql"),
        "utf8"
      )
    );
  }
}

function createD1Adapter(db: SQLiteDatabase): D1DatabaseLike {
  return {
    prepare(query: string) {
      return {
        bind(...values: unknown[]) {
          return {
            async all<T>() {
              const statement = db.prepare(query);
              return { results: statement.all(...values) as T[] };
            },
            async first<T>() {
              const statement = db.prepare(query);
              return (statement.get(...values) as T | undefined) ?? null;
            },
            async run() {
              const statement = db.prepare(query);
              return statement.run(...values);
            }
          };
        }
      };
    }
  };
}

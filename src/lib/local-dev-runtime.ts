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

type LocalMediaObject = {
  httpMetadata?: {
    contentType?: string;
    contentDisposition?: string;
    cacheControl?: string;
  };
  arrayBuffer(): Promise<ArrayBuffer>;
  body: ReadableStream<Uint8Array> | null;
};

type LocalMediaBucket = {
  put: (
    key: string,
    value: ArrayBuffer | Uint8Array | ReadableStream<Uint8Array>,
    options?: {
      httpMetadata?: LocalMediaObject["httpMetadata"];
      customMetadata?: Record<string, string>;
    }
  ) => Promise<void>;
  get: (key: string) => Promise<LocalMediaObject | null>;
};

type LocalDevRuntime = {
  db: D1DatabaseLike;
  mediaBucket: LocalMediaBucket;
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
  const [db, mediaBucket] = await Promise.all([
    createLocalDevDatabase(),
    createLocalMediaBucket()
  ]);
  return { env, db, mediaBucket };
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

  const mediaAssetTable = db
    .prepare(
      "select name from sqlite_master where type = 'table' and name = 'media_assets' limit 1"
    )
    .get() as { name?: string } | undefined;
  if (!mediaAssetTable?.name) {
    db.exec(
      await readFile(
        resolve(process.cwd(), "db/migrations/0003_media_assets.sql"),
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

async function createLocalMediaBucket(): Promise<LocalMediaBucket> {
  const [{ mkdir, readFile, writeFile }, pathModule] = await Promise.all([
    import("node:fs/promises"),
    import("node:path")
  ]);

  const rootDir = pathModule.resolve(process.cwd(), ".wrangler/state/local-dev/media");
  await mkdir(rootDir, { recursive: true });

  function resolveKeyPath(key: string) {
    const segments = key.split("/").filter(Boolean);
    if (segments.length === 0 || segments.some((segment) => segment === "." || segment === "..")) {
      throw new Error("INVALID_MEDIA_KEY");
    }
    return pathModule.join(rootDir, ...segments);
  }

  return {
    async put(key, value, options) {
      const filePath = resolveKeyPath(key);
      const metadataPath = `${filePath}.meta.json`;
      await mkdir(pathModule.dirname(filePath), { recursive: true });
      const bytes = await readBytesFromValue(value);
      await writeFile(filePath, bytes);
      await writeFile(
        metadataPath,
        JSON.stringify(
          {
            httpMetadata: options?.httpMetadata ?? {},
            customMetadata: options?.customMetadata ?? {}
          },
          null,
          2
        ),
        "utf8"
      );
    },
    async get(key) {
      const filePath = resolveKeyPath(key);
      const metadataPath = `${filePath}.meta.json`;

      try {
        const [fileBuffer, metadataSource] = await Promise.all([
          readFile(filePath),
          readFile(metadataPath, "utf8").catch(() => "")
        ]);
        const metadata = metadataSource
          ? (JSON.parse(metadataSource) as {
              httpMetadata?: LocalMediaObject["httpMetadata"];
            })
          : {};
        const bytes = new Uint8Array(fileBuffer);
        return {
          httpMetadata: metadata.httpMetadata,
          async arrayBuffer() {
            return bytes.buffer.slice(
              bytes.byteOffset,
              bytes.byteOffset + bytes.byteLength
            );
          },
          body: new Blob([bytes], {
            type: metadata.httpMetadata?.contentType || "application/octet-stream"
          }).stream()
        };
      } catch (error) {
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === "ENOENT"
        ) {
          return null;
        }
        throw error;
      }
    }
  };
}

async function readBytesFromValue(
  value: ArrayBuffer | Uint8Array | ReadableStream<Uint8Array>
) {
  if (value instanceof ArrayBuffer) {
    return new Uint8Array(value);
  }

  if (value instanceof Uint8Array) {
    return value;
  }

  const reader = value.getReader();
  const chunks: Uint8Array[] = [];
  let totalLength = 0;

  while (true) {
    const { done, value: chunk } = await reader.read();
    if (done) break;
    if (!chunk) continue;
    chunks.push(chunk);
    totalLength += chunk.byteLength;
  }

  const bytes = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return bytes;
}

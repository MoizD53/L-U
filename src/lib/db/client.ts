import { createClient, type Client } from "@libsql/client";

declare global {
  // eslint-disable-next-line no-var
  var __libsql_client: Client | undefined;
}

function getDatabaseClient(): Client {
  if (process.env.NODE_ENV === "production") {
    const url = process.env.DATABASE_URL || "file:levelup.db";
    const authToken = process.env.TURSO_AUTH_TOKEN || undefined;
    return createClient({ url, authToken });
  }

  if (!global.__libsql_client) {
    const url = process.env.DATABASE_URL || "file:levelup.db";
    const authToken = process.env.TURSO_AUTH_TOKEN || undefined;
    global.__libsql_client = createClient({ url, authToken });
  }

  return global.__libsql_client;
}

export const db = getDatabaseClient();

export default db;

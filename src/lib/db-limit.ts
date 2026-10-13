// Caps how many queries run at once so postgres.js never pipelines.
//
// When every pooled connection is busy, postgres.js sends further queries down a busy
// connection without waiting for the previous reply (pipelining). Supabase's transaction-mode
// pooler loses those replies, so the request hangs until the platform kills it (Vercel: 300 s)
// and keeps holding the connection, stalling later requests too. A page such as the home page
// runs more queries in parallel than the pool has connections, so it always hit this.
//
// Queries are lazy in postgres.js: they start when first awaited (`then`). The wrapper delays
// that until a slot is free, so at most `max` queries (= pool size) are ever in flight and each
// connection carries one query at a time. Fragments nested inside other queries are never
// awaited themselves and pass through untouched. `begin` holds one slot for the whole
// transaction; queries on the transaction handle (`tx`) run on its reserved connection.
import type postgres from "postgres";

type Sql = ReturnType<typeof postgres>;

export function createLimiter(max: number) {
  let active = 0;
  const waiting: (() => void)[] = [];
  return {
    async run<T>(fn: () => PromiseLike<T>): Promise<T> {
      if (active >= max) await new Promise<void>((resolve) => waiting.push(resolve));
      else active++;
      try {
        return await fn();
      } finally {
        const next = waiting.shift();
        if (next) next(); // hand the slot over directly
        else active--;
      }
    },
    get active() {
      return active;
    },
  };
}

type Limiter = ReturnType<typeof createLimiter>;

function gate<T>(query: T, limiter: Limiter): T {
  if (!(query instanceof Promise)) return query; // helpers like sql(obj) / sql.json(x)
  // postgres.js starts the query from then/catch/finally, so all three go through the gate.
  const start = query.then.bind(query);
  let gated: Promise<unknown> | undefined;
  const run = () => (gated ??= limiter.run(() => new Promise((resolve, reject) => start(resolve, reject))));
  const define = (name: string, value: unknown) => Object.defineProperty(query, name, { configurable: true, value });
  define("then", (onFulfilled?: (v: unknown) => unknown, onRejected?: (e: unknown) => unknown) =>
    run().then(onFulfilled, onRejected),
  );
  define("catch", (onRejected?: (e: unknown) => unknown) => run().catch(onRejected));
  define("finally", (onFinally?: () => void) => run().finally(onFinally));
  return query;
}

/** Wraps a postgres.js client so no more than `max` queries are in flight at once. */
export function limitConcurrency(sql: Sql, max: number): Sql {
  const limiter = createLimiter(Math.max(1, max));
  return new Proxy(sql, {
    apply(target, thisArg, args) {
      return gate(Reflect.apply(target, thisArg, args), limiter);
    },
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (prop === "unsafe") {
        return (...args: Parameters<Sql["unsafe"]>) => gate(target.unsafe(...args), limiter);
      }
      if (prop === "begin") {
        return (...args: unknown[]) => limiter.run(() => (target.begin as (...a: unknown[]) => Promise<unknown>)(...args));
      }
      return value;
    },
  });
}

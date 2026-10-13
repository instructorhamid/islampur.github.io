import { describe, expect, it } from "vitest";
import type postgres from "postgres";
import { limitConcurrency } from "@/lib/db-limit";

type Sql = ReturnType<typeof postgres>;

// Mimics postgres.js: a query is a Promise subclass that only starts when then/catch/finally is called.
function fakeSql() {
  const stats = { inFlight: 0, peak: 0, started: 0 };
  class Query extends Promise<string> {
    static get [Symbol.species]() {
      return Promise;
    }
    private executed = false;
    private settle!: { resolve: (v: string) => void; reject: (e: unknown) => void };
    constructor(private readonly text: string) {
      let settle!: Query["settle"];
      super((resolve, reject) => (settle = { resolve, reject }));
      this.settle = settle;
    }
    private handle() {
      if (this.executed) return;
      this.executed = true;
      stats.started++;
      stats.peak = Math.max(stats.peak, ++stats.inFlight);
      setTimeout(() => {
        stats.inFlight--;
        if (this.text === "fail") this.settle.reject(new Error("boom"));
        else this.settle.resolve(this.text);
      }, 5);
    }
    then<A = string, B = never>(f?: ((v: string) => A | PromiseLike<A>) | null, r?: ((e: unknown) => B | PromiseLike<B>) | null) {
      this.handle();
      return super.then(f, r);
    }
    catch<B = never>(r?: ((e: unknown) => B | PromiseLike<B>) | null) {
      this.handle();
      return super.catch(r);
    }
    finally(f?: (() => void) | null) {
      this.handle();
      return super.finally(f);
    }
  }
  const sql = Object.assign((strings: TemplateStringsArray) => new Query(strings.join("")), {
    unsafe: (text: string) => new Query(text),
    json: (x: unknown) => ({ json: x }),
    begin: async (fn: (tx: unknown) => Promise<unknown>) => fn("tx"),
  });
  return { sql: sql as unknown as Sql, stats };
}

describe("limitConcurrency", () => {
  it("never runs more queries at once than the pool size", async () => {
    const { sql: raw, stats } = fakeSql();
    const sql = limitConcurrency(raw, 3);
    const results = await Promise.all(Array.from({ length: 10 }, (_, i) => sql.unsafe(`q${i}`)));
    expect(results).toEqual(Array.from({ length: 10 }, (_, i) => `q${i}`));
    expect(stats.peak).toBe(3);
    expect(stats.started).toBe(10);
  });

  it("gates catch and finally as well, and frees the slot on errors", async () => {
    const { sql: raw, stats } = fakeSql();
    const sql = limitConcurrency(raw, 1);
    const caught = await sql.unsafe("fail").catch((e: Error) => e.message);
    const done: string[] = [];
    await Promise.all([sql.unsafe("a").finally(() => done.push("a")), sql`b`.finally(() => done.push("b"))]);
    expect(caught).toBe("boom");
    expect(done.sort()).toEqual(["a", "b"]);
    expect(stats.peak).toBe(1);
  });

  it("does not start queries that are never awaited (fragments) and passes helpers through", async () => {
    const { sql: raw, stats } = fakeSql();
    const sql = limitConcurrency(raw, 2);
    const fragment = sql`fragment`;
    expect(fragment).toBeInstanceOf(Promise);
    expect(sql.json({ a: 1 } as never)).toEqual({ json: { a: 1 } });
    await new Promise((r) => setTimeout(r, 10));
    expect(stats.started).toBe(0);
  });

  it("holds a slot for the whole transaction", async () => {
    const { sql: raw, stats } = fakeSql();
    const sql = limitConcurrency(raw, 1);
    const order: string[] = [];
    await Promise.all([
      sql.begin(async () => {
        order.push("tx start");
        await new Promise((r) => setTimeout(r, 20));
        order.push("tx end");
      }),
      sql.unsafe("after").then(() => order.push("query")),
    ]);
    expect(order).toEqual(["tx start", "tx end", "query"]);
    expect(stats.peak).toBe(1);
  });
});

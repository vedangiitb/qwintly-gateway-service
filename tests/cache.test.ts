import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryCache } from "../src/services/cache";

describe("MemoryCache", () => {
  let cache: MemoryCache<string>;

  beforeEach(() => {
    cache = new MemoryCache<string>();
    vi.useFakeTimers();
  });

  it("should set and get values", () => {
    cache.set("key1", "val1", 1000);
    expect(cache.get("key1")).toBe("val1");
  });

  it("should return undefined for missing keys", () => {
    expect(cache.get("nonexistent")).toBeUndefined();
  });

  it("should expire values after TTL", () => {
    cache.set("key1", "val1", 1000);
    expect(cache.get("key1")).toBe("val1");

    vi.advanceTimersByTime(1001);
    expect(cache.get("key1")).toBeUndefined();
  });

  it("should delete values", () => {
    cache.set("key1", "val1", 1000);
    cache.delete("key1");
    expect(cache.get("key1")).toBeUndefined();
  });

  it("should clear all values", () => {
    cache.set("key1", "val1", 1000);
    cache.set("key2", "val2", 1000);
    cache.clear();
    expect(cache.get("key1")).toBeUndefined();
    expect(cache.get("key2")).toBeUndefined();
  });
});

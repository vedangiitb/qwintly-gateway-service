export interface ICache<K, V> {
  get(key: K): V | undefined;
  set(key: K, value: V, ttlMs: number): void;
  delete(key: K): void;
  clear(): void;
}

export class MemoryCache<V> implements ICache<string, V> {
  private readonly cache = new Map<string, { value: V; expiresAt: number }>();

  get(key: string): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  set(key: string, value: V, ttlMs: number): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

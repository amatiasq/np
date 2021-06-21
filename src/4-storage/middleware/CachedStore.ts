import { debugMethods } from '../../util/debugMethods';
import { AsyncStore } from '../AsyncStore';

class MemoryCache<T> {
  private readonly data = new Map<string, unknown>();
  private readonly time = new Map<string, number>();

  constructor(private readonly duration: number) {}

  has(key: string) {
    const time = this.time.get(key);
    if (time == null) return false;
    const seconds = (Date.now() - time) / 1000;
    const expired = seconds > this.duration;

    if (expired) {
      this.time.delete(key);
      this.data.delete(key);
    }

    return !expired;
  }

  get(key: string) {
    // if (!this.has(key)) {
    //   throw new Error('use HAS you idiot');
    // }

    return this.data.get(key) as T;
  }

  set(key: string, value: T) {
    this.time.set(key, Date.now());
    this.data.set(key, value);
  }
}

export class CachedStore<ReadOptions, WriteOptions>
  implements AsyncStore<ReadOptions, WriteOptions>
{
  private readonly keysCache = new MemoryCache<Promise<string[]>>(this.seconds);
  private readonly cache = new MemoryCache<Promise<string | null>>(
    this.seconds,
  );

  constructor(
    private readonly store: AsyncStore<ReadOptions, WriteOptions>,
    private readonly seconds: number,
    label: string,
  ) {
    debugMethods(this, ['has', 'keys', 'read', 'write', 'delete'], label);
  }

  keys() {
    if (this.keysCache.has('.')) {
      return this.keysCache.get('.');
    }

    const promise = this.store.keys();
    this.keysCache.set('.', promise);
    return promise;
  }

  has(key: string) {
    return this.store.has(key);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  read(key: string, options?: ReadOptions) {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    const promise = this.store.read(key);
    this.cache.set(key, promise);
    return promise;
  }

  write(key: string, value: string, options?: WriteOptions): Promise<void> {
    this.cache.set(key, Promise.resolve(value));
    return this.store.write(key, value, options);
  }

  delete(key: string): Promise<void> {
    this.cache.set(key, Promise.resolve(null));
    return this.store.delete(key);
  }
}
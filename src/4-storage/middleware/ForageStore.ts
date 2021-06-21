import { debugMethods } from '../../util/debugMethods';
import { AsyncStore, NoOptions } from '../AsyncStore';

export class ForageStore implements AsyncStore {
  constructor(private readonly forage: LocalForage) {
    debugMethods(this, ['has', 'keys', 'read', 'write', 'delete']);
  }

  keys() {
    return this.forage.keys();
  }

  async has(key: string) {
    const keys = await this.forage.keys();
    return keys.includes(key);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  read(key: string, options?: NoOptions) {
    return this.forage.getItem<string>(key);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async write(key: string, value: string, options?: NoOptions) {
    await this.forage.setItem(key, value);
  }

  async delete(key: string) {
    await this.forage.removeItem(key);
  }
}
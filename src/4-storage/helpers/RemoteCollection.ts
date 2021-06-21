import { map } from 'rxjs/operators';

import { deserialize, serialize } from '../../util/serialization';
import { FinalStore } from '../index';
import { RemoteValue } from './RemoteValue';

const findById =
  <T extends { id: Id }, Id>(id: Id) =>
  (list: T[]) =>
    list.find(x => x.id === id) || null;

export class RemoteCollection<Type extends { id: Id }, Id> extends RemoteValue<
  Type[]
> {
  constructor(store: FinalStore, key: string) {
    super(store, key, [], serialize, deserialize);
  }

  watchItem(id: Id) {
    return this.watch([]).pipe(map(findById(id)));
  }

  item(id: Id) {
    return this.read().then(findById(id));
  }

  async add(item: Type) {
    const list = await this.read();
    return this.write([item, ...list]);
  }

  async edit(id: Id, editor: (item: Type) => Type) {
    const list = await this.read();
    const index = list.findIndex(x => x.id === id);
    const item = list[index];
    const newItem = editor(item);
    list[index] = newItem;
    await this.write(list);
    return newItem;
  }

  async remove(id: Id) {
    const list = await this.read();
    const index = list.findIndex(x => x.id === id);
    if (index === -1) return null;
    const item = list[index];
    list.splice(index, 1);
    await this.write(list);
    return item;
  }
}
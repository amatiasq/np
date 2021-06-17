import { Observable } from 'rxjs';
import {
  catchError,
  distinctUntilChanged,
  mergeWith,
  throttleTime
} from 'rxjs/operators';
import { v4 as uuid } from 'uuid';

import {
  getMetadataFromContent,
  Note,
  NoteContent,
  NoteId
} from '../2-entities/Note';
import { DEFAULT_SETTINGS } from '../2-entities/Settings';
import { DEFAULT_SHORTCUTS } from '../2-entities/Shortcuts';
import { serialize } from '../util/serialization';
import { RemoteCollection } from './helpers/RemoteCollection';
import { RemoteString } from './helpers/RemoteString';
import { subjectWithChannels } from './helpers/subjectWithChannels';
import { FinalStore, FinalWriteOptions } from './index';

export class AppStorage {
  readonly settings = new RemoteString(
    this.store,
    'settings.json',
    serialize(DEFAULT_SETTINGS),
  );

  readonly shortcuts = new RemoteString(
    this.store,
    'shortcuts.json',
    serialize(DEFAULT_SHORTCUTS),
  );

  private readonly notes = new RemoteCollection<Note, NoteId>(
    this.store,
    'README.md',
  );

  private readonly noteChanged = subjectWithChannels<Note | null>();
  private readonly noteTitleUpdated = subjectWithChannels<string>();
  private readonly noteContentChanged = subjectWithChannels<NoteContent>();

  constructor(private readonly store: FinalStore) {}

  getNotes() {
    return this.notes.watch();
  }

  getNote(id: NoteId) {
    return this.notes.item(id).pipe(mergeWith(this.noteChanged(id)));
  }

  async createNote(content?: NoteContent) {
    const note = createNote(content || ('' as NoteContent));
    await this.notes.add(note);
    return note;
  }

  async deleteNote(id: NoteId) {
    const contentFile = getFilePath(id);
    const hasContent = await this.store.has(contentFile);

    await Promise.all([
      this.notes.remove(id),
      hasContent ? this.store.delete(contentFile) : null,
    ]);

    this.noteChanged(id).next(null);
  }

  updateNoteContent(id: NoteId, content: NoteContent) {
    const { title } = getMetadataFromContent(content);
    this.noteTitleUpdated(id).next(title);
  }

  onNoteTitleChanged(id: NoteId) {
    return new Observable<string>(x =>
      this.noteTitleUpdated(id).subscribe(x),
    ).pipe(throttleTime(100), distinctUntilChanged());
  }

  readNoteContent(id: NoteId) {
    return this.store.read(getFilePath(id)).pipe(catchError(() => ''));
  }

  async saveNoteContent(
    id: NoteId,
    content: NoteContent,
    options?: FinalWriteOptions,
  ) {
    const { title, group } = getMetadataFromContent(content);

    const [note] = await Promise.all([
      this.notes.edit(id, x => ({ ...x, title, group, modified: new Date() })),
      this.store.write(getFilePath(id), content, options),
    ]);

    this.noteContentChanged(id).next(content);
    return note;
  }

  async toggleFavorite(id: NoteId) {
    const note = await this.notes.edit(id, x => ({
      ...x,
      favorite: !x.favorite,
    }));

    this.noteChanged(id).next(note);
    return note;
  }

  async setGroup(group: string | null, ids: NoteId[]) {
    const notes = await this.notes.asPromise();

    const updated = ids.map(id => {
      const index = notes.findIndex(x => x.id === id);
      if (index === -1) throw new Error('WTF');
      const old = notes[index];
      const note = { ...old, group };
      notes[index] = note;
      return note;
    });

    await this.notes.write(notes);

    for (const note of updated) {
      this.noteChanged(note.id).next(note);
    }

    return updated;
  }
}

function createNote(content: NoteContent): Note {
  const { title } = getMetadataFromContent(content);

  return {
    id: uuid() as NoteId,
    title,
    favorite: true,
    group: null,
    created: new Date(),
    modified: new Date(),
  };
}

function getFilePath(id: NoteId) {
  return /(\.\w+)+$/.test(id) ? `notes/${id}` : `notes/${id}.md`;
}

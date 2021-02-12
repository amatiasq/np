import { RawGistDetails, RawGistItem } from '../contracts/RawGist';
import { GistId } from '../contracts/type-aliases';
import { UpdateGistRequest } from '../contracts/UpdateGistRequest';
import { getGithubHeaders } from '../hooks/useGithubAuth';
import { DELETE, GET, PATCH, POST } from './api';
import { busyWhile } from './busy-indicator';
import { notifyGistChanged, notifyGistListChanged } from './cache-invalidation';

export const GH_API = 'https://api.github.com';

export const DEFAULT_FILE_CONTENT = 'Empty!\n';

const DEFAULT_GIST_CONTENT = {
  public: false,
  files: { 'New gist.md': { content: DEFAULT_FILE_CONTENT } },
};

function url(path: string) {
  const result = `${GH_API}${path}`;
  const booster = `p=${Date.now()}`;
  return result.includes('?') ? `${result}&${booster}` : `${result}?${booster}`;
}

export const fetchGists = (page = 1) =>
  busyWhile(
    GET<RawGistItem[]>(url(`/gists?per_page=100&page=${page}`), withAuth()),
  );

export const fetchGist = (id: GistId) =>
  busyWhile(GET<RawGistDetails>(url(`/gists/${id}`), withAuth()));

export const removeGist = (id: GistId) =>
  busyWhile(
    DELETE<unknown>(url(`/gists/${id}`), withAuth()).finally(
      notifyGistListChanged,
    ),
  );

export const addGileToGist = (id: GistId, name: string, content: string) =>
  updateGist(id, { files: { [name]: { content } } });

export const removeFileFromGist = (id: GistId, name: string) =>
  updateGist(id, { files: { [name]: null } });

export const setFileContent = (id: GistId, filename: string, content: string) =>
  updateGist(id, { files: { [filename]: { content } } });

export const renameGistFile = (id: GistId, oldName: string, newName: string) =>
  updateGist(id, { files: { [oldName]: { filename: newName } } });

export function createGist(body: UpdateGistRequest = {}) {
  return busyWhile(
    POST<RawGistDetails>(
      url(`/gists`),
      { ...DEFAULT_GIST_CONTENT, ...body },
      withAuth(),
    ).finally(notifyGistListChanged),
  );
}

export function updateGist(id: GistId, body: UpdateGistRequest) {
  return busyWhile(
    PATCH<RawGistDetails>(
      url(`/gists/${id}`),
      JSON.stringify(body),
      withAuth(),
    ).then(raw => {
      notifyGistChanged(raw);
      return raw;
    }),
  );
}

function withAuth() {
  const headers = getGithubHeaders();
  return { headers };
}

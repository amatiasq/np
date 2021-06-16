import React from 'react';
import { Route } from 'react-router-dom';

import { useNavigator } from '../6-hooks/useNavigator';
import { useShortcut } from '../6-hooks/useShortcut';
import { NotesList } from '../7-components/NotesList/NotesList';
import { EditNoteFromUrl } from '../7-components/routes/EditNoteFromUrl';
import { EditSettings } from '../7-components/routes/EditSettings';

export function Router() {
  const navigator = useNavigator();

  useShortcut('settings', () => navigator.goSettings());

  return (
    <>
      <NotesList />
      {/* <Route path="/" component={Placeholder} exact /> */}
      {/* <Route path="/sketch" component={SketchPad} /> */}
      <Route path="/settings" component={EditSettings} />
      <Route path={navigator.note} component={EditNoteFromUrl}></Route>
      {/* <Route path="/gist/:gistId/:filename" component={EditGistFromUrl}></Route> */}
    </>
  );
}

import './App.scss';

import React, { useEffect, useState } from 'react';
import { render } from 'react-dom';
import { BrowserRouter } from 'react-router-dom';

import { createStore } from '../4-storage';
import { AppStorage } from '../4-storage/AppStorage';
import { useNavigator } from '../6-hooks/useNavigator';
import { Loader } from '../7-components/atoms/Loader';
import { AppStorageContext } from './contexts';
import { Router } from './Router';
import { useGithubAuth } from './useGithubAuth';

function App() {
  const [store, setStore] = useState<AppStorage>(null!);
  const { token, username } = useGithubAuth();
  const navigator = useNavigator();
  const [pageName, setPageName] = useState(navigator.getPageName());

  useEffect(() => {
    if (!token || !username) return;
    createStore(token, username, 'pensieve-data').then(x =>
      setStore(new AppStorage(x)),
    );
  }, [token]);

  useEffect(() =>
    navigator.onNavigate(next => setPageName(next.getPageName())),
  );

  if (!store) {
    return <Loader />;
  }

  return (
    <AppStorageContext.Provider value={store}>
      <div className={`app page-${pageName}`}>
        <Router />
      </div>
    </AppStorageContext.Provider>
  );
}

export function renderApp(container: HTMLElement): void {
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>,
    container,
  );
}
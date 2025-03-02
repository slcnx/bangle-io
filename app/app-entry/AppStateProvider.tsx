import React, { useEffect, useLayoutEffect } from 'react';
import { useHistory } from 'react-router-dom';

import {
  BangleStoreChanged,
  BangleStoreContext,
} from '@bangle.io/app-state-context';
import { initializeBangleStore } from '@bangle.io/bangle-store';
import { editorManagerSliceKey } from '@bangle.io/editor-manager-context';
import { setHistoryObject } from '@bangle.io/page-context';
import { safeRequestIdleCallback } from '@bangle.io/utils';

const LOG = false;

const log = LOG ? console.log.bind(console, 'AppStateContext') : () => {};

export function AppStateProvider({
  bangleStore,
  bangleStoreChanged,
  children,
}: {
  bangleStoreChanged: number;
  bangleStore: ReturnType<typeof initializeBangleStore>;
  children: React.ReactNode;
}) {
  const history = useHistory();

  useLayoutEffect(() => {
    setHistoryObject(history)(bangleStore.state, bangleStore.dispatch);
  }, [bangleStore, history]);

  useEffect(() => {
    // TODO: this setup should be done in app
    safeRequestIdleCallback(() => {
      if (
        typeof window !== 'undefined' &&
        window.location?.hash?.includes('debug_pm')
      ) {
        const primaryEditor = editorManagerSliceKey.getSliceState(
          bangleStore.state,
        )?.primaryEditor;
        if (primaryEditor) {
          console.log('debugging pm');
          import(
            /* webpackChunkName: "prosemirror-dev-tools" */ 'prosemirror-dev-tools'
          ).then((args) => {
            args.applyDevTools(primaryEditor!.view);
          });
        }
      }
    });
  }, [bangleStore.state]);

  return (
    <BangleStoreContext.Provider value={bangleStore}>
      <BangleStoreChanged.Provider value={bangleStoreChanged}>
        {children}
      </BangleStoreChanged.Provider>
    </BangleStoreContext.Provider>
  );
}

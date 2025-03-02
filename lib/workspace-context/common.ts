import {
  ApplicationStore,
  SliceKey,
  SliceSideEffect,
} from '@bangle.io/create-store';

import type { WorkspaceSliceState } from './workspace-slice-state';

export const workspaceSliceKey = new SliceKey<
  WorkspaceSliceState,
  WorkspaceSliceAction
>('workspace-slice');

export type SideEffect = SliceSideEffect<
  WorkspaceSliceState,
  WorkspaceSliceAction
>;

export type WorkspaceSliceAction =
  | {
      name: 'action::workspace-context:update-location';
      value: {
        locationSearchQuery: string | undefined;
        locationPathname: string | undefined;
      };
    }
  | {
      name: 'action::workspace-context:update-recently-used-ws-paths';
      value: {
        // the workspace corresponding to the wsPaths
        wsName: string;
        recentlyUsedWsPaths: string[] | undefined;
      };
    }
  | {
      name: 'action::workspace-context:update-ws-paths';
      value: {
        // the workspace corresponding to the wsPaths
        wsName: string;
        wsPaths: string[] | undefined;
      };
    };

export type WorkspaceDispatchType = ApplicationStore<
  WorkspaceSliceState,
  WorkspaceSliceAction
>['dispatch'];

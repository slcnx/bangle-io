import {
  BaseFileSystemError,
  NATIVE_BROWSER_PERMISSION_ERROR,
  requestNativeBrowserFSPermission,
  FILE_NOT_FOUND_ERROR,
} from 'baby-fs/index';
import React, { useEffect, useState } from 'react';
import { useCatchRejection } from 'utils/index';
import { useHistory, useLocation } from 'react-router-dom';
import { getWorkspaceInfo } from './workspace-helpers';
import { useWorkspacePath } from './workspace-hooks';
import { replaceHistoryState } from './history-utils';
import { WorkspaceError, WORKSPACE_NOT_FOUND_ERROR } from './errors';
import { resolvePath } from './path-helpers';

const LOG = false;
let log = LOG ? console.log.bind(console, 'workspace/index') : () => {};

export const NEEDS_PERMISSION = 'NEEDS_PERMISSION';
export const PERMISSION_DENIED = 'PERMISSION_DENIED';
export const READY = 'READY';
export const permissionStatuses = [NEEDS_PERMISSION, PERMISSION_DENIED];
export const WORKSPACE_NOT_FOUND = 'WORKSPACE_NOT_FOUND';

/**
 *
 * renderPermission - if workspace requires permission
 *    this render prop will rendered instead of the children
 */
export function Workspace({ children, renderPermission, renderNotFound }) {
  const { wsName, wsPath } = useWorkspacePath();
  const history = useHistory();
  const location = useLocation();
  const [workspaceStatus, updateWorkspaceStatus] = useState(READY);
  const [workspaceInfo, updateWorkspaceInfo] = useState();

  log('history', history);
  log('history state', location.state);
  log('history location', location);
  log('workspaceInfo', workspaceInfo);

  // reset status when wsName changes
  useEffect(() => {
    updateWorkspaceStatus(READY);
  }, [wsName]);

  useEffect(() => {
    let destroyed = false;
    if (wsName) {
      log('getting getWorkspaceInfo', wsName);
      getWorkspaceInfo(wsName).then((_workspaceInfo) => {
        if (!destroyed) {
          updateWorkspaceInfo(_workspaceInfo);
        }
      });
    }
    return () => {
      destroyed = true;
    };
  }, [wsName]);

  useEffect(() => {
    if (wsName) {
      document.title = wsPath
        ? `${resolvePath(wsPath).fileName} - bangle.io`
        : `${wsName} - bangle.io`;
    } else {
      document.title = 'bangle.io';
    }
  }, [wsPath, wsName]);

  useEffect(() => {
    if (!workspaceInfo) {
      return;
    }
    const state = location?.state;
    if (
      state?.workspaceInfo?.name === workspaceInfo?.name &&
      state?.workspaceStatus === workspaceStatus
    ) {
      log('history state synced');
      return;
    }
    log('replacing history state');
    // Persist workspaceInfo in the history to
    // prevent release of the native browser FS permission
    replaceHistoryState(history, {
      workspaceInfo,
      workspaceStatus: workspaceStatus,
    });
  }, [history, location, workspaceStatus, workspaceInfo]);

  useCatchRejection((e) => {
    const reason = e.reason;
    if (
      reason instanceof BaseFileSystemError &&
      reason.code === NATIVE_BROWSER_PERMISSION_ERROR
    ) {
      if (!permissionStatuses.includes(workspaceStatus)) {
        updateWorkspaceStatus(NEEDS_PERMISSION);
      }
      e.preventDefault();
    }

    if (
      reason instanceof WorkspaceError &&
      reason.code === WORKSPACE_NOT_FOUND_ERROR
    ) {
      if (workspaceStatus !== WORKSPACE_NOT_FOUND) {
        updateWorkspaceStatus(WORKSPACE_NOT_FOUND);
      }
      e.preventDefault();
    }

    // TODO This one is tricky as our babyfs doesnt really
    // support checking if a directory exists.
    // So right now it is made to throw this error
    // if there is a problem when rootDir goes missing.
    if (
      reason instanceof BaseFileSystemError &&
      reason.code === FILE_NOT_FOUND_ERROR
    ) {
      if (workspaceStatus !== WORKSPACE_NOT_FOUND) {
        updateWorkspaceStatus(WORKSPACE_NOT_FOUND);
      }
      e.preventDefault();
    }
  });

  if (permissionStatuses.includes(workspaceStatus)) {
    return renderPermission({
      wsName,
      // if the user denies explicitly in the prompt
      permissionDenied: workspaceStatus === PERMISSION_DENIED,
      requestFSPermission: async () => {
        const workspace = await getWorkspaceInfo(wsName);
        if (!workspace) {
          throw new Error('workspace not found');
        }
        if (workspace.type !== 'nativefs') {
          updateWorkspaceStatus(READY);
          return true;
        }
        const result = await requestNativeBrowserFSPermission(
          workspace.metadata.rootDirHandle,
        );
        if (result) {
          updateWorkspaceStatus(READY);
          return true;
        } else {
          updateWorkspaceStatus(PERMISSION_DENIED);
          return false;
        }
      },
    });
  }

  if (workspaceStatus === WORKSPACE_NOT_FOUND) {
    return renderNotFound({
      wsName,
    });
  }

  return children;
}
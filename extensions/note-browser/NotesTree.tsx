import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useVirtual } from 'react-virtual';

import { useActionContext } from '@bangle.io/action-context';
import {
  CORE_ACTIONS_NEW_NOTE,
  CORE_PALETTES_TOGGLE_WORKSPACE_PALETTE,
} from '@bangle.io/constants';
import {
  ButtonIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CloseIcon,
  DocumentAddIcon,
  NullIcon,
  Sidebar,
} from '@bangle.io/ui-components';
import { useUIManagerContext } from '@bangle.io/ui-context';
import {
  removeMdExtension,
  safeScrollIntoViewIfNeeded,
  useLocalStorage,
} from '@bangle.io/utils';
import {
  deleteNote,
  pushWsPath,
  useWorkspaceContext,
  WorkspaceContextType,
} from '@bangle.io/workspace-context';
import { filePathToWsPath, resolvePath } from '@bangle.io/ws-path';

import { fileWsPathsToFlatDirTree } from './file-ws-paths-to-flat-dir-tree';

const DEFAULT_FOLD_DEPTH = 2;
const PADDING_OFFSET = 16;
const BASE_PADDING = 16;

const rem =
  typeof window === 'undefined'
    ? 16
    : parseFloat(getComputedStyle(document.documentElement).fontSize);

const rowHeight = 1.5 * rem; // 1.75rem line height of text-lg

// TODO the current design just ignores empty directory
// TODO check if in widescreen sidebar is closed
export function NotesTree() {
  const { dispatch, widescreen } = useUIManagerContext();
  const {
    wsName,
    openedWsPaths,
    bangleStore,
    noteWsPaths = [],
  } = useWorkspaceContext();
  const { dispatchAction } = useActionContext();

  const { primaryWsPath } = openedWsPaths;
  const activeFilePath = primaryWsPath
    ? resolvePath(primaryWsPath).filePath
    : undefined;

  const closeSidebar = useCallback(() => {
    if (!widescreen) {
      dispatch({
        name: 'UI/CHANGE_SIDEBAR',
        value: { type: null },
      });
    }
  }, [dispatch, widescreen]);

  const createNewFile = useCallback(
    (path) => {
      dispatchAction({
        name: CORE_ACTIONS_NEW_NOTE,
        value: path,
      });
    },
    [dispatchAction],
  );

  if (!wsName) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <span
          className="text-sm font-extrabold cursor-pointer bangle-io_textColorLighter"
          onClick={() => {
            dispatchAction({
              name: CORE_PALETTES_TOGGLE_WORKSPACE_PALETTE,
            });
          }}
        >
          Please open a workspace
        </span>
      </div>
    );
  }

  if (noteWsPaths.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <span className="text-sm font-extrabold bangle-io_textColorLighter">
          No notes found
        </span>
      </div>
    );
  }

  return (
    <GenericFileBrowser
      wsName={wsName}
      files={noteWsPaths}
      bangleStore={bangleStore}
      activeFilePath={activeFilePath}
      closeSidebar={closeSidebar}
      createNewFile={createNewFile}
    />
  );
}
const IconStyle = {
  height: 16,
  width: 16,
};

export function GenericFileBrowser({
  wsName,
  files,
  bangleStore,
  activeFilePath,
  closeSidebar,
  createNewFile,
}: {
  wsName: string;
  files: string[];
  bangleStore: WorkspaceContextType['bangleStore'];
  activeFilePath?: string;
  closeSidebar: () => void;
  createNewFile: (path?: string) => void;
}) {
  const { filesAndDirList, dirSet } = useMemo(() => {
    return fileWsPathsToFlatDirTree(files);
  }, [files]);

  if (!wsName || filesAndDirList.length === 0) {
    return null;
  }

  return (
    <RenderItems
      wsName={wsName}
      filesAndDirList={filesAndDirList}
      dirSet={dirSet}
      bangleStore={bangleStore}
      activeFilePath={activeFilePath}
      closeSidebar={closeSidebar}
      createNewFile={createNewFile}
    />
  );
}

const RenderItems = React.memo(
  ({
    wsName,
    filesAndDirList,
    dirSet,
    bangleStore,
    activeFilePath,
    closeSidebar,
    createNewFile,
  }: {
    wsName: string;
    filesAndDirList: string[];
    dirSet: Set<string>;
    bangleStore: WorkspaceContextType['bangleStore'];
    activeFilePath?: string;
    closeSidebar: () => void;
    createNewFile: (path?: string) => void;
  }) => {
    const [collapsed, toggleCollapse] = useLocalStorage<string[]>(
      'RenderTree6261:' + wsName,
      () => {
        const result = filesAndDirList.filter(
          (path) =>
            dirSet.has(path) && path.split('/').length === DEFAULT_FOLD_DEPTH,
        );
        return result;
      },
    );

    // this exists as a ref so that we can use it later
    // but without depending on it
    const collapsedRef = useRef(collapsed);
    useEffect(() => {
      collapsedRef.current = collapsed;
    }, [collapsed]);

    // If there is an activeFilePath make sure that the file tree
    // is uncollapsed
    useEffect(() => {
      if (activeFilePath) {
        const parentsToKeep = collapsedRef.current.filter((r) => {
          return !activeFilePath.startsWith(r + '/');
        });
        if (parentsToKeep.length < collapsedRef.current.length) {
          toggleCollapse(parentsToKeep);
        }
      }
    }, [activeFilePath, toggleCollapse]);

    const parentRef = React.useRef<HTMLDivElement>(null);
    const rows = useMemo(() => {
      return filesAndDirList.filter((path) => {
        if (
          collapsed.some((collapseDirPath) =>
            path.startsWith(collapseDirPath + '/'),
          )
        ) {
          return false;
        }
        return true;
      });
    }, [filesAndDirList, collapsed]);

    const rowVirtualizer = useVirtual({
      size: rows.length,
      parentRef,
      overscan: 60,
      estimateSize: React.useCallback(() => {
        // NOTE its easy to trip this and make it run on every render

        return rowHeight;
      }, []),
      keyExtractor: useCallback((i: number) => rows[i]!, [rows]),
    });

    const result = rowVirtualizer.virtualItems.map((virtualRow) => {
      const path = rows[virtualRow.index]!;
      const isDir = dirSet.has(path);
      const wsPath = filePathToWsPath(wsName, path);
      const splittedPath = path.split('/');
      const depth = splittedPath.length;
      const name = removeMdExtension(splittedPath.pop() || 'Unknown file name');

      const onClick = (event) => {
        if (isDir) {
          toggleCollapse((array) => {
            if (array.includes(path)) {
              return array.filter((p) => p !== path);
            } else {
              return [...array, path];
            }
          });
          return;
        }
        if (event.metaKey) {
          pushWsPath(wsPath, true)(bangleStore.state, bangleStore.dispatch);
        } else if (event.shiftKey) {
          pushWsPath(
            wsPath,
            false,
            true,
          )(bangleStore.state, bangleStore.dispatch);
        } else {
          pushWsPath(wsPath)(bangleStore.state, bangleStore.dispatch);
        }
        closeSidebar();
      };

      return (
        <RenderRow
          key={path}
          virtualRow={virtualRow}
          path={path}
          isDir={isDir}
          wsPath={wsPath}
          name={name}
          depth={depth}
          isActive={activeFilePath === path}
          isCollapsed={collapsed.includes(path)}
          createNewFile={createNewFile}
          bangleStore={bangleStore}
          onClick={onClick}
        />
      );
    });

    return (
      <div ref={parentRef} style={{ height: '100%', overflow: 'auto' }}>
        <div
          style={{
            height: `${rowVirtualizer.totalSize}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {result}
        </div>
      </div>
    );
  },
);

function RenderRow({
  virtualRow,
  path,
  isDir,
  wsPath,
  name,
  depth,
  isActive,
  isCollapsed,
  bangleStore,
  onClick,
  createNewFile,
}: {
  virtualRow;
  path;
  isDir;
  wsPath;
  name;
  depth;
  isActive;
  isCollapsed;
  bangleStore: WorkspaceContextType['bangleStore'];
  onClick;
  createNewFile: (path?: string) => void;
}) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive) {
      elementRef.current &&
        safeScrollIntoViewIfNeeded(elementRef.current, false);
    }
  }, [isActive]);

  return (
    <div
      ref={elementRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: `${virtualRow.size}px`,
        transform: `translateY(${virtualRow.start}px)`,
      }}
    >
      <Sidebar.Row2
        isActive={isActive}
        onClick={onClick}
        // before changing this look at estimateSize of virtual
        titleClassName="text-base truncate select-none"
        style={{
          paddingLeft: depth * BASE_PADDING,
          paddingRight: PADDING_OFFSET,
        }}
        item={{
          uid: wsPath,
          showDividerAbove: false,
          title: name,
          leftNode: (
            <ButtonIcon onClick={async (e) => {}}>
              {isDir ? (
                isCollapsed ? (
                  <ChevronRightIcon style={IconStyle} />
                ) : (
                  <ChevronDownIcon style={IconStyle} />
                )
              ) : (
                <NullIcon style={IconStyle} />
              )}
            </ButtonIcon>
          ),
          rightHoverNode: isDir ? (
            <ButtonIcon
              hint="New file"
              onClick={async (e) => {
                e.stopPropagation();
                if (depth === 0) {
                  createNewFile();
                } else {
                  createNewFile(path + '/');
                }
              }}
              hintPos="bottom-right"
            >
              <DocumentAddIcon style={IconStyle} />
            </ButtonIcon>
          ) : (
            <ButtonIcon
              hint="Delete file"
              hintPos="bottom-right"
              onClick={async (e) => {
                e.stopPropagation();
                if (
                  window.confirm(`Are you sure you want to delete "${name}"? `)
                ) {
                  deleteNote(wsPath)(
                    bangleStore.state,
                    bangleStore.dispatch,
                    bangleStore,
                  );
                }
              }}
            >
              <CloseIcon style={IconStyle} />
            </ButtonIcon>
          ),
        }}
      />
    </div>
  );
}

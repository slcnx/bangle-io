import { useEditorManagerContext } from 'editor-manager-context';
import { useExtensionRegistryContext } from 'extension-registry';
import React, { useEffect, useState } from 'react';
import { CloseIcon } from 'ui-components';
import { cx, sleep, useDestroyRef } from 'utils';
import { useWorkspaceContext } from 'workspace-context';
import { resolvePath } from 'ws-path';
import { Editor } from './Editor';
import { EmptyEditorPage } from './EmptyEditorPage';

/**
 * This exists to save a render cycle
 * when incomingWsPath changes to something else
 * and while `checkFileExists` is doing its thing
 * we let the previous wsPath stay, to avoid an unwanted flash.
 * @param {*} incomingWsPath
 * @returns
 */
function useHandleWsPath(incomingWsPath) {
  const [wsPath, updateWsPath] = useState<string | undefined>(undefined);
  const [fileExists, updateFileExists] = useState<boolean | undefined>(
    undefined,
  );
  const { checkFileExists } = useWorkspaceContext();
  const destroyedRef = useDestroyRef();

  useEffect(() => {
    if (incomingWsPath) {
      checkFileExists(incomingWsPath).then((r) => {
        if (!destroyedRef.current) {
          updateFileExists(r);
          updateWsPath(incomingWsPath);
        }
      });
    }
    if (incomingWsPath == null && wsPath) {
      updateFileExists(undefined);
      updateWsPath(undefined);
    }
  }, [incomingWsPath, checkFileExists, wsPath, destroyedRef]);

  return { fileExists, wsPath };
}

export function EditorArea({
  id,
  className,
  editorId,
  showTabs,
  wsPath: incomingWsPath,
  onClose,
}) {
  const { fileExists, wsPath } = useHandleWsPath(incomingWsPath);
  const { setEditor } = useEditorManagerContext();
  const extensionRegistry = useExtensionRegistryContext();
  const [showEmptyEditor, updateShowEmptyEditor] = useState(false);

  // prevents unwarranted flash of empty editor by waiting
  // a certain time before showing the editor.
  useEffect(() => {
    let destroyed = false;
    if (!wsPath) {
      sleep(150).then(() => {
        if (!wsPath && !destroyed) {
          updateShowEmptyEditor(true);
        }
      });
    }
    if (wsPath && showEmptyEditor) {
      updateShowEmptyEditor(false);
    }
    return () => {
      destroyed = true;
    };
  }, [wsPath, showEmptyEditor]);

  return (
    <div id={id} className={cx('bangle-editor-area', className)}>
      {wsPath && showTabs ? <Tab wsPath={wsPath} onClose={onClose} /> : null}
      <div className={cx('bangle-editor-container', showTabs && 'has-tabs')}>
        {fileExists && wsPath && extensionRegistry && (
          <>
            <Editor
              // Key is used to reload the editor when wsPath changes
              key={wsPath}
              editorId={editorId}
              wsPath={wsPath}
              setEditor={setEditor}
              extensionRegistry={extensionRegistry}
            />
          </>
        )}
        {wsPath && fileExists === false && (
          <h3 className="text-xl sm:text-3xl lg:text-3xl leading-none font-bold  mb-8">
            🕵️‍♀️‍ Note "{wsPath ? resolvePath(wsPath).fileName : ''}" was not
            found
          </h3>
        )}
        {showEmptyEditor && <EmptyEditorPage />}
      </div>
    </div>
  );
}

function Tab({ wsPath, onClose }) {
  return (
    <div className="editor-tab">
      <span>{resolvePath(wsPath).fileName}</span>
      <button type="button" onClick={onClose} className={`focus:outline-none`}>
        <CloseIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
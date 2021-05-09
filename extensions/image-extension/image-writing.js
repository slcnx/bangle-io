import { useEditorViewContext } from '@bangle.dev/react';
import { useEffect } from 'react';
import { getDayJs } from 'utils/index';
import { IMAGE_SAVE_DIR } from './config';
import {
  filePathToWsPath,
  resolvePath,
  saveFile,
  useWorkspacePath,
} from 'workspace/index';

// TODO I need a better solution to access
// app contexts from inside of a pm plugin
const wsNameViewWeakStore = new WeakMap();

export function EditorImageComponent() {
  const view = useEditorViewContext();
  const { wsName } = useWorkspacePath();
  useEffect(() => {
    if (wsName) {
      wsNameViewWeakStore.set(view, wsName);
    }
    return () => {
      // I know weakmap will automatically clean it
      // but still :shrug
      wsNameViewWeakStore.delete(view);
    };
  }, [view, wsName]);
  return null;
}

export async function createImageNodes(files, imageType, view) {
  const sources = await Promise.all(
    files.map(async (file) => {
      const wsName = wsNameViewWeakStore.get(view);

      if (!wsName) {
        return Promise.resolve();
      }
      const { wsPath, srcUrl } = await createImage(file.name, wsName);

      await saveFile(wsPath, file);

      return srcUrl;
    }),
  );
  return sources.filter(Boolean).map((source) => {
    return imageType.create({
      src: source,
    });
  });
}

/**
 *
 * @param {*} fileName  - the filename name of the image
 * @param {*} wsName - the current wsName
 * @returns - a wsPath and srcUrl for the image
 */
export async function createImage(fileName, wsName) {
  const dotIndex = fileName.lastIndexOf('.');

  const name = dotIndex === -1 ? fileName : fileName.slice(0, dotIndex);
  const ext = dotIndex === -1 ? '' : fileName.slice(dotIndex);

  const dayJs = await getDayJs();
  const date = dayJs(Date.now()).format('YYYY-MM-DD-HH-mm-ss-SSS');
  const newFilename = `${name}-${date}${ext}`;
  const imageWsPath = filePathToWsPath(
    wsName,
    IMAGE_SAVE_DIR + '/' + newFilename,
  );

  // pre-pending a / to make it an absolute URL
  // since we are returning a web url we need to encode it
  return {
    wsPath: imageWsPath,
    srcUrl: encodeURI('/' + resolvePath(imageWsPath).filePath),
  };
}
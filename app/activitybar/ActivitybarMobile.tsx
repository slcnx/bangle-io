import React, { useEffect } from 'react';

import { useActionContext } from '@bangle.io/action-context';
import { CORE_PALETTES_TOGGLE_NOTES_PALETTE } from '@bangle.io/constants';
import { FileDocumentIcon } from '@bangle.io/ui-components';
import { resolvePath } from '@bangle.io/ws-path';

import { ActivitybarButton } from './ActivitybarButton';

export function ActivitybarMobile({
  primaryWsPath,
  wsName,
}: {
  primaryWsPath?: string;
  wsName?: string;
}) {
  const { dispatchAction } = useActionContext();

  return (
    <div className="flex flex-row ml-3 text-gray-100 align-center activitybar">
      <div className="flex flex-col justify-center mr-2">
        <ActivitybarButton
          hint="See files palette"
          widescreen={false}
          onPress={() => {
            dispatchAction({
              name: CORE_PALETTES_TOGGLE_NOTES_PALETTE,
            });
          }}
          icon={<FileDocumentIcon className="w-5 h-5" />}
        />
      </div>
      <div className="flex flex-col justify-center ml-2">
        <span>
          {primaryWsPath
            ? resolvePath(primaryWsPath).fileName
            : wsName || 'bangle-io'}
        </span>
      </div>
    </div>
  );
}

import { inlinePalette } from 'inline-palette/index';
import { Extension } from 'extension-helpers';
import { InlineBacklinkPalette } from './InlineBacklinkPalette';
import * as inlineBacklink from './inline-backlink-node';
import { extensionName, paletteMark, palettePluginKey } from './config';
import { renderReactNodeView } from './renderReactNodeView';

const getScrollContainer = (view) => {
  return view.dom.parentElement;
};

const extension = Extension.create({
  name: extensionName,
  editorSpecs: [
    inlineBacklink.spec(),
    inlinePalette.spec({
      markName: paletteMark,
      trigger: '[[',
    }),
  ],
  highPriorityEditorPlugins: [
    inlinePalette.plugins({
      key: palettePluginKey,
      markName: paletteMark,
      tooltipRenderOpts: {
        getScrollContainer,
      },
    }),
  ],
  editorPlugins: [inlineBacklink.plugins()],
  markdownItPlugins: [],
  editorReactComponent: InlineBacklinkPalette,
  renderReactNodeView: renderReactNodeView,
});

export default extension;
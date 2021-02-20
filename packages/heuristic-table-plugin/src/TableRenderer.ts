import React from 'react';
import { CustomBlockRenderer } from 'react-native-render-html';
import HTMLTable from './HTMLTable';
import tableModel from './models/tableModel';
import { HeuristicTablePluginConfig } from './shared-types';
import useHtmlTableProps from './useHtmlTableProps';

declare module 'react-native-render-html' {
  // eslint-disable-next-line no-shadow
  interface RenderersPropsBase {
    table?: HeuristicTablePluginConfig;
  }
}

/**
 * A 100% native renderer component for `table` tag.
 *
 * @param props - Component props.
 * @public
 */
const TableRenderer: CustomBlockRenderer = function (props) {
  return React.createElement(HTMLTable, useHtmlTableProps(props));
};

TableRenderer.model = tableModel;

export default TableRenderer;
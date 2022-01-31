/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { EuiFlexGroup, EuiFlexItem, EuiIcon, EuiLink, EuiTitle, EuiButtonIcon } from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n-react';
import React, { Fragment, useCallback, useMemo, useState } from 'react';
import { DiscoverNavigationProps } from '../../../utils/use_navigation_props';
import { getDocEditor, setDocEditorStart } from '../../../kibana_services';

interface TableRowDetailsProps {
  open: boolean;
  colLength: number;
  isTimeBased: boolean;
  singleDocProps: DiscoverNavigationProps;
  surrDocsProps: DiscoverNavigationProps;
  children: JSX.Element;
  showEditor: boolean;
  onEditorChange: any;
  hit: any;
}

export const TableRowDetails = ({
  open,
  colLength,
  isTimeBased,
  singleDocProps,
  surrDocsProps,
  children,
  hit,
  showEditor,
  onEditorChange,
}: TableRowDetailsProps) => {
  const [isOpen, setOpen] = useState(false);

  if (!open) {
    return null;
  }

  let flyout;

  if (isOpen) {
    const editor = getDocEditor();
    console.log('s', singleDocProps);
    console.log('s', hit);
    flyout = editor.renderFoobar({
      closeFlyout: () => {
        setOpen(false);
      },
      docId: hit._id,
      indexId: hit._index,
    });
  } else {
    flyout = <></>;
  }

  return (
    <td colSpan={(colLength || 1) + 2}>
      {flyout}
      <EuiFlexGroup gutterSize="l" justifyContent="spaceBetween" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiIcon type="folderOpen" size="m" />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiTitle size="xxs" data-test-subj="docTableRowDetailsTitle">
                <h4>
                  <FormattedMessage
                    id="discover.docTable.tableRow.detailHeading"
                    defaultMessage="Expanded document"
                  />
                </h4>
              </EuiTitle>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiFlexGroup gutterSize="l" alignItems="center" responsive={false}>
            <EuiFlexItem grow={false}>
              {isTimeBased && (
                <EuiLink data-test-subj="docTableRowAction" {...surrDocsProps}>
                  <FormattedMessage
                    id="discover.docTable.tableRow.viewSurroundingDocumentsLinkText"
                    defaultMessage="View surrounding documents"
                  />
                </EuiLink>
              )}
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiLink data-test-subj="docTableRowAction" {...singleDocProps}>
                <FormattedMessage
                  id="discover.docTable.tableRow.viewSingleDocumentLinkText"
                  defaultMessage="View single document"
                />
              </EuiLink>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonIcon
                onClick={() => {
                  console.log('set state true');
                  setOpen(true);
                }}
                iconType="pencil"
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
      <div data-test-subj="docViewer">{children}</div>
    </td>
  );
};

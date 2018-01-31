import React, { Component } from 'react';
import { all } from 'lodash';
import pluralize from 'pluralize';
import {
  EuiButton,
  EuiContextMenu,
  EuiIcon,
  EuiPopover,
  EuiConfirmModal,
  EuiOverlayMask
} from '@elastic/eui';
import { flattenPanelTree } from '../../../../lib/flatten_panel_tree';
import { INDEX_OPEN } from '../../../../../common/constants';

export class IndexActionsContextMenu extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isPopoverOpen: false,
      showDeleteConfirmation: false
    };
  }
  panels() {
    const {
      closeIndices,
      openIndices,
      forcemergeIndices,
      flushIndices,
      refreshIndices,
      clearCacheIndices,
      editIndex,
      showMapping,
      showStats,
      showSettings,
      detailPanel,
      indexNames,
      indexStatusByName
    } = this.props;
    const allOpen = all(indexNames, indexName => {
      return indexStatusByName[indexName] === INDEX_OPEN;
    });
    const oneIndexSelected = this.oneIndexSelected();
    const entity = this.getEntity(oneIndexSelected);
    const entityUpper = `${entity[0].toUpperCase()}${entity.slice(1)}`;
    const items = [];
    if (!detailPanel && oneIndexSelected) {
      items.push({
        name: `Show ${entity} settings`,
        icon: <EuiIcon type="indexSettings" />,
        onClick: () => {
          this.closePopoverAndExecute(showSettings);
        }
      });
      items.push({
        name: `Show ${entity} mapping`,
        icon: <EuiIcon type="indexMapping" />,
        onClick: () => {
          this.closePopoverAndExecute(showMapping);
        }
      });
      if (allOpen) {
        items.push({
          name: `Show ${entity} stats`,
          icon: <EuiIcon type="stats" />,
          onClick: () => {
            this.closePopoverAndExecute(showStats);
          }
        });
      }
      items.push({
        name: `Edit ${entity} settings`,
        icon: <EuiIcon type="indexEdit" />,
        onClick: () => {
          this.closePopoverAndExecute(editIndex);
        }
      });
    }
    if (allOpen) {
      items.push({
        name: `Close ${entity}`,
        icon: <EuiIcon type="indexClose" />,
        onClick: () => {
          this.closePopoverAndExecute(closeIndices);
        }
      });
      items.push({
        name: `Force merge ${entity}`,
        icon: <EuiIcon type="merge" />,
        onClick: () => {
          this.closePopoverAndExecute(forcemergeIndices);
        },
      });
      items.push({
        name: `Refresh ${entity}`,
        icon: <EuiIcon type="refresh" />,
        onClick: () => {
          this.closePopoverAndExecute(refreshIndices);
        }
      });
      items.push({
        name: `Clear ${entity} cache`,
        icon: <EuiIcon type="broom" />,
        onClick: () => {
          this.closePopoverAndExecute(clearCacheIndices);
        }
      });
      items.push({
        name: `Flush ${entity}`,
        icon: <EuiIcon type="indexFlush" />,
        onClick: () => {
          this.closePopoverAndExecute(flushIndices);
        }
      });
    } else {
      items.push({
        name: `Open ${entity}`,
        icon: <EuiIcon type="indexOpen" />,
        onClick: () => {
          this.closePopoverAndExecute(openIndices);
        }
      });
    }
    items.push({
      name: `Delete ${entity}`,
      icon: <EuiIcon type="trash" />,
      onClick: () => {
        this.closePopover();
        this.openDeleteConfirmationModal();
      }
    });
    items.forEach((item) =>{
      item['data-test-subj'] = 'indexTableContextMenuButton';
    });
    const panelTree = {
      id: 0,
      title: `${entityUpper} options`,
      items
    };
    return flattenPanelTree(panelTree);
  }

  onButtonClick = () => {
    this.setState(prevState => ({
      isPopoverOpen: !prevState.isPopoverOpen
    }));
  };

  closePopoverAndExecute = func => {
    this.setState({
      isPopoverOpen: false,
      showDeleteConfirmation: false
    });
    func();
    this.props.resetSelection && this.props.resetSelection();
  };

  closePopover = () => {
    this.setState({
      isPopoverOpen: false
    });
  };

  closeDeleteConfirmationModal = () => {
    this.setState({ showDeleteConfirmation: false });
  };

  openDeleteConfirmationModal = () => {
    this.setState({ showDeleteConfirmation: true });
  };

  confirmDeleteModal = () => {
    const oneIndexSelected = this.oneIndexSelected();
    const entity = this.getEntity(oneIndexSelected);
    const { deleteIndices, indexNames } = this.props;
    const { showDeleteConfirmation } = this.state;
    if (!showDeleteConfirmation) {
      return null;
    }
    return (
      <EuiOverlayMask>
        <EuiConfirmModal
          title={`Confirm Delete ${entity}`}
          onCancel={this.closeDeleteConfirmationModal}
          onConfirm={() => this.closePopoverAndExecute(deleteIndices)}
          cancelButtonText="Cancel"
          confirmButtonText="Confirm"
        >
          <div>
            <p>
              You are about to delete {oneIndexSelected ? 'this' : 'these'}{' '}
              {entity}:
            </p>
            <ul>
              {indexNames.map(indexName => (
                <li key={indexName}>{indexName}</li>
              ))}
            </ul>
            <p>
              This operation cannot be undone. Make sure you have appropriate
              backups.
            </p>
          </div>
        </EuiConfirmModal>
      </EuiOverlayMask>
    );
  };
  oneIndexSelected = () => {
    return this.props.indexNames.length === 1;
  };
  getEntity = oneIndexSelected => {
    return oneIndexSelected ? 'index' : 'indices';
  };
  render() {
    const {
      iconSide = 'right',
      anchorPosition = 'rightUp',
      label = 'Manage ' +
        this.props.indexNames.length +
        pluralize(' index', this.props.indexNames.length),
      iconType = 'arrowDown'
    } = this.props;
    const panels = this.panels();
    const oneIndexSelected = this.oneIndexSelected();
    const entity = this.getEntity(oneIndexSelected);
    const button = (
      <EuiButton
        data-test-subj="indexActionsContextMenuButton"
        iconSide={iconSide}
        aria-label={`${entity} options`}
        onClick={this.onButtonClick}
        iconType={iconType}
        fill
      >
        {label}
      </EuiButton>
    );

    return (
      <div>
        {this.confirmDeleteModal()}
        <EuiPopover
          id={`contextMenu${entity}`}
          button={button}
          isOpen={this.state.isPopoverOpen}
          closePopover={this.closePopover}
          panelPaddingSize="none"
          withTitle
          anchorPosition={anchorPosition}
        >
          <EuiContextMenu initialPanelId={0} panels={panels} />
        </EuiPopover>
      </div>
    );
  }
}

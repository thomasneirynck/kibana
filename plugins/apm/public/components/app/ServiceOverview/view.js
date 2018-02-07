import React, { Component } from 'react';
import withErrorHandler from '../../shared/withErrorHandler';
import { STATUS } from '../../../constants';
import { isEmpty } from 'lodash';
import { loadAgentStatus } from '../../../services/rest';
import { RelativeLink, history } from '../../../utils/url';

import { KuiButton } from 'ui_framework/components';
import List from './List';
import { PageHeader } from '../../shared/UIComponents';

function fetchData(props) {
  const { start, end } = props.urlParams;
  if (start && end && !props.serviceList.status) {
    props.loadServiceList({ start, end });
  }
}

function redirectIfNoData({ serviceList }) {
  if (serviceList.status === STATUS.SUCCESS && isEmpty(serviceList.data)) {
    loadAgentStatus().then(result => {
      if (!result.dataFound) {
        history.push({
          pathname: '/setup-instructions'
        });
      }
    });
  }
}

class ServiceOverview extends Component {
  componentDidMount() {
    fetchData(this.props);
    redirectIfNoData(this.props);
  }

  componentWillReceiveProps(nextProps) {
    fetchData(nextProps);
    redirectIfNoData(nextProps);
  }

  render() {
    const { serviceList, changeServiceSorting, serviceSorting } = this.props;

    return (
      <div>
        <PageHeader title="Services">
          <RelativeLink path="/setup-instructions">
            <KuiButton buttonType="secondary">Setup Instructions</KuiButton>
          </RelativeLink>
        </PageHeader>

        <List
          items={serviceList.data}
          changeServiceSorting={changeServiceSorting}
          serviceSorting={serviceSorting}
        />
      </div>
    );
  }
}

export default withErrorHandler(ServiceOverview, ['serviceList']);

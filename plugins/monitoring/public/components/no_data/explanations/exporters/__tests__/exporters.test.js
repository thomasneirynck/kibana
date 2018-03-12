import React from 'react';
import { render } from 'enzyme';
import { ExplainExporters } from '../exporters';

describe('ExplainExporters', () => {
  test('should explain about xpack.monitoring.exporters setting', () => {
    const component = render(
      <ExplainExporters
        property="xpack.monitoring.exporters"
        data={'myMonitoringClusterExporter1'}
        context="esProd001"
      />
    );
    expect(component).toMatchSnapshot();
  });
});

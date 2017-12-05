import React from 'react';

export function InfoTooltip({ series }) {
  const tableRows = series.map((item, index) => {
    return (
      <tr key={`chart-tooltip-${index}`}>
        <td className="monitoring-chart-tooltip__label">{ item.metric.label }</td>
        <td className="monitoring-chart-tooltip__value">{ item.metric.description }</td>
      </tr>
    );
  });

  return (
    <table>
      <tbody>
        { tableRows }
      </tbody>
    </table>
  );
}

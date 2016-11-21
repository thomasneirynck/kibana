import React from 'react';
import moment from 'moment';

export default function Tooltip({series, item, tickFormatter, right, top, left, showTooltip}) {
  if (!item) {
    return null;
  }

  function getTooltipStyles() {
    if (showTooltip) {
      return {
        container: {
          position: 'absolute',
          top: top - 26,
          left,
          right,
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          pointerEvents: 'none'
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.7)',
          color: 'white',
          fontSize: '12px',
          padding: '4px 8px',
          borderRadius: '4px'
        },
        rightCaret: {
          display: right ? 'block' : 'none',
          color: 'rgba(0,0,0,0.7)',
        },
        leftCaret: {
          display: left ? 'block' : 'none',
          color: 'rgba(0,0,0,0.7)',
        },
        date: {
          color: 'rgba(255,255,255,0.7)',
          fontSize: '12px',
          lineHeight: '12px'
        },
        items: {
          display: 'flex',
          alignItems: 'center'
        },
        text: {
          whiteSpace: 'nowrap',
          fontSize: '12px',
          lineHeight: '12px',
          marginRight: 5
        },
        icon: {
          marginRight: 5
        },
        value: {
          fontSize: '12px',
          flexShrink: 0,
          lineHeight: '12px',
          marginLeft: 5
        }
      };
    }

    // hide tooltip
    return {
      container: { display: 'none' },
    };
  }

  const tooltipStyles = getTooltipStyles();
  const metric = series.find(r => r.id === item.series.id);
  const formatter = metric && metric.tickFormatter || tickFormatter || ((v) => v);
  const value = item.datapoint[2] ? item.datapoint[1] - item.datapoint[2] : item.datapoint[1];

  return (
    <div style={tooltipStyles.container}>
     <i className="fa fa-caret-left" style={tooltipStyles.leftCaret}></i>
      <div style={tooltipStyles.tooltip}>
        <div style={tooltipStyles.items}>
          <div style={tooltipStyles.icon}>
            <i className="fa fa-circle" style={{ color: item.series.color }}></i>
          </div>
          <div style={tooltipStyles.text}>{ item.series.label }</div>
          <div style={tooltipStyles.value}>{ formatter(value) }</div>
        </div>
        <div style={tooltipStyles.date}>{ moment(item.datapoint[0]).format('lll') }</div>
      </div>
      <i className="fa fa-caret-right" style={tooltipStyles.rightCaret}></i>
    </div>
  );
}

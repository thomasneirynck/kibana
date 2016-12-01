import React from 'react';
import ChartTarget from './chart_target_component';

export default class TimeseriesContainer extends React.Component {
  constructor() {
    super();

    this.handleMouseOver = this.handleMouseOver.bind(this);

    this.state = {
      showTooltip: false,
      mouseHoverTimer: null
    };
  }

  calculateLeftRight(item, plot) {
    const canvas = plot.getCanvas();
    const point = plot.pointOffset({ x: item.datapoint[0], y: item.datapoint[1]});
    const edge = (point.left + 10) / canvas.width;
    let right;
    let left;
    if (edge > 0.5) {
      right = canvas.width - point.left;
      left = null;
    } else {
      right = null;
      left = point.left;
    }
    return [left, right];
  }

  handleMouseOver(_event, _pos, item, plot) {
    if (typeof this.state.mouseHoverTimer === 'number') {
      window.clearTimeout(this.state.mouseHoverTimer);
    }

    if (item) {
      const plotOffset = plot.getPlotOffset();
      const point = plot.pointOffset({
        x: item.datapoint[0],
        y: item.datapoint[1]
      });
      const [left, right] = this.calculateLeftRight(item, plot);
      const top = point.top + 7; // offset 7 pixels downwards to put caret right on the point
      this.setState({
        item,
        left,
        right,
        top,
        bottom: plotOffset.bottom,
        showTooltip: true
      });
    } else {
      this.setState({ showTooltip: false });
    }
  }

  render() {
    const container = {
      display: 'flex',
      rowDirection: 'column',
      flex: '1 0 auto',
      position: 'relative'
    };

    return (
      <div ref="container" style={container}>
        <ChartTarget onMouseOver={this.handleMouseOver} {...this.props}/>
      </div>
    );
  }
}

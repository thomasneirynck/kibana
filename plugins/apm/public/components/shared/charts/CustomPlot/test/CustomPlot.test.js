import React from 'react';
import { mount } from 'enzyme';
import toDiffableHtml from 'diffable-html';
import moment from 'moment';
import { InnerCustomPlot } from '../index';
import responseWithData from './responseWithData.json';
import responseWithoutData from './responseWithoutData.json';
import { getResponseTimeSeries } from '../../TransactionCharts/selectors';
import VoronoiPlot from '../VoronoiPlot';
import InteractivePlot from '../InteractivePlot';

describe('when response has data', () => {
  let wrapper;
  let onHover;
  let onMouseLeave;
  let onSelectionEnd;

  beforeEach(() => {
    onHover = jest.fn();
    onMouseLeave = jest.fn();
    onSelectionEnd = jest.fn();
    wrapper = mount(
      <InnerCustomPlot
        series={getResponseTimeSeries({
          chartsData: responseWithData
        })}
        onHover={onHover}
        onMouseLeave={onMouseLeave}
        onSelectionEnd={onSelectionEnd}
        width={800}
        tickFormatX={x => x.getTime()} // Avoid timezone issues in snapshots
      />
    );

    // Spy on render methods to determine if they re-render
    jest.spyOn(VoronoiPlot.prototype, 'render').mockClear();
    jest.spyOn(InteractivePlot.prototype, 'render').mockClear();
  });

  describe('Initially', () => {
    it('should have 3 enabled series', () => {
      expect(wrapper.state().enabledSeries.length).toBe(3);
    });

    it('should have 3 legends ', () => {
      const legends = wrapper.find('Legend');
      expect(legends.length).toBe(3);
      expect(legends.map(e => e.props())).toMatchSnapshot();
    });

    it('should have 3 XY plots', () => {
      expect(wrapper.find('StaticPlot XYPlot').length).toBe(1);
      expect(wrapper.find('InteractivePlot XYPlot').length).toBe(1);
      expect(wrapper.find('VoronoiPlot XYPlot').length).toBe(1);
    });

    it('should have correct state', () => {
      expect(wrapper.state().seriesVisibility).toEqual([]);
      expect(wrapper.state().isDrawing).toBe(false);
      expect(wrapper.state().selectionStart).toBe(null);
      expect(wrapper.state().selectionEnd).toBe(null);
      expect(wrapper.state()).toMatchSnapshot();
    });

    it('should not display tooltip', () => {
      expect(wrapper.find('Tooltip').length).toEqual(0);
    });

    it('should have correct markup', () => {
      expect(toDiffableHtml(wrapper.html())).toMatchSnapshot();
    });
  });

  describe('Legends', () => {
    it('should have initial values when nothing is clicked', () => {
      expect(wrapper.state('enabledSeries').length).toBe(3);
      expect(wrapper.state('seriesVisibility')).toEqual([]);
      expect(wrapper.find('StaticPlot').prop('series').length).toBe(3);
    });

    describe('when legend is clicked once', () => {
      beforeEach(() => {
        wrapper
          .find('Legend')
          .at(1)
          .simulate('click');
      });

      it('should toggle series ', () => {
        expect(wrapper.state('enabledSeries').length).toBe(2);
        expect(wrapper.state('seriesVisibility')).toEqual([false, true, false]);
        expect(wrapper.find('StaticPlot').prop('series').length).toBe(2);
      });

      it('should not re-render VoronoiPlot', () => {
        expect(VoronoiPlot.prototype.render.mock.calls.length).toBe(0);
      });

      it('should re-render InteractivePlot', () => {
        expect(InteractivePlot.prototype.render.mock.calls.length).toEqual(1);
      });
    });

    describe('when legend is clicked twice', () => {
      beforeEach(() => {
        wrapper
          .find('Legend')
          .at(1)
          .simulate('click')
          .simulate('click');
      });

      it('should toggle series back to initial state', () => {
        expect(wrapper.state('enabledSeries').length).toBe(3);
        expect(wrapper.state('seriesVisibility')).toEqual([
          false,
          false,
          false
        ]);
        expect(wrapper.find('StaticPlot').prop('series').length).toBe(3);
      });

      it('should not re-render VoronoiPlot', () => {
        expect(VoronoiPlot.prototype.render.mock.calls.length).toBe(0);
      });

      it('should re-render InteractivePlot', () => {
        expect(InteractivePlot.prototype.render.mock.calls.length).toEqual(2);
      });
    });
  });

  describe('when hovering over', () => {
    beforeEach(() => {
      wrapper
        .find('.rv-voronoi__cell')
        .at(22)
        .simulate('mouseOver');
    });

    it('should call onHover', () => {
      expect(onHover).toHaveBeenCalledWith(22);
    });
  });

  describe('when setting hoverIndex', () => {
    beforeEach(() => {
      // Avoid timezone issues in snapshots
      jest.spyOn(moment.prototype, 'format').mockImplementation(function() {
        return this.unix();
      });

      // Simulate hovering over multiple buckets
      wrapper.setProps({ hoverIndex: 13 });
      wrapper.setProps({ hoverIndex: 14 });
      wrapper.setProps({ hoverIndex: 15 });
    });

    it('should display tooltip', () => {
      expect(wrapper.find('Tooltip').length).toEqual(1);
      expect(wrapper.find('Tooltip').prop('tooltipPoints')).toMatchSnapshot();
    });

    it('should display vertical line at correct time', () => {
      expect(
        wrapper.find('InteractivePlot VerticalGridLines').prop('tickValues')
      ).toEqual([1502283720000]);
    });

    it('should not re-render VoronoiPlot', () => {
      expect(VoronoiPlot.prototype.render.mock.calls.length).toBe(0);
    });

    it('should re-render InteractivePlot', () => {
      expect(InteractivePlot.prototype.render.mock.calls.length).toEqual(3);
    });

    it('should match snapshots', () => {
      expect(toDiffableHtml(wrapper.html())).toMatchSnapshot();
      expect(wrapper.state()).toMatchSnapshot();
    });
  });

  describe('when dragging without releasing', () => {
    beforeEach(() => {
      wrapper
        .find('.rv-voronoi__cell')
        .at(10)
        .simulate('mouseDown');

      wrapper
        .find('.rv-voronoi__cell')
        .at(20)
        .simulate('mouseOver');
    });

    it('should display drag marker', () => {
      expect(
        toDiffableHtml(wrapper.find('DragMarker').html())
      ).toMatchSnapshot();
    });

    it('should not call onSelectionEnd', () => {
      expect(onSelectionEnd).not.toHaveBeenCalled();
    });
  });

  describe('when dragging from left to right and releasing', () => {
    beforeEach(() => {
      wrapper
        .find('.rv-voronoi__cell')
        .at(10)
        .simulate('mouseDown');

      wrapper
        .find('.rv-voronoi__cell')
        .at(20)
        .simulate('mouseOver')
        .simulate('mouseUp');
    });

    it('should call onSelectionEnd', () => {
      expect(onSelectionEnd).toHaveBeenCalledWith({
        start: 1502283420000,
        end: 1502284020000
      });
    });
  });

  describe('when dragging from right to left and releasing', () => {
    beforeEach(() => {
      wrapper
        .find('.rv-voronoi__cell')
        .at(20)
        .simulate('mouseDown');

      wrapper
        .find('.rv-voronoi__cell')
        .at(10)
        .simulate('mouseOver')
        .simulate('mouseUp');
    });

    it('should call onSelectionEnd', () => {
      expect(onSelectionEnd).toHaveBeenCalledWith({
        start: 1502283420000,
        end: 1502284020000
      });
    });
  });

  it('should call onMouseLeave when leaving the XY plot', () => {
    wrapper.find('VoronoiPlot svg.rv-xy-plot__inner').simulate('mouseLeave');
    expect(onMouseLeave).toHaveBeenCalledWith(expect.any(Object));
  });
});

describe('when response has no data', () => {
  const onHover = jest.fn();
  const onMouseLeave = jest.fn();
  const onSelectionEnd = jest.fn();
  let wrapper;
  beforeEach(() => {
    const series = getResponseTimeSeries({
      start: 1451606400000,
      end: 1451610000000,
      chartsData: responseWithoutData
    });

    wrapper = mount(
      <InnerCustomPlot
        series={series}
        onHover={onHover}
        onMouseLeave={onMouseLeave}
        onSelectionEnd={onSelectionEnd}
        width={100}
        tickFormatX={x => x.getTime()} // Avoid timezone issues in snapshots
      />
    );
  });

  describe('Initially', () => {
    it('should have 1 enabled series', () => {
      expect(wrapper.state().enabledSeries.length).toBe(1);
    });

    it('should have 0 legends ', () => {
      expect(wrapper.find('Legend').length).toBe(0);
    });

    it('should have 2 XY plots', () => {
      expect(wrapper.find('StaticPlot XYPlot').length).toBe(1);
      expect(wrapper.find('InteractivePlot XYPlot').length).toBe(1);
      expect(wrapper.find('VoronoiPlot XYPlot').length).toBe(0);
    });

    it('should have correct state', () => {
      expect(wrapper.state().seriesVisibility).toEqual([]);
      expect(wrapper.state().isDrawing).toBe(false);
      expect(wrapper.state().selectionStart).toBe(null);
      expect(wrapper.state().selectionEnd).toBe(null);
      expect(wrapper.state()).toMatchSnapshot();
    });

    it('should not display tooltip', () => {
      expect(wrapper.find('Tooltip').length).toEqual(0);
    });

    it('should have correct markup', () => {
      expect(toDiffableHtml(wrapper.html())).toMatchSnapshot();
    });

    it('should have 1 empty series that all have a y-value of 1', () => {
      expect(wrapper.state().enabledSeries.length).toBe(1);
      expect(wrapper.state().enabledSeries[0].isEmpty).toBe(true);
      expect(
        wrapper.state().enabledSeries[0].data.filter(d => d.y !== 1)
      ).toEqual([]);
    });
  });
});

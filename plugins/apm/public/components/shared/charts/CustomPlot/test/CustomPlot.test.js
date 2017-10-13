import React from 'react';
import { mount } from 'enzyme';
import toDiffableHtml from 'diffable-html';
import moment from 'moment';
import { InnerCustomPlot } from '../index';
import responseWithData from './responseWithData.json';
import responseWithoutData from './responseWithoutData.json';
import {
  getResponseTimeSeries,
  getSeries
} from '../../TransactionCharts/selectors';

describe('when response has data', () => {
  let wrapper;
  const onHover = jest.fn();
  const onMouseLeave = jest.fn();
  const onSelectionEnd = jest.fn();

  beforeEach(() => {
    wrapper = mount(
      <InnerCustomPlot
        series={getSeries({
          chartsData: responseWithData,
          handler: getResponseTimeSeries
        })}
        onHover={onHover}
        onMouseLeave={onMouseLeave}
        onSelectionEnd={onSelectionEnd}
        width={800}
        tickFormatX={x => x.getTime()} // Avoid timezone issues in snapshots
      />
    );
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

  describe('When clicking on a legend', () => {
    it('should toggle series', () => {
      // Initial values
      expect(wrapper.state('enabledSeries').length).toBe(3);
      expect(wrapper.state('seriesVisibility')).toEqual([]);
      expect(wrapper.find('StaticPlot').prop('series').length).toBe(3);

      // Click legend once
      wrapper
        .find('Legend')
        .at(1)
        .simulate('click');

      expect(wrapper.state('enabledSeries').length).toBe(2);
      expect(wrapper.state('seriesVisibility')).toEqual([false, true, false]);
      expect(wrapper.find('StaticPlot').prop('series').length).toBe(2);

      // Click same legend again
      wrapper
        .find('Legend')
        .at(1)
        .simulate('click');

      expect(wrapper.state('enabledSeries').length).toBe(3);
      expect(wrapper.state('seriesVisibility')).toEqual([false, false, false]);
      expect(wrapper.find('StaticPlot').prop('series').length).toBe(3);
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
      wrapper.setProps({ hoverIndex: 15 });
    });

    it('should display tooltip', () => {
      expect(wrapper.find('Tooltip').prop('hoveredPoints')).toMatchSnapshot();
    });

    it('should display vertical line at correct time', () => {
      expect(
        wrapper.find('InteractivePlot VerticalGridLines').prop('tickValues')
      ).toEqual([1502283720000]);
    });

    it('should match snapshots', () => {
      expect(toDiffableHtml(wrapper.html())).toMatchSnapshot();
      expect(wrapper.state()).toMatchSnapshot();
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
    const series = getSeries({
      start: 1451606400000,
      end: 1451610000000,
      chartsData: responseWithoutData,
      handler: getResponseTimeSeries
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

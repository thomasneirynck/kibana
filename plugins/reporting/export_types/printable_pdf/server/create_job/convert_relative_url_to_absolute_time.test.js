import sinon from 'sinon';
import { convertRelativeUrlToAbsoluteTime } from './convert_relative_url_to_absolute_time';

let clock;
const now = Date.UTC(2000, 0, 1);
beforeEach(() => {
  clock = sinon.useFakeTimers(now);
});

afterEach(() => {
  clock.restore();
});

test(`it converts the relativeUrl`, () => {
  const relativeUrl = `/app/kibana#/visualize/edit/Visualization-PieChart?_g=(time:(from:now-1y,mode:quick,to:now))`;
  const result = convertRelativeUrlToAbsoluteTime(relativeUrl);
  // eslint-disable-next-line max-len
  expect(result.relativeUrl).toBe(`/app/kibana#/visualize/edit/Visualization-PieChart?_g=(time:(from:'1999-01-01T00:00:00.000Z',mode:absolute,to:'2000-01-01T00:00:00.000Z'))`);
});

test(`it converts and returns the timerange`, () => {
  const relativeUrl = `/app/kibana#/visualize/edit/Visualization-PieChart?_g=(time:(from:now-1y,mode:quick,to:now))`;
  const result = convertRelativeUrlToAbsoluteTime(relativeUrl);
  expect(result.timeRange.from.diff(Date.UTC(1999, 0, 1))).toEqual(0);
  expect(result.timeRange.to.diff(now)).toEqual(0);
});

test(`it removes refreshInterval from the relativeUrl`, () => {
  const relativeUrl = `/app/kibana#/visualize/edit/Visualization-PieChart?_g=(refreshInterval:(display:Off,pause:!f,value:0))`;
  const result = convertRelativeUrlToAbsoluteTime(relativeUrl);
  expect(result.relativeUrl).toBe(`/app/kibana#/visualize/edit/Visualization-PieChart?_g=()`);
});

test(`it doesn't do anything to the relativeUrl if the _g querystring parameter is missing`, () => {
  const relativeUrl = `/app/kibana#/visualize/edit/Visualization-PieChart`;
  const result = convertRelativeUrlToAbsoluteTime(relativeUrl);
  expect(result.relativeUrl).toBe(`/app/kibana#/visualize/edit/Visualization-PieChart`);
});

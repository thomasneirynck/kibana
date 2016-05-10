import expect from 'expect.js';
import calculateKibanaStatus from '../calculate_cluster_health_kibana';

describe('Calculate Kibana Cluster Helath', () => {
  it('health status combined from multiple instances', () => {
    const greens = [
      ['green', 'green'],
      ['green']
    ];
    const yellows = [
      ['yellow', 'green'],
      ['green', 'yellow'],
      ['yellow']
    ];
    const reds = [
      ['green', 'red', 'green'],
      ['red', 'yellow', 'green'],
      ['yellow', 'red', 'yellow'],
      ['red']
    ];

    greens.forEach(set => {
      expect(calculateKibanaStatus(set)).to.be('green');
    });
    yellows.forEach(set => {
      expect(calculateKibanaStatus(set)).to.be('yellow');
    });
    reds.forEach(set => {
      expect(calculateKibanaStatus(set)).to.be('red');
    });
  });
});

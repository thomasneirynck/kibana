import expect from 'expect.js';
import { isPipelineMonitoringSupportedInVersion } from '../pipelines';

describe('isPipelineMonitoringSupportedInVersion', () => {
  it('returns false if lower major version than supported version is supplied', () => {
    const logstashVersion = '5.7.1';
    expect(isPipelineMonitoringSupportedInVersion(logstashVersion)).to.be(false);
  });

  it('returns true if exact major version as supported version is supplied', () => {
    const logstashVersion = '6.1.0';
    expect(isPipelineMonitoringSupportedInVersion(logstashVersion)).to.be(true);
  });

  it('returns true if higher major version than supported version is supplied', () => {
    const logstashVersion = '7.0.2';
    expect(isPipelineMonitoringSupportedInVersion(logstashVersion)).to.be(true);
  });
});
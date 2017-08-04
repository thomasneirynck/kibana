import expect from 'expect.js';
import { PluginVertex } from '../plugin_vertex';
import { Vertex } from '../vertex';
import inputIcon from 'plugins/monitoring/icons/logstash/input.svg';
import filterIcon from 'plugins/monitoring/icons/logstash/filter.svg';
import outputIcon from 'plugins/monitoring/icons/logstash/output.svg';

describe('PluginVertex', () => {
  let graph;
  let vertexJson;

  beforeEach(() => {
    graph = {
      processorVertices: [
        { millisPerEvent: 50 },
        { millisPerEvent: 10 }
      ]
    };
    vertexJson = {
      config_name: 'some-name',
      stats: {
        millis_per_event: 50,
        percent_of_total_processor_duration: 0.3,
        events_per_millisecond: 0.02
      }
    };
  });

  it('should be an instance of Vertex', () => {
    const pluginVertex = new PluginVertex(graph, vertexJson);
    expect(pluginVertex).to.be.a(Vertex);
  });

  it('should have a type of plugin', () => {
    const pluginVertex = new PluginVertex(graph, vertexJson);
    expect(pluginVertex.typeString).to.be('plugin');
  });

  it('should have the correct name', () => {
    const pluginVertex = new PluginVertex(graph, vertexJson);
    expect(pluginVertex.name).to.be('some-name');
  });

  it('should have the correct milliseconds-per-event stat', () => {
    const pluginVertex = new PluginVertex(graph, vertexJson);
    expect(pluginVertex.millisPerEvent).to.be(50);
  });

  it('should have the correct percent-of-total-processor-time stat', () => {
    const pluginVertex = new PluginVertex(graph, vertexJson);
    expect(pluginVertex.percentOfTotalProcessorTime).to.be(0.3);
  });

  it('should have the correct events-per-second stat', () => {
    const pluginVertex = new PluginVertex(graph, vertexJson);
    expect(pluginVertex.eventsPerSecond).to.be(20);
  });

  it('should have the correct time-consumingness stat', () => {
    const pluginVertex = new PluginVertex(graph, vertexJson);
    expect(parseFloat(pluginVertex.timeConsumingness.toFixed(2))).to.be(0.05);
  });

  it('should have the correct slowness stat', () => {
    const pluginVertex = new PluginVertex(graph, vertexJson);
    expect(parseFloat(pluginVertex.getSlowness().toFixed(3))).to.be(1);
  });

  describe('input plugin vertex', () => {
    beforeEach(() => {
      vertexJson.plugin_type = 'input';
    });

    it('should have the correct plugin type', () => {
      const pluginVertex = new PluginVertex(graph, vertexJson);
      expect(pluginVertex.pluginType).to.be('input');
    });

    it('should be an input vertex', () => {
      const pluginVertex = new PluginVertex(graph, vertexJson);
      expect(pluginVertex.isInput).to.be(true);
    });

    it('should not be a processor vertex', () => {
      const pluginVertex = new PluginVertex(graph, vertexJson);
      expect(pluginVertex.isProcessor).to.be(false);
    });

    it('should use the correct icon', () => {
      const pluginVertex = new PluginVertex(graph, vertexJson);
      expect(pluginVertex.icon).to.be(inputIcon);
    });
  });

  it('icon should throw an error if type of plugin is unknown', () => {
    vertexJson.plugin_type = 'foobar';
    const pluginVertex = new PluginVertex(graph, vertexJson);
    const fn = () => pluginVertex.icon;
    expect(fn).to.throwError();
  });

  describe('filter plugin vertex', () => {
    beforeEach(() => {
      vertexJson.plugin_type = 'filter';
    });

    it('should have the correct plugin type', () => {
      const pluginVertex = new PluginVertex(graph, vertexJson);
      expect(pluginVertex.pluginType).to.be('filter');
    });

    it('should not be an input vertex', () => {
      const pluginVertex = new PluginVertex(graph, vertexJson);
      expect(pluginVertex.isInput).to.be(false);
    });

    it('should be a processor vertex', () => {
      const pluginVertex = new PluginVertex(graph, vertexJson);
      expect(pluginVertex.isProcessor).to.be(true);
    });

    it('should use the correct icon', () => {
      const pluginVertex = new PluginVertex(graph, vertexJson);
      expect(pluginVertex.icon).to.be(filterIcon);
    });
  });

  describe('output plugin vertex', () => {
    beforeEach(() => {
      vertexJson.plugin_type = 'output';
    });

    it('should have the correct plugin type', () => {
      const pluginVertex = new PluginVertex(graph, vertexJson);
      expect(pluginVertex.pluginType).to.be('output');
    });

    it('should not be an input vertex', () => {
      const pluginVertex = new PluginVertex(graph, vertexJson);
      expect(pluginVertex.isInput).to.be(false);
    });

    it('should be a processor vertex', () => {
      const pluginVertex = new PluginVertex(graph, vertexJson);
      expect(pluginVertex.isProcessor).to.be(true);
    });

    it('should use the correct icon', () => {
      const pluginVertex = new PluginVertex(graph, vertexJson);
      expect(pluginVertex.icon).to.be(outputIcon);
    });
  });
});

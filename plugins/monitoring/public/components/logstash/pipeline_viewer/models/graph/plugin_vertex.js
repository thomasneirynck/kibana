import { Vertex } from './vertex';
import inputIcon from 'plugins/monitoring/icons/logstash/input.svg';
import filterIcon from 'plugins/monitoring/icons/logstash/filter.svg';
import outputIcon from 'plugins/monitoring/icons/logstash/output.svg';

export class PluginVertex extends Vertex {
  get typeString() {
    return 'plugin';
  }

  get name() {
    return this.json.config_name;
  }

  get pluginType() {
    return this.json.plugin_type;
  }

  get isInput() {
    return this.pluginType === 'input';
  }

  get isProcessor() {
    return (this.pluginType === 'filter' || this.pluginType === 'output');
  }

  get millisPerEvent() {
    return this.stats.millis_per_event;
  }

  get percentOfTotalProcessorTime() {
    return this.stats.percent_of_total_processor_duration;
  }

  get eventsPerSecond() {
    return this.stats.events_per_millisecond * 1000;
  }

  get timeConsumingness() {
    return this.percentOfTotalProcessorTime / 3 * (1 / this.graph.processorVertices.length);
  }

  getSlowness() {
    const totalProcessorVertices = this.graph.processorVertices.length;
    const meanmillisPerEvent = this.graph.processorVertices.reduce((acc,v) => {
      return acc + v.millisPerEvent || 0;
    }, 0) / totalProcessorVertices;

    const variance = this.graph.processorVertices.reduce((acc, v) => {
      const difference = (v.millisPerEvent || 0) - meanmillisPerEvent;
      const square = difference * difference;
      return acc + square;
    }, 0) / (totalProcessorVertices - 1);

    const stdDeviation = Math.sqrt(variance);

    // Std deviations above the mean
    return (this.millisPerEvent - meanmillisPerEvent) / stdDeviation;
  }

  get icon() {
    switch(this.pluginType) {
      case 'input':
        return inputIcon;
      case 'filter':
        return filterIcon;
      case 'output':
        return outputIcon;
      default:
        throw new Error(`Unknown plugin type ${this.pluginType}! This shouldn't happen!`);
    }
  }
}
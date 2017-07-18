import { Vertex } from './vertex';
import ifIcon from 'plugins/monitoring/icons/logstash/if.svg';

export class IfVertex extends Vertex {
  get typeString() {
    return 'if';
  }

  get name() {
    return this.json.condition;
  }

  get icon() {
    return ifIcon;
  }
}

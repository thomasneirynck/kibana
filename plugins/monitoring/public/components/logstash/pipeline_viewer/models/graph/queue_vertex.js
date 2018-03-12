import { Vertex } from './vertex';
import queueIcon from '@elastic/eui/src/components/icon/assets/logstash_queue.svg';

export class QueueVertex extends Vertex {
  get typeString() {
    return 'queue';
  }

  get title() {
    return 'queue';
  }

  get icon() {
    return queueIcon;
  }

  get next() {
    return this.outgoingVertices;
  }
}

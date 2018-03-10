import { Edge } from './edge';

export class BooleanEdge extends Edge {
  get when() {
    return this.json.when;
  }

  get isTrue() {
    return this.when === true;
  }

  get isFalse() {
    return this.when === false;
  }

  get svgClass() {
    return `${super.svgClass} ${super.svgClass}Boolean ${super.svgClass}Boolean--${this.when}`;
  }
}

export class Statement {
  constructor(id, hasExplicitId, stats, meta) {
    this.id = id;
    this.hasExplicitId = hasExplicitId;
    this.stats = stats;
    this.meta = meta;
  }
}

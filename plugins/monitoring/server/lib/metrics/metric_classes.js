import _ from 'lodash';
import {
  LARGE_FLOAT, SMALL_FLOAT, LARGE_BYTES, SMALL_BYTES
} from '../../../lib/formatting';

function missingRequiredParam(param) {
  throw new Error(`Missing required parameter: ${param}`);
}

export class Metric {

  constructor(opts) {
    // apply defaults
    const props = {
      derivative: false
    };

    const requireds = {
      field: opts.field,
      label: opts.label,
      description: opts.description,
      format: opts.format,
      units: opts.units,
      uuidField: opts.uuidField,
      timestampField: opts.timestampField
    };

    const undefKey = _.findKey(requireds, _.isUndefined);
    if (undefKey) {
      return missingRequiredParam(undefKey);
    }

    _.assign(this, _.defaults(opts, props));
  }

  toPlainObject() {
    return _.toPlainObject(this);
  }

}

export class ElasticsearchMetric extends Metric {

  constructor(opts) {
    super({
      ...opts,
      app: 'elasticsearch',
      uuidField: 'cluster_uuid',
      timestampField: 'timestamp'
    });

    if (_.isUndefined(this.type)) {
      missingRequiredParam('type');
    }
  }

}

export class KibanaMetric extends Metric {

  constructor(opts) {
    super({
      ...opts,
      app: 'kibana',
      uuidField: 'kibana_stats.kibana.uuid',
      timestampField: 'kibana_stats.timestamp'
    });
  }

}

export class LatencyMetric extends ElasticsearchMetric {

  constructor(opts) {
    super({
      ...opts,
      format: LARGE_FLOAT,
      metricAgg: 'sum',
      units: 'ms'
    });


    const metric = this.metric || missingRequiredParam('metric'); // "index" or "query"
    const fieldSource = this.fieldSource || missingRequiredParam('fieldSource');
    delete this.metric;
    delete this.fieldSource;

    const metricField = (metric === 'index') ? 'indexing.index' : 'search.query';

    this.aggs = {
      [`${metric}_time_in_millis`]: {
        max: { field: `${fieldSource}.${metricField}_time_in_millis` }
      },
      [`${metric}_total`]: {
        max: { field: `${fieldSource}.${metricField}_total` }
      },
      [`${metric}_time_in_millis_deriv`]: {
        derivative: { buckets_path: `${metric}_time_in_millis`, gap_policy: 'skip' }
      },
      [`${metric}_total_deriv`]: {
        derivative: { buckets_path: `${metric}_total`, gap_policy: 'skip' }
      }
    };

    this.calculation = (last) => {
      const timeInMillis = _.get(last, `${metric}_time_in_millis_deriv.value`);
      const timeTotal = _.get(last, `${metric}_total_deriv.value`);
      if (timeInMillis && timeTotal) {
        // Negative values indicate blips in the data (e.g., restarting a node) that we do not want to misrepresent
        if (timeInMillis < 0 || timeTotal < 0) {
          return null;
        }
        return timeInMillis / timeTotal;
      }
      return 0;
    };
  }

}

export class RequestRateMetric extends ElasticsearchMetric {

  constructor(opts) {
    super({
      ...opts,
      derivative: true,
      format: LARGE_FLOAT,
      metricAgg: 'max',
      units: '/s'
    });
  }

}

export class IndexAverageStatMetric extends ElasticsearchMetric {

  constructor(opts) {
    super({
      ...opts,
      type: 'index',
      format: LARGE_BYTES,
      metricAgg: 'avg',
      units: 'B'
    });
  }

}

export class ThreadPoolQueueMetric extends ElasticsearchMetric {

  constructor(opts) {
    super({
      ...opts,
      title: 'Thread Pool Queues',
      type: 'node',
      format: SMALL_FLOAT,
      metricAgg: 'max',
      units: ''
    });
  }

}

export class ThreadPoolRejectedMetric extends ElasticsearchMetric {

  constructor(opts) {
    super({
      ...opts,
      title: 'Thread Pool Rejections',
      type: 'node',
      derivative: true,
      format: SMALL_FLOAT,
      metricAgg: 'max',
      units: ''
    });
  }

}

/**
 * A generic {@code class} for collecting Index Memory metrics.
 *
 * @see IndicesMemoryMetric
 * @see NodeIndexMemoryMetric
 * @see SingleIndexMemoryMetric
 */
export class IndexMemoryMetric extends ElasticsearchMetric {

  constructor(opts) {
    super({
      ...opts,
      title: 'Index Memory',
      format: SMALL_BYTES,
      metricAgg: 'max',
      units: 'B'
    });
  }

}

export class NodeIndexMemoryMetric extends IndexMemoryMetric {

  constructor(opts) {
    super({
      ...opts,
      type: 'node'
    });

    // override the field set by the super constructor
    this.field = 'node_stats.indices.segments.' + opts.field;
  }

}

export class IndicesMemoryMetric extends IndexMemoryMetric {

  constructor(opts) {
    super({
      ...opts,
      type: 'cluster'
    });

    // override the field set by the super constructor
    this.field = 'index_stats.total.segments.' + opts.field;
  }

}

export class SingleIndexMemoryMetric extends IndexMemoryMetric {

  constructor(opts) {
    super({
      ...opts,
      type: 'index'
    });

    // override the field set by the super constructor
    this.field = 'index_stats.total.segments.' + opts.field;
  }

}

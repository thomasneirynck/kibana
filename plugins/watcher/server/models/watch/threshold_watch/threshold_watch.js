import { set, get } from 'lodash';
import { BaseWatch } from '../base_watch';
import { WATCH_TYPES, COMPARATORS, SORT_ORDERS } from '../../../../common/constants';
import { buildActions } from './build_actions';
import { buildCondition } from './build_condition';
import { buildInput } from './build_input';
import { buildTransform } from './build_transform';
import { buildTrigger } from './build_trigger';
import { buildVisualizeQuery } from './build_visualize_query';
import { formatVisualizeData } from './format_visualize_data';

export class ThresholdWatch extends BaseWatch {
  constructor(props) {
    props.type = WATCH_TYPES.THRESHOLD;
    super(props);

    this.index = props.index;
    this.timeField = props.timeField;
    this.triggerIntervalSize = props.triggerIntervalSize;
    this.triggerIntervalUnit = props.triggerIntervalUnit;
    this.aggType = props.aggType;
    this.aggField = props.aggField;
    this.termSize = props.termSize;
    this.termField = props.termField;
    this.thresholdComparator = props.thresholdComparator;
    this.timeWindowSize = props.timeWindowSize;
    this.timeWindowUnit = props.timeWindowUnit;
    this.threshold = props.threshold;
  }

  get hasTermsAgg() {
    return Boolean(this.termField);
  }

  get termOrder() {
    return this.thresholdComparator === COMPARATORS.GREATER_THAN ? SORT_ORDERS.DESCENDING : SORT_ORDERS.ASCENDING;
  }

  get watchJSON() {
    const result = {
      trigger: buildTrigger(this),
      input: buildInput(this),
      condition: buildCondition(this),
      transform: buildTransform(this),
      actions: buildActions(this)
    };

    return result;
  }

  getVisualizeQuery(visualizeOptions) {
    return buildVisualizeQuery(this, visualizeOptions);
  }

  formatVisualizeData(results) {
    return formatVisualizeData(this, results);
  }

  // To Elasticsearch
  get upstreamJSON() {
    const result = super.upstreamJSON;

    const metadata = {
      index: this.index,
      timeField: this.timeField,
      triggerIntervalSize: this.triggerIntervalSize,
      triggerIntervalUnit: this.triggerIntervalUnit,
      aggType: this.aggType,
      aggField: this.aggField,
      termSize: this.termSize,
      termField: this.termField,
      thresholdComparator: this.thresholdComparator,
      timeWindowSize: this.timeWindowSize,
      timeWindowUnit: this.timeWindowUnit,
      threshold: this.threshold
    };

    set(result, 'watch.metadata.watcherui', metadata);

    return result;
  }

  // To Kibana
  get downstreamJSON() {
    const result = super.downstreamJSON;

    Object.assign(result, {
      index: this.index,
      timeField: this.timeField,
      triggerIntervalSize: this.triggerIntervalSize,
      triggerIntervalUnit: this.triggerIntervalUnit,
      aggType: this.aggType,
      aggField: this.aggField,
      termSize: this.termSize,
      termField: this.termField,
      thresholdComparator: this.thresholdComparator,
      timeWindowSize: this.timeWindowSize,
      timeWindowUnit: this.timeWindowUnit,
      threshold: this.threshold
    });

    return result;
  }

  // from Elasticsearch
  static fromUpstreamJSON(json) {
    const props = super.getPropsFromUpstreamJSON(json);

    const metadata = get(json, 'watchJson.metadata.watcherui');
    if (Boolean(metadata)) {
      Object.assign(props, {
        index: metadata.index,
        timeField: metadata.timeField,
        triggerIntervalSize: metadata.triggerIntervalSize,
        triggerIntervalUnit: metadata.triggerIntervalUnit,
        aggType: metadata.aggType,
        aggField: metadata.aggField,
        termSize: metadata.termSize,
        termField: metadata.termField,
        thresholdComparator: metadata.thresholdComparator,
        timeWindowSize: metadata.timeWindowSize,
        timeWindowUnit: metadata.timeWindowUnit,
        threshold: metadata.threshold
      });
    }

    return new ThresholdWatch(props);
  }

  // from Kibana
  static fromDownstreamJSON(json) {
    const props = super.getPropsFromDownstreamJSON(json);

    Object.assign(props, {
      index: json.index,
      timeField: json.timeField,
      triggerIntervalSize: json.triggerIntervalSize,
      triggerIntervalUnit: json.triggerIntervalUnit,
      aggType: json.aggType,
      aggField: json.aggField,
      termSize: json.termSize,
      termField: json.termField,
      thresholdComparator: json.thresholdComparator,
      timeWindowSize: json.timeWindowSize,
      timeWindowUnit: json.timeWindowUnit,
      threshold: json.threshold
    });

    return new ThresholdWatch(props);
  }

};

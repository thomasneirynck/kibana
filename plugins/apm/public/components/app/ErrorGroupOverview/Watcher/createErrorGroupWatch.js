import chrome from 'ui/chrome';
import uuid from 'uuid';
import { isEmpty } from 'lodash';
import {
  SERVICE_NAME,
  PROCESSOR_EVENT,
  ERROR_GROUP_ID,
  ERROR_LOG_MESSAGE,
  ERROR_EXC_MESSAGE,
  ERROR_EXC_HANDLED,
  ERROR_CULPRIT
} from '../../../../../common/constants';
import { createWatch } from '../../../../services/rest';

export function createErrorGroupWatch({
  emails = [],
  schedule,
  serviceName,
  slackUrl,
  threshold,
  timeRange
}) {
  const id = `apm-${uuid.v4()}`;
  const apmIndexPattern = chrome.getInjected('apmIndexPattern');
  const timeRangeHumanReadable = timeRange.replace('now-', '');

  const emailTemplate = `
  Your service "${serviceName}" has error groups which exceeds ${threshold} occurrences within "${timeRangeHumanReadable}"<br/><br/>

  {{#ctx.payload.aggregations.error_groups.buckets}}
  <strong>{{sample.hits.hits.0._source.error.log.message}}{{^sample.hits.hits.0._source.error.log.message}}{{sample.hits.hits.0._source.error.exception.message}}{{/sample.hits.hits.0._source.error.log.message}}</strong><br/>
  {{sample.hits.hits.0._source.error.culprit}}{{^sample.hits.hits.0._source.error.culprit}}N/A{{/sample.hits.hits.0._source.error.culprit}}<br/>
  {{doc_count}} occurrences<br/><br/>
  {{/ctx.payload.aggregations.error_groups.buckets}}`;

  const body = {
    trigger: {
      schedule
    },
    input: {
      search: {
        request: {
          indices: [apmIndexPattern],
          body: {
            size: 0,
            query: {
              bool: {
                filter: [
                  { term: { [SERVICE_NAME]: serviceName } },
                  { term: { [PROCESSOR_EVENT]: 'error' } },
                  {
                    range: {
                      '@timestamp': {
                        gte: timeRange
                      }
                    }
                  }
                ]
              }
            },
            aggs: {
              error_groups: {
                terms: {
                  min_doc_count: threshold,
                  field: ERROR_GROUP_ID,
                  size: 10,
                  order: {
                    _count: 'desc'
                  }
                },
                aggs: {
                  sample: {
                    top_hits: {
                      _source: [
                        ERROR_LOG_MESSAGE,
                        ERROR_EXC_MESSAGE,
                        ERROR_EXC_HANDLED,
                        ERROR_CULPRIT,
                        ERROR_GROUP_ID,
                        '@timestamp'
                      ],
                      sort: [
                        {
                          '@timestamp': 'desc'
                        }
                      ],
                      size: 1
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    condition: {
      script: {
        source:
          'return ctx.payload.aggregations.error_groups.buckets.length > 0'
      }
    },
    actions: {
      log_error: {
        logging: {
          text: emailTemplate
        }
      }
    }
  };

  if (slackUrl) {
    const webhookPath = slackUrl.replace('https://hooks.slack.com', '');
    const slackTemplate = `
Your service "${serviceName}" has error groups which exceeds ${threshold} occurrences within "${timeRangeHumanReadable}"

{{#ctx.payload.aggregations.error_groups.buckets}}
*{{sample.hits.hits.0._source.error.log.message}}{{^sample.hits.hits.0._source.error.log.message}}{{sample.hits.hits.0._source.error.exception.message}}{{/sample.hits.hits.0._source.error.log.message}}*
{{#sample.hits.hits.0._source.error.culprit}}\`{{sample.hits.hits.0._source.error.culprit}}\`{{/sample.hits.hits.0._source.error.culprit}}{{^sample.hits.hits.0._source.error.culprit}}N/A{{/sample.hits.hits.0._source.error.culprit}}
{{doc_count}} occurrences

{{/ctx.payload.aggregations.error_groups.buckets}}`;

    body.actions.slack_webhook = {
      webhook: {
        scheme: 'https',
        host: 'hooks.slack.com',
        port: 443,
        method: 'POST',
        path: webhookPath,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: slackTemplate
        })
      }
    };
  }

  if (!isEmpty(emails)) {
    body.actions.email = {
      email: {
        to: emails,
        subject: `"${serviceName}" has error groups which exceeds the threshold`,
        body: {
          html: emailTemplate
        }
      }
    };
  }

  return createWatch(id, body).then(() => {
    return id;
  });
}

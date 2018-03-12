import { SettingsChecker } from './settings_checker';

export class NodeSettingsChecker extends SettingsChecker {
  constructor(params) {
    super(params);

    this.setApi('../api/monitoring/v1/elasticsearch_settings/check/nodes');
    this.setMessage('Checking nodes settings API on production cluster');
  }
}

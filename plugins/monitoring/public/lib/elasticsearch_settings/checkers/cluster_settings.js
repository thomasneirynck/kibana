import { SettingsChecker } from './settings_checker';

export class ClusterSettingsChecker extends SettingsChecker {
  constructor(params) {
    super(params);

    this.setApi('../api/monitoring/v1/elasticsearch_settings/check/cluster');
    this.setMessage('Checking cluster settings API on production cluster');
  }
}

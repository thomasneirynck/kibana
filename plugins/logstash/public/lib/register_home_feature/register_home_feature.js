import { FeatureCatalogueRegistryProvider, FeatureCatalogueCategory } from 'ui/registry/feature_catalogue';

FeatureCatalogueRegistryProvider.register(($injector) => {

  const licenseService = $injector.get('logstashLicenseService');
  if (!licenseService.enableLinks) {
    return;
  }

  return {
    id: 'management_logstash',
    title: 'Logstash Pipelines',
    description: 'Create, delete, update, and clone data ingestion pipelines.',
    icon: '/plugins/logstash/assets/app_pipeline.svg',
    path: '/app/kibana#/management/logstash/pipelines',
    showOnHomePage: true,
    category: FeatureCatalogueCategory.ADMIN
  };
});

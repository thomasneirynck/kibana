import 'ui/getting_started/opt_out_directive';
import { GettingStartedRegistryProvider } from 'ui/getting_started/registry';
import { GETTING_STARTED_REGISTRY_TYPES } from 'ui/getting_started/constants';
import template from './getting_started.html';
import './welcome_banner';

GettingStartedRegistryProvider.register(() => ({
  type: GETTING_STARTED_REGISTRY_TYPES.MANAGE_AND_MONITOR_MESSAGE,
  template
}));

GettingStartedRegistryProvider.register(() => ({
  type: GETTING_STARTED_REGISTRY_TYPES.TOP_MESSAGE,
  template: '<welcome-banner></welcome-banner>'
}));
import { uiModules } from 'ui/modules';

import { injectBanner } from './welcome_banner';

uiModules.get('monitoring/hacks').run(injectBanner);

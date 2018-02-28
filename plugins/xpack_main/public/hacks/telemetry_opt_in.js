import { uiModules } from 'ui/modules';

import { injectBanner } from './welcome_banner';

uiModules.get('xpack_main/hacks').run(injectBanner);

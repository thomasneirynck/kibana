import { HomeView } from '../../components/home';
import { CheckupView } from '../../components/checkup';
import { ReindexView } from '../../components/reindex';
import { LoggingView } from '../../components/logging';


export {
  NUMBER_OF_STEPS,
  REINDEX_STEPS,
  UPGRADE_STEPS,
  STEP_RESULTS,
  INDEX_ACTION,
} from './reindex';

export {
  DEPRECATION_ISSUE_LEVELS,
} from './deprecations';

export const VIEWS = {
  HOME: {
    component: HomeView,
    label: 'Overview',
    location: 'home',
  },
  CHECKUP: {
    component: CheckupView,
    label: 'Cluster Checkup',
    location: 'checkup',
  },
  REINDEX: {
    component: ReindexView,
    label: 'Reindex Helper',
    location: 'reindex',
  },
  LOGGING: {
    component: LoggingView,
    label: 'Toggle Deprecation Logging',
    location: 'logging',
  }
};
export const DEFAULT_VIEW_ID = 'HOME';

export const HUMAN_READABLE_DELAY = 750;

export const LOADING_STATUS = {
  FORBIDDEN: 'FORBIDDEN',
  FAILURE: 'FAILURE',
  LOADING: 'LOADING',
  SUCCESS: 'SUCCESS',
  UNINITIALIZED: 'UNINITIALIZED',
};

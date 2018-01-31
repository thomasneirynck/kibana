import { registerClearCacheRoute } from './register_clear_cache_route';
import { registerCloseRoute } from './register_close_route';
import { registerFlushRoute } from './register_flush_route';
import { registerForcemergeRoute } from './register_forcemerge_route';
import { registerListRoute } from './register_list_route';
import { registerOpenRoute } from './register_open_route';
import { registerRefreshRoute } from './register_refresh_route';
import { registerReloadRoute } from './register_reload_route';
import { registerDeleteRoute } from './register_delete_route';
import { registerShardsRoute } from './register_shards_route';

export function registerIndicesRoutes(server) {
  registerClearCacheRoute(server);
  registerCloseRoute(server);
  registerFlushRoute(server);
  registerForcemergeRoute(server);
  registerListRoute(server);
  registerOpenRoute(server);
  registerRefreshRoute(server);
  registerReloadRoute(server);
  registerDeleteRoute(server);
  registerShardsRoute(server);
}

// Copied largely from plugins/kibana/index.js. The dashboard viewer includes just the dashboard section of
// the standard kibana plugin.  We don't want to include code for the other links (visualize, dev tools, etc)
// since it's view only, but we want the urls to be the same, so we are using largely the same setup.

import { resolve } from 'path';

export function dashboardViewer(kibana) {
  const kbnBaseUrl = '/app/kibana';
  return new kibana.Plugin({
    id: 'dashboard_viewer',
    publicDir: resolve(__dirname, 'public'),
    require: ['kibana', 'elasticsearch', 'xpack_main'],
    uiExports: {
      app: {
        id: 'dashboardViewer',
        title: 'Dashboard Viewer',
        listed: false,
        hidden: true,
        description: 'view dashboards',
        main: 'plugins/dashboard_viewer/app',
        uses: [
          'visTypes',
          'visResponseHandlers',
          'visRequestHandlers',
          'visEditorTypes',
          'savedObjectTypes',
          'spyModes',
          'navbarExtensions',
          'docViews',
          'fieldFormats'
        ],
        injectVars: server => server.plugins.kibana.injectVars(server),
        links: [
          {
            id: 'kibana:dashboard',
            title: 'Dashboard',
            order: -1001,
            url: `${kbnBaseUrl}#/dashboards`,
            subUrlBase: `${kbnBaseUrl}#/dashboard`,
            description: 'Dashboard Viewer',
            icon: 'plugins/kibana/assets/dashboard.svg',
          }
        ],
      }
    },

    config(Joi) {
      return Joi.object({
        enabled: Joi.boolean().default(true)
      }).default();
    },
  });
}

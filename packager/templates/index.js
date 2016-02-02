module.exports = function (kibana) {
  var plugins = [];
  <% plugins.forEach(function(plugin) { %>
  plugins = plugins.concat(require('./<%= plugin.name %>')(kibana)); <% }); %>

  return plugins;
};

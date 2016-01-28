module.exports = [
<% plugins.forEach(function(plugin) { %>
  require('./<%= plugin.name %>'),
<% }); %>
];
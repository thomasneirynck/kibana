module.exports = function (kibana) {
  var plugins = [];
  
  plugins = plugins.concat(require('./graph')(kibana)); 
  plugins = plugins.concat(require('./monitoring')(kibana)); 
  plugins = plugins.concat(require('./reporting')(kibana)); 
  plugins = plugins.concat(require('./security')(kibana)); 

  return plugins;
};

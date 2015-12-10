
var venn = require("./venn.js")
module.exports=(function() {

  // Unwrap elasticsearch field names from mappings
  // into a flattened list of field names
  function unwrapFieldNames(obj, path, fields) {
    if (!obj.properties) {
      return;
    }
    for (var p in obj.properties) {
      var child = obj.properties[p];
      if (child.properties) {
        path.push(p);
        unwrapFieldNames(child, path, fields);
        path.pop();
      } else {
        var parentName = "";
        for (var i in path) {
          parentName += path[i];
          parentName += ".";
        }
        // Need to clone the path array here:
        fields.push({
          "name": parentName + p,
          "path": path.slice(0),
          "leafName": p
        });
        if (child.fields) {
          for (var mfield in child.fields) {
            fields.push({
              "name": parentName + p + "." + mfield,
              "path": path.slice(0),
              "leafName": p
            });

          }
        }
      }
    }
  }

  function getMergeSuggestionObjects(termIntersects){
    var mergeCandidates=[];
    for(var i in termIntersects){
      var ti=termIntersects[i];
      mergeCandidates.push({
        'id1':ti.id1,
        'id2':ti.id2,
        'term1':ti.term1,
        'term2':ti.term2,
        'v1':ti.v1,
        'v2':ti.v2,
        'overlap':ti.overlap,
        width:100,
        height:60});

    }
    return mergeCandidates;
  }


  return {
    "unwrapFieldNames" : unwrapFieldNames,
    "getMergeSuggestionObjects":getMergeSuggestionObjects
  };

})();

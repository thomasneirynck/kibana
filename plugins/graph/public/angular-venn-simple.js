//MH TODO - I'm not 100% on managing dependencies. I added these 2 dependencies
// to the source code and it seems to work.
var d3 = require('d3');
var venn = require('venn.js');


angular.module('angular-venn-simple', [])
.directive('venn', function () {
  return {
    scope: {
      venn: '=',
      vennKey: '=?',
      vennKeySize: '=?',
      vennMap: '=?'
    },
    restrict: 'AE',
    controller: function ($scope, $element) {
      $scope.$watch('venn', function () {
        var element = $element[0];
        //Remove current contents
        while (element.firstChild) {
          element.removeChild(element.firstChild);
        }
        var params = $scope.venn;
        if (!params) {
          return;
        }
        var height = params.height ? params.height : '50px';
        var width = params.width ? params.width : '200px';
        var v1 = params.v1 ? params.v1 : 10;
        var v2 = params.v2 ? params.v2 : 10;
        var overlap = params.overlap ? params.overlap : 5;
        var v1Class = params.v1Class ? params.v1Class : 'venn1';
        var v2Class = params.v2Class ? params.v2Class : 'venn2';
        var r1 = Math.sqrt(v1 / Math.PI);
        var r2 = Math.sqrt(v2 / Math.PI);

        var maxR = Math.max(r1,r2);
        var x1 = r1;
        var y1 = maxR;
        var x2 = x1 + venn.distanceFromIntersectArea(r1,r2,overlap);
        var y2 = maxR;

        //Shift right to centre image
        var imageWidth = (maxR * 4);
        var blankRight = imageWidth - (x2 + r2);
        x1 += blankRight / 2;
        x2 += blankRight / 2;

        var viewBoxDims = '0 0 ' + imageWidth + ' ' + (maxR * 2);
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width',width);
        svg.setAttribute('height',height);
        svg.setAttribute('viewBox', viewBoxDims);
        var g = document.createElementNS('http://www.w3.org/2000/svg','g');
        var circle1 = document.createElementNS('http://www.w3.org/2000/svg','ellipse');
        circle1.setAttribute('cx',x1);
        circle1.setAttribute('cy',y1);
        circle1.setAttribute('rx',r1);
        circle1.setAttribute('ry',r1);
        circle1.setAttribute('class',v1Class);
        g.appendChild(circle1);
        var circle2 = document.createElementNS('http://www.w3.org/2000/svg','ellipse');
        circle2.setAttribute('cx',x2);
        circle2.setAttribute('cy',y2);
        circle2.setAttribute('rx',r2);
        circle2.setAttribute('ry',r2);
        circle2.setAttribute('class',v2Class);
        g.appendChild(circle2);
        svg.appendChild(g);
        element.appendChild(svg);
      }, true);
    },
    link: function ($scope, elem, attr, ctrl) {
    }
  };
});

define(function (require) {
  var React = require('react');
  var make = React.DOM;

  var TableHead = React.createClass({
    displayName: 'TableHead',
    render: function () {
      var that = this;
      function makeTh(config, idx) {
        var isSortCol = config.sort !== 0 && config.sort;
        var isSortAsc = config.sort === 1;
        var $icon = false;
        if (isSortCol) {
          var iconClassName = 'fa fa-sort-amount-' + (isSortAsc ? 'asc' : 'desc');
          $icon = make.i({className: iconClassName});
        }

        return make.th({
          key: config.title,
          onClick: function () {
            if (config.sort !== 0) {
              config.sort = config.sort === 1 ? -1 : 1;
            } else {
              config.sort = 1;
            }
            that.props.setSortCol(config);
          },
          className: config.className || ''
        }, config.title, $icon);
      }
      var $ths =  this.props.columns.map(makeTh);
      return make.thead(null, make.tr(null, $ths));
    }
  });
  return TableHead;
});

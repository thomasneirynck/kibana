import d3 from 'd3';
import _ from 'lodash';

function builder(obj, func) {

  d3.entries(obj).forEach((d) => {
    if (_.isFunction(func[d.key])) {
      func[d.key](d.value);
    }
  });

  return func;
}

export default builder;

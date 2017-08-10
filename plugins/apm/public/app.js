/* eslint-disable */
import { uiModules } from 'ui/modules';
import chrome from 'ui/chrome';
import React from 'react';
import ReactDOM from 'react-dom';
import 'ui/autoload/styles';

import template from './templates/index.html';
import ReactRoot from './reactRoot';
import 'ui/autoload/all';
/* eslint-enable */

import { initTimepicker } from './utils/timepicker';

chrome.setRootTemplate(template);

initTimepicker(timefilter => {
  ReactDOM.render(
    <ReactRoot timefilter={timefilter} />,
    document.getElementById('react-apm-root')
  );
});

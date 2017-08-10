import React from 'react';
import { RelativeLink } from '../../../utils/url';
import Tab from '../../shared/Tab';

function Navigation({ appName, types, type }) {
  if (!types) {
    return null;
  }

  return (
    <div>
      {types.map(_type => {
        return (
          <Tab selected={type === _type} key={_type}>
            <RelativeLink path={`${appName}/${encodeURIComponent(_type)}`}>
              {_type}
            </RelativeLink>
          </Tab>
        );
      })}
    </div>
  );
}

export default Navigation;

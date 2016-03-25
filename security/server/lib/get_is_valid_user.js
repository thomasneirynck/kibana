import {assign} from 'lodash';
import basicAuth from './basic_auth';
import getClient from './get_client_shield';

export default (server) => {
  const callWithRequest = getClient(server).callWithRequest;

  return function isValidUser(request, username, password) {
    assign(request.headers, basicAuth.getHeader(username, password));
    return callWithRequest(request, 'shield.authenticate');
  };
};

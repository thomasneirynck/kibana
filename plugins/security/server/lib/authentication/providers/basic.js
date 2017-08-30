import { AuthenticationResult } from '../authentication_result';
/**
 * Provider that supports request authentication via Basic HTTP Authentication.
 */
export class BasicAuthenticationProvider {
  /**
   * Function that passes request with proper headers to Elasticsearch backend for authentication.
   * @type {function}
   * @private
   */
  _getUser = null;

  /**
   * Instantiates BasicAuthenticationProvider.
   * @param {function} getUser Function that passes request with proper headers to Elasticsearch backend
   * for authentication.
   */
  constructor(getUser) {
    this._getUser = getUser;
  }

  /**
   * Performs request authentication using Basic HTTP Authentication.
   * @param {Hapi.Request} request HapiJS request instance.
   * @param {Object} [state] Optional state object associated with the provider.
   * @returns {Promise.<AuthenticationResult>}
   */
  async authenticate(request, state) {
    const authenticationResult = await this._authenticateViaHeader(request);

    // If we didn't succeed in the previous step let's try to authenticate using state if we have one.
    if (state && !authenticationResult.succeeded()) {
      return this._authenticateViaState(request, state);
    }

    return authenticationResult;
  }

  /**
   * Validates whether request contains `Basic ***` Authorization header and just passes it
   * forward to Elasticsearch backend.
   * @param {Hapi.Request} request HapiJS request instance.
   * @returns {Promise.<AuthenticationResult>}
   * @private
   */
  async _authenticateViaHeader(request) {
    const authorization = request.headers.authorization;
    if (!authorization) {
      return AuthenticationResult.notHandled();
    }

    const authorizationType = authorization.split(/\s+/)[0];
    if (authorizationType.toLowerCase() !== 'basic') {
      return AuthenticationResult.notHandled();
    }

    try {
      return AuthenticationResult.succeeded(
        await this._getUser(request),
        { authorization }
      );
    } catch(err) {
      return AuthenticationResult.failed(err);
    }
  }

  /**
   * Tries to extract authorization header from the state and adds it to the request before
   * it's forwarded to Elasticsearch backend.
   * @param {Hapi.Request} request HapiJS request instance.
   * @param {Object} state State value previously stored by the provider.
   * @returns {Promise.<AuthenticationResult>}
   * @private
   */
  async _authenticateViaState(request, state) {
    if (!state.authorization) {
      return AuthenticationResult.failed(new Error('Provider state is not valid.'));
    }

    request.headers.authorization = state.authorization;

    return this._authenticateViaHeader(request);
  }
}

/**
 * Utility class that knows how to decorate request with proper Basic authentication headers.
 */
export class BasicCredentials {
  /**
   * Takes provided `username` and `password`, transforms them into proper `Basic ***` authorization
   * header and decorates passed request with it.
   * @param {Hapi.Request} request HapiJS request instance.
   * @param {string} username User name.
   * @param {string} password User password.
   * @returns {Hapi.Request} HapiJS request instance decorated with the proper header.
   */
  static decorateRequest(request, username, password) {
    if (!request || typeof request !== 'object') {
      throw new Error('Request should be a valid object.');
    }

    if (!username || typeof username !== 'string') {
      throw new Error('Username should be a valid non-empty string.');
    }

    if (!password || typeof password !== 'string') {
      throw new Error('Password should be a valid non-empty string.');
    }

    const basicCredentials = new Buffer(`${username}:${password}`).toString('base64');
    request.headers.authorization = `Basic ${basicCredentials}`;
    return request;
  }
}

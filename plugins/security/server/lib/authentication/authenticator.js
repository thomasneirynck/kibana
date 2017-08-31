import { AuthScopeService } from '../auth_scope_service';
import { BasicAuthenticationProvider } from './providers/basic';
import { AuthenticationResult } from './authentication_result';
import { Session } from './session';

// Mapping between provider key defined in the config and authentication
// provider class that can handle specific authentication mechanism.
const providerMap = new Map([
  ['basic', BasicAuthenticationProvider]
]);

function assertRequest(request) {
  if (!request || typeof request !== 'object') {
    throw new Error(`Request should be a valid object, was [${typeof request}].`);
  }
}

/**
 * Authenticator is responsible for authentication of the request using chain of
 * authentication providers. The chain is essentially a prioritized list of configured
 * providers (typically of various types). The order of the list determines the order in
 * which the providers will be consulted. During the authentication process, Authenticator
 * will try to authenticate the request via one provider at a time. Once one of the
 * providers successfully authenticates the request, the authentication is considered
 * to be successful and the authenticated user will be associated with the request.
 * If provider cannot authenticate the request, the next in line provider in the chain
 * will be used. If all providers in the chain could not authenticate the request,
 * the authentication is then considered to be unsuccessful and an authentication error
 * will be returned.
 */
class Authenticator {
  /**
   * HapiJS server instance.
   * @type {Hapi.Server}
   * @private
   */
  _server = null;

  /**
   * Service that gathers all `scopes` for particular user.
   * @type {AuthScopeService}
   * @private
   */
  _authScope = null;

  /**
   * List of configured and instantiated authentication providers.
   * @type {Map.<string, Object>}
   * @private
   */
  _providers = null;

  /**
   * Session class instance.
   * @type {Session}
   * @private
   */
  _session = null;

  /**
   * Instantiates Authenticator and bootstrap configured providers.
   * @param {Hapi.Server} server HapiJS Server instance.
   * @param {AuthScopeService} authScope AuthScopeService instance.
   * @param {Session} session Session instance.
   */
  constructor(server, authScope, session) {
    this._server = server;
    this._authScope = authScope;
    this._session = session;

    const authProviders = this._server.config().get('xpack.security.authProviders');
    if (authProviders.length === 0) {
      throw new Error(
        '`Basic` authentication provider is not configured. Verify `xpack.security.authProviders` config value.'
      );
    }

    this._providers = new Map(
      authProviders.map((providerType) => [providerType, this._instantiateProvider(providerType)])
    );
  }

  /**
   * Performs request authentication using configured chain of authentication providers.
   * @param {Hapi.Request} request HapiJS request instance.
   * @returns {Promise.<AuthenticationResult>}.
   */
  async authenticate(request) {
    assertRequest(request);

    const isSystemApiRequest = this._server.plugins.kibana.systemApi.isSystemApiRequest(request);
    const existingSession = await this._session.get(request);

    let authenticationResult;
    for (const [providerType, provider] of this._providers) {
      // Check if current session has been set by this provider.
      const ownsSession = existingSession && existingSession.provider === providerType;

      authenticationResult = await provider.authenticate(
        request,
        ownsSession ? existingSession.state : null
      );

      // We set/update session only if it's NOT a system API call. In case provider returns state
      // value it has a higher priority, otherwise just extend existing session.
      const storeInSession = !isSystemApiRequest &&
        (authenticationResult.state || existingSession);
      if (storeInSession) {
        const sessionValue = authenticationResult.state
          ? { state: authenticationResult.state, provider: providerType }
          : existingSession;

        await this._session.set(request, sessionValue);
      } else if (ownsSession && !authenticationResult.succeeded()) {
        // If provider owned the session, but failed to authenticate anyway, that likely means
        // that session is not valid, so we should clear it.
        await this._session.clear(request);
      }

      if (authenticationResult.succeeded()) {
        // Complement user with scopes and return.
        return AuthenticationResult.succeeded({
          ...authenticationResult.user,
          scope: await this._authScope.getForRequestAndUser(request, authenticationResult.user)
        });
      }
    }

    return authenticationResult;
  }

  /**
   * Deauthenticates current request.
   * @param {Hapi.Request} request HapiJS request instance.
   * @returns {Promise.<void>}
   */
  async deauthenticate(request) {
    assertRequest(request);

    await this._session.clear(request);
  }

  /**
   * Instantiates authentication provider based on the provider key from config.
   * @param {string} providerType Provider type key.
   * @returns {Object} Authentication provider instance.
   * @private
   */
  _instantiateProvider(providerType) {
    const ProviderClassName = providerMap.get(providerType);
    if (!ProviderClassName) {
      throw new Error(`Unsupported authentication provider name: ${providerType}.`);
    }

    return new ProviderClassName(this._server.plugins.security.getUser);
  }
}

export async function initAuthenticator(server) {
  const session = await Session.create(server);
  const authScope = new AuthScopeService();
  const authenticator = new Authenticator(server, authScope, session);

  server.expose('authenticate', (request) => authenticator.authenticate(request));
  server.expose('deauthenticate', (request) => authenticator.deauthenticate(request));
  server.expose('registerAuthScopeGetter', (scopeExtender) => authScope.registerGetter(scopeExtender));

  server.expose('isAuthenticated', async (request) => {
    try {
      await server.plugins.security.getUser(request);
      return true;
    } catch (err) {
      // Don't swallow server errors.
      if (!err.isBoom || err.output.statusCode !== 401) {
        throw err;
      }
    }

    return false;
  });
}

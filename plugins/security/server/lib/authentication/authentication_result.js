/**
 * Represents status that `AuthenticationResult` can be in.
 * @enum {string}
 */
const AuthenticationResultStatus = Object.freeze({
  NotHandled: 'not-handled',
  Succeeded: 'succeeded',
  Failed: 'failed'
});

/**
 * Represents the result of an authentication attempt. This result can be in one of the possible states:
 * 1. Successful authentication of the user;
 * 2. Unable to handle authentication of the user (e.g. supported credentials are not provided);
 * 3. Failed to authenticate user with the provided credentials.
 */
export class AuthenticationResult {
  /**
   * Indicates the status of the authentication result.
   * @type {AuthenticationResultStatus}
   * @private
   */
  _status;
  _user;
  _state;
  _error;

  /**
   * Authenticated user instance (only available in `succeeded` state).
   * @type {?Object}
   * @private
   */
  get user() {
    return this._user;
  }

  /**
   * State associated with the authenticated user (only available in `succeeded` state).
   * @type {?Object}
   * @private
   */
  get state() {
    return this._state;
  }


  /**
   * Error that occurred during authentication (only available in `failed` state).
   * @type {?Error}
   * @private
   */
  get error() {
    return this._error;
  }

  /**
   * Constructor is not supposed to be used directly, please use corresponding static factory methods instead.
   * @private
   */
  constructor(status, { user, state, error } = {}) {
    this._status = status;
    this._user = user;
    this._state = state;
    this._error = error;
  }

  /**
   * Indicates that authentication couldn't be performed with the provided credentials.
   * @returns {boolean}
   */
  notHandled() {
    return this._status === AuthenticationResultStatus.NotHandled;
  }

  /**
   * Indicates that authentication succeeded.
   * @returns {boolean}
   */
  succeeded() {
    return this._status === AuthenticationResultStatus.Succeeded;
  }

  /**
   * Indicates that authentication failed.
   * @returns {boolean}
   */
  failed() {
    return this._status === AuthenticationResultStatus.Failed;
  }

  /**
   * Produces `AuthenticationResult` for the case when provided can't perform authentication
   * with the provided credentials.
   * @returns {AuthenticationResult}
   */
  static notHandled() {
    return new AuthenticationResult(AuthenticationResultStatus.NotHandled);
  }

  /**
   * Produces `AuthenticationResult` for the case when authentication succeeds.
   * @param {Object} user User information retrieved as a result of successful authentication attempt.
   * @param {Object} [state] Optional state to be stored and reused for the next request.
   * @returns {AuthenticationResult}
   */
  static succeeded(user, state) {
    if (!user) {
      throw new Error('User should be specified.');
    }

    return new AuthenticationResult(
      AuthenticationResultStatus.Succeeded,
      { user, state }
    );
  }

  /**
   * Produces `AuthenticationResult` for the case when authentication fails.
   * @param {Error} error Error that occurred during authentication attempt.
   * @returns {AuthenticationResult}
   */
  static failed(error) {
    if (!error) {
      throw new Error('Error should be specified.');
    }

    return new AuthenticationResult(
      AuthenticationResultStatus.Failed,
      { error }
    );
  }
}

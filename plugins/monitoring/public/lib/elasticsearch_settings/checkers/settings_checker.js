export class SettingsChecker {
  constructor($http) {
    this.$http = $http;

    this.message = null;
    this.api = null;
    this.next = null;
  }

  setApi(api) {
    this.api = api;
  }

  setMessage(message) {
    this.message = message;
  }

  getApi() {
    return this.api;
  }

  getMessage() {
    return this.message;
  }

  hasNext() {
    return this.next !== null;
  }

  setNext(checker) {
    this.next = checker;
  }

  getNext() {
    return this.next;
  }

  async executeCheck() {
    try {
      const { data } = await this.$http.get(this.getApi());
      const { found, reason } = data;

      return { found, reason };
    } catch (err) {
      const { data } = err;

      return {
        error: true,
        found: false,
        errorReason: data
      };
    }
  }
}

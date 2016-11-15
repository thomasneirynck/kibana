import sinon from 'sinon';
import expect from 'expect.js';

import replaceInjectedVars from '../replace_injected_vars';

describe('replaceInjectedVars uiExport', () => {
  it('checks if request is authenticated, sends xpack info if so', async () => {
    const originalInjectedVars = { a: 1 };
    const request = {};
    const server = {
      plugins: {
        security: {
          isAuthenticated: sinon.stub().returns(true)
        },
        xpack_main: {
          info: {
            toJSON: () => ({ b: 1 })
          }
        }
      }
    };

    const newVars = await replaceInjectedVars(originalInjectedVars, request, server);
    expect(newVars).to.eql({
      a: 1,
      xpackInitialInfo: {
        b: 1
      }
    });

    sinon.assert.calledOnce(server.plugins.security.isAuthenticated);
    expect(server.plugins.security.isAuthenticated.firstCall.args[0]).to.be(request);
  });

  it('sends the originalInjectedVars if not authenticated', async () => {
    const originalInjectedVars = { a: 1 };
    const request = {};
    const server = {
      plugins: {
        security: {
          isAuthenticated: sinon.stub().returns(false)
        }
      }
    };

    const newVars = await replaceInjectedVars(originalInjectedVars, request, server);
    expect(newVars).to.be(originalInjectedVars);
  });
});

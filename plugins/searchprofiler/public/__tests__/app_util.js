import expect from 'expect.js';
import sinon from 'sinon';
import { checkForParseErrors } from '../app_util.js';

describe('checkForParseErrors', function () {
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip('returns false from bad JSON', function () {
    const markers = [];
    const session = {
      getLength: () => {},
      addMarker: () => {}
    };
    const mockSession = sinon.mock(session);
    mockSession.expects('getLength').once().returns(10);
    mockSession.expects('addMarker').once().returns('marker');

    const ace = {
      session: session,
      gotoLine: () => {}
    };
    const mockAce = sinon.mock(ace);
    mockAce.expects('gotoLine').once();

    const json = '{"foo": {"bar": {"baz": "buzz}}}';

    const result = checkForParseErrors(json, markers, ace);
    expect(result.status).to.be(false);
    expect(result.error).to.be('Unexpected end [SyntaxError: Unexpected end of input]');
    expect(markers.length).to.be(1);
    mockAce.verify();
    mockSession.verify();
  });

  it('returns true from good JSON', function () {
    const markers = [];
    const session = {
      getLength: () => {},
      addMarker: () => {}
    };
    const mockSession = sinon.mock(session);
    mockSession.expects('getLength').never();
    mockSession.expects('addMarker').never();

    const ace = {
      session: session,
      gotoLine: () => {}
    };
    const mockAce = sinon.mock(ace);
    mockAce.expects('gotoLine').never();

    const json = '{"foo": {"bar": {"baz": "buzz"}}}';
    const parsed = JSON.parse(json);

    const result = checkForParseErrors(json, markers, ace);
    expect(result.status).to.be(true);
    expect(result.parsed).to.eql(parsed);
    mockAce.verify();
    mockSession.verify();
  });
});

import expect from 'expect.js';
import { Statement } from '../statement';

describe('Statement class', () => {
  let meta;

  beforeEach(() => {
    meta = {
      source: {
        id: 'output',
        user: 'user',
        password: 'password'
      }
    };
  });

  describe('Statement from constructor', () => {
    it('creates a new Statement instance', () => {
      const statement = new Statement(
        'statement_id',
        true,
        {},
        meta
      );

      expect(statement.id).to.be('statement_id');
      expect(statement.hasExplicitId).to.be(true);
      expect(statement.stats).to.eql({});
      expect(statement.meta).to.equal(meta);
    });
  });
});

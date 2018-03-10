import expect from 'expect.js';
import { Queue } from '../queue';

describe('Queue class', () => {
  let queueVertex;
  let meta;

  describe('Queue from graph vertex', () => {
    beforeEach(() => {
      meta = {
        source: {
          id: 'output',
          user: 'user',
          password: 'password'
        }
      };

      queueVertex = {
        id: '__QUEUE__',
        hasExplicitId: false,
        stats: {},
        meta
      };
    });

    it('fromPipelineGraphVertex creates new Queue from vertex props', () => {
      const queue = Queue.fromPipelineGraphVertex(queueVertex);

      expect(queue.id).to.be('__QUEUE__');
      expect(queue.hasExplicitId).to.be(false);
      expect(queue.stats).to.eql({});
      expect(queue.meta).to.be(meta);
      expect(queue).to.be.a(Queue);
    });
  });
});
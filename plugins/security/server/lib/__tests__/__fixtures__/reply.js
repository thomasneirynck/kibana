import { spy } from 'sinon';

export function replyFixture() {
  const reply = spy();
  reply.redirect = spy();
  reply.continue = spy();
  reply.unstate = spy();
  return reply;
}
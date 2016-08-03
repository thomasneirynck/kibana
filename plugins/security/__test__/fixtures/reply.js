import { spy } from 'sinon';

export default () => {
  const reply = spy();
  reply.redirect = spy();
  reply.continue = spy();
  reply.unstate = spy();
  return reply;
};

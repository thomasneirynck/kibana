import { spy } from 'sinon';

export default () => {
  const reply = spy();
  reply.redirect = spy();
  reply.continue = spy();
  return reply;
};

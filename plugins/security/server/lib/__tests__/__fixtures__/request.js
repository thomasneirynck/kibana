export default () => {
  return {
    raw: {
      req: {
        headers: {
          accept: 'something/html'
        }
      }
    },
    url: {
      path: '/wat'
    },
    state: {
      user: 'these are the contents of the user client cookie'
    }
  };
};

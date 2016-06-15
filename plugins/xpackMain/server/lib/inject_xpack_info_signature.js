export default function injectXPackInfoSignature(info, request, reply) {
  // If we're returning an error response, refresh xpack info
  // from Elastisearch in case the error is due to a change in
  // license information in Elasticsearch
  if (request.response instanceof Error) {
    return info.refreshNow()
    .then((refreshedInfo) => {
      const signature = refreshedInfo.getSignature();
      if (signature) {
        request.response.output.headers['kbn-xpack-sig'] = signature;
      }
      return reply.continue();
    });
  } else {
    const signature = info.getSignature();
    if (signature) {
      request.response.headers['kbn-xpack-sig'] = signature;
    }
    return reply.continue();
  }
};

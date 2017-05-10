import { oncePerServer } from './once_per_server';

function getDocumentPayloadFn(server) {
  const exportTypesRegistry = server.plugins.reporting.exportTypesRegistry;

  function encodeContent(content, jobType) {
    if (!jobType) {
      return content;
    }

    const exportType = exportTypesRegistry.get(item => item.jobType === jobType);
    switch (exportType.jobContentEncoding) {
      case 'base64':
        return new Buffer(content, 'base64');
      default:
        return content;
    }
  }

  function getPayloadOutput(output, jobType) {
    const statusCode = 200;
    const content = encodeContent(output.content, jobType);
    const contentType = output.content_type;
    return { content, statusCode, contentType };
  }

  function getFailureOutput(output) {
    const statusCode = 500;
    const content = {
      message: 'Report generation failed',
      reason: output.content,
    };
    const contentType = 'text/json';
    return { content, statusCode, contentType };
  }

  function sendIncomplete(status) {
    const statusCode = 503;
    const content = status;
    const contentType = 'text/json';
    return { content, statusCode, contentType };
  }

  return function getDocumentPayload(doc) {
    const { status, output, jobtype: jobType } = doc._source;

    return new Promise((resolve, reject) => {
      if (status === 'completed') {
        return resolve(getPayloadOutput(output, jobType));
      }

      if (status === 'failed') {
        return reject(getFailureOutput(output));
      }

      // send a 503 indicating that the report isn't completed yet
      return reject(sendIncomplete(status));
    });
  };
}

export const getDocumentPayloadFactory = oncePerServer(getDocumentPayloadFn);


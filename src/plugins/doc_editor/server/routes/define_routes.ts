/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { IRouter } from 'src/core/server';
import { schema } from '@kbn/config-schema';
import { ROUTES_DOC } from '../../common';

export function defineRoutes(router: IRouter) {
  router.get(
    {
      path: ROUTES_DOC,
      validate: {
        query: schema.object({
          index: schema.string(),
          id: schema.string(),
        }),
      },
    },
    async (context, request, response) => {
      // console.log(request.query);

      const mappingResponse =
        await context.core.elasticsearch.client.asCurrentUser.indices.getMapping({
          index: request.query.index,
        });

      const docResponse = await context.core.elasticsearch.client.asCurrentUser.get({
        id: request.query.id,
        index: request.query.index,
      });

      console.log(docResponse);

      return response.ok({
        body: {
          mapping: mappingResponse.body,
          doc: docResponse.body,
        },
      });
    }
  );
}

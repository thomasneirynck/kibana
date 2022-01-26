/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { CoreSetup, CoreStart, Plugin } from 'src/core/public';
import {
  DocEditorPublicSetup,
  DocEditorPublicStart,
  DocEditorPublicSetupDependencies,
  DocEditorPublicStartDependencies,
} from './types';

export class DocEditorPublicPlugin implements Plugin<DocEditorPublicSetup, DocEditorPublicStart> {
  public setup(
    core: CoreSetup,
    setupPlugins: DocEditorPublicSetupDependencies
  ): DocEditorPublicSetup {
    return {
      async getHello(): Promise<string> {
        return core.http.basePath.prepend('Hello from doc editor');
      },
    };
  }

  public start(
    coreStart: CoreStart,
    startPlugins: DocEditorPublicStartDependencies
  ): DocEditorPublicStart {
    return {};
  }

  public stop() {}
}

/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React from 'react';
import { CoreSetup, CoreStart, Plugin } from 'src/core/public';
import {
  DocEditorPublicSetup,
  DocEditorPublicStart,
  DocEditorPublicSetupDependencies,
  DocEditorPublicStartDependencies,
} from './types';
import {Foobar, FoobarProps} from './components/foobar';
import {setCoreStart} from "./services";

export class DocEditorPublicPlugin implements Plugin<DocEditorPublicSetup, DocEditorPublicStart> {
  public setup(
    core: CoreSetup,
    setupPlugins: DocEditorPublicSetupDependencies
  ): DocEditorPublicSetup {
    return {
      async getHello(): Promise<string> {
        return core.http.basePath.prepend('Hello from doc editor setup');
      },
    };
  }

  public start(
    coreStart: CoreStart,
    startPlugins: DocEditorPublicStartDependencies
  ): DocEditorPublicStart {

    setCoreStart(coreStart);

    return {
      async getHello(): Promise<string> {
        return coreStart.http.basePath.prepend('Hello from doc editor start');
      },
      getFoobar(): any {
        return Foobar;
      },

      renderFoobar(props: FoobarProps): any {
        return <Foobar closeFlyout={props.closeFlyout} docId={props.docId} indexId={props.indexId} />;
      },
    };
  }

  public stop() {}
}

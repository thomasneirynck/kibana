import { DevToolsRegistryProvider } from 'ui/registry/dev_tools';
import { XPackInfoProvider } from 'plugins/xpack_main/services/xpack_info';

DevToolsRegistryProvider.register((Private) => {
  const xpackInfo = Private(XPackInfoProvider);
  return {
    order: 6,
    name: 'grokdebugger',
    display: 'Grok Debugger',
    url: '#/dev_tools/grokdebugger',
    disabled: !xpackInfo.get('features.grokdebugger.enableLink', false),
    tooltipContent: xpackInfo.get('features.grokdebugger.message')
  };
});

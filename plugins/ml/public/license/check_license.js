import XPackInfoProvider from 'plugins/xpack_main/services/xpack_info';
import Notifier from 'ui/notify/notifier';

import chrome from 'ui/chrome';

export default function checkLicense(Private, Promise, kbnBaseUrl) {
  const xpackInfo = Private(XPackInfoProvider);
  const licenseAllowsToShowThisPage = xpackInfo.get('features.ml.showAppLink') && xpackInfo.get('features.ml.enableAppLink');
  if (!licenseAllowsToShowThisPage) {
    const message = xpackInfo.get('features.ml.message');
    let queryString = `?${Notifier.QS_PARAM_LOCATION}=Machine Learning&`;
    queryString += `${Notifier.QS_PARAM_LEVEL}=error&${Notifier.QS_PARAM_MESSAGE}=${message}`;
    const url = `${chrome.addBasePath(kbnBaseUrl)}#${queryString}`;

    window.location.href = url;
    return Promise.halt();
  }

  return Promise.resolve();
}
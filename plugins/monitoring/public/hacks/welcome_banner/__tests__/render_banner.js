import expect from 'expect.js';
import sinon from 'sinon';

import { renderBanner } from '../render_banner';

describe('render_banner', () => {

  it('adds a banner to banners with priority of 10000', () => {
    const config = { };
    const banners = {
      add: sinon.stub()
    };
    banners.add.returns('brucer-banner');

    renderBanner(config, { _banners: banners });

    expect(banners.add.calledOnce).to.be(true);

    const bannerConfig = banners.add.getCall(0).args[0];

    expect(bannerConfig.component).not.to.be(undefined);
    expect(bannerConfig.priority).to.be(10000);
  });

});
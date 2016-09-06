import _ from 'lodash';
import expect from 'expect.js';
import text from 'plugins/tagcloud/vis/components/elements/text';
import visFixture from 'plugins/tagcloud/vis/components/__tests__/fixtures/vis_fixture';
import dataGenerator from 'plugins/tagcloud/vis/components/__tests__/fixtures/data_generator';
import remove, {removeChildren} from 'plugins/tagcloud/vis/components/__tests__/fixtures/remove';

describe('text SVG tests', function () {
  let element = text();
  let fixture;

  beforeEach(function () {
    fixture = visFixture();
    fixture.datum(dataGenerator(10)).call(element);
  });

  afterEach(function () {
    remove(fixture);
  });

  it('should return a function', function () {
    expect(_.isFunction(element)).to.be(true);
  });

  describe('class API', function () {
    let defaultClass;

    beforeEach(function () {
      removeChildren(fixture);
      defaultClass = 'text';
      element.cssClass(defaultClass);
    });

    it('should get the property', function () {
      expect(_.isEqual(element.cssClass(), defaultClass)).to.be(true);
    });

    it('should set the property', function () {
      element.cssClass('test');
      expect(_.isEqual(element.cssClass(), 'test')).to.be(true);
    });

    it('should set the proper value of the DOM attribute', function () {
      element.cssClass('text');
      fixture.call(element);

      fixture.selectAll('text')
        .each(function () {
          expect(_.isEqual(this.getAttribute('class'), element.cssClass())).to.be(true);
        });
    });
  });

  describe('transform API', function () {
    let defaultTransform;
    let newTransform;

    beforeEach(function () {
      removeChildren(fixture);
      defaultTransform = 'translate(0,0)';
      newTransform = function () {
        return 'rotate(45)';
      };
    });

    it('should get the property', function () {
      element.transform(defaultTransform);
      expect(_.isEqual(element.transform()(), defaultTransform)).to.be(true);
    });

    it('should set the property', function () {
      element.transform(newTransform);
      expect(_.isEqual(element.transform(), newTransform)).to.be(true);
    });

    it('should set the proper value of the DOM attribute', function () {
      element.transform(defaultTransform);
      fixture.call(element);

      fixture.selectAll('path')
        .each(function () {
          expect(_.isEqual(this.getAttribute('transform'), defaultTransform)).to.be(true);
        });
    });
  });

  describe('fill API', function () {
    let defaultFill = 'rgb(0,0,255)';

    beforeEach(function () {
      removeChildren(fixture);
      element.fill(defaultFill);
    });

    it('should get the property', function () {
      expect(_.isEqual(element.fill()(), defaultFill)).to.be(true);
    });

    it('should set the property', function () {
      let newFill = 'rgb(255,0,0)';
      element.fill(newFill);
      expect(_.isEqual(element.fill()(), newFill)).to.be(true);
    });

    it('should set the proper value of the DOM attribute', function () {
      element.fill(defaultFill);
      fixture.call(element);

      fixture.selectAll('text')
        .each(function () {
          expect(_.isEqual(this.style.fill.replace(/ /g, ''), element.fill()())).to.be(true);
        });
    });
  });

  describe('text API', function () {
    let defaultText = 'value';

    beforeEach(function () {
      removeChildren(fixture);
      element.text(defaultText);
    });

    it('should get the property', function () {
      expect(_.isEqual(element.text()({value: 'foo'}), 'foo')).to.be(true);
    });

    it('should set the property', function () {
      let newText = 'new value';
      element.text(newText);
      expect(_.isEqual(element.text()({'new value': 'foo'}), 'foo')).to.be(true);
    });

    it('should set the proper value of the DOM attribute', function () {
      element.text('innerHTML');
      fixture.call(element);

      fixture.selectAll('text')
        .each(function () {
          expect(_.isEqual(this.innerHTML, element.text()(this))).to.be(true);
        });
    });
  });

  describe('anchor API', function () {
    let defaultAnchor = 'middle';

    beforeEach(function () {
      removeChildren(fixture);
      element.textAnchor(defaultAnchor);
    });

    it('should get the property', function () {
      expect(_.isEqual(element.textAnchor()(), defaultAnchor)).to.be(true);
    });

    it('should set the property', function () {
      let newAnchor = 'start';
      element.textAnchor(newAnchor);
      expect(_.isEqual(element.textAnchor()(), newAnchor)).to.be(true);
    });

    it('should set the proper value of the DOM attribute', function () {
      element.textAnchor(defaultAnchor);
      fixture.call(element);

      fixture.selectAll('text')
        .each(function () {
          expect(_.isEqual(this.getAttribute('text-anchor'), element.textAnchor()())).to.be(true);
        });
    });
  });

});

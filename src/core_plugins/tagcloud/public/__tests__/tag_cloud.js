import expect from 'expect.js';
import TagCloud from 'plugins/tagcloud/tag_cloud';

describe('tag cloud', function () {

  let domNode;

  beforeEach(function () {
    domNode = document.createElement('div');
    domNode.style.top = '0';
    domNode.style.left = '0';
    domNode.style.width = '512px';
    domNode.style.height = '512px';
    domNode.style.position = 'fixed';
    domNode.style['pointer-events'] = 'none';
    document.body.appendChild(domNode);
  });

  afterEach(function () {
    document.body.removeChild(domNode);
  });

  function verifyExpectedValues(expectedValues, actualElements) {
    // console.log('testing');
    //
    // for (let i = 0; i < actualElements.length; i++){
    //   console.log(actualElements[0].getAttribute('transform'));
    // }

    expectedValues.forEach((test, index) => {
      expect(actualElements[index].style.fontSize).to.equal(test.fontSize);
      expect(actualElements[index].innerHTML).to.equal(test.text);
      expect(actualElements[index].getAttribute('transform')).to.equal(test.transform);
    });
  }


  it('should position elements correctly', function (done) {

    const tagCloud = new TagCloud(domNode);
    tagCloud.setData([
      {text: 'foo', size: 0},
      {text: 'bar', size: 100},
      {text: 'foobar', size: 200},
    ]);

    tagCloud.on('renderComplete', _ => {

      const expected = [
        {
          text: 'foo',
          fontSize: '10px',
          transform: 'translate(286, 271)rotate(0)'
        },
        {
          text: 'bar',
          fontSize: '23px',
          transform: 'translate(254, 282)rotate(0)'
        },
        {
          text: 'foobar',
          fontSize: '36px',
          transform: 'translate(256, 256)rotate(0)'
        }
      ];
      const textElements = domNode.querySelectorAll('text');
      expect(textElements.length).to.equal(expected.length);

      verifyExpectedValues(expected, textElements);

      done();
    });

  });


  it('should position elements correctly when rotated ', function (done) {

    const tagCloud = new TagCloud(domNode);
    tagCloud.setData([
      {text: 'foo', size: 0},
      {text: 'bar', size: 100},
      {text: 'foobar', size: 200},
    ]);
    tagCloud.setOptions({
      orientation: 'multiple',
      minFontSize: 10,
      maxFontSize: 36,
      scale: 'linear'
    });

    tagCloud.on('renderComplete', _ => {

      const expected = [
        {
          text: 'foo',
          fontSize: '10px',
          transform: 'translate(230, 283)rotate(-60)'
        },
        {
          text: 'bar',
          fontSize: '23px',
          transform: 'translate(207, 248)rotate(-15)'
        },
        {
          text: 'foobar',
          fontSize: '36px',
          transform: 'translate(256, 256)rotate(-105)'
        }
      ];
      const textElements = domNode.querySelectorAll('text');
      expect(textElements.length).to.equal(expected.length);

      verifyExpectedValues(expected, textElements);

      done();
    });

  });


});

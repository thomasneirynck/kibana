import expect from 'expect.js';
import { sortableBoolean } from '../sortable_boolean';

describe('sortable_boolean', () => {

  const trueExpected = { value: true, sortOrder: -1 };
  const falseExpected = { value: false, sortOrder: 0 };

  it('sets the sortOrder property correctly', () => {
    const trueActual = sortableBoolean(true);
    const falseActual = sortableBoolean(false);

    expect(trueActual.sortOrder).to.be(trueExpected.sortOrder);
    expect(falseActual.sortOrder).to.be(falseExpected.sortOrder);
  });

  it('sets the value property correctly', () => {
    expect(sortableBoolean().value).to.be(falseExpected.value);
    expect(sortableBoolean(0).value).to.be(falseExpected.value);
    expect(sortableBoolean(null).value).to.be(falseExpected.value);
    expect(sortableBoolean('').value).to.be(falseExpected.value);
    expect(sortableBoolean(false).value).to.be(falseExpected.value);

    expect(sortableBoolean(true).value).to.be(trueExpected.value);
    expect(sortableBoolean(1).value).to.be(trueExpected.value);
    expect(sortableBoolean('true').value).to.be(trueExpected.value);
    expect(sortableBoolean('false').value).to.be(trueExpected.value);
    expect(sortableBoolean('foo').value).to.be(trueExpected.value);
    expect(sortableBoolean([]).value).to.be(trueExpected.value);
    expect(sortableBoolean({}).value).to.be(trueExpected.value);
  });

});

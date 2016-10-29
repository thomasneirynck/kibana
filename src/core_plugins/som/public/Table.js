

export default function makeTable(esResponse){

  const ponder = window.PONDER;

  class Table extends ponder.Table {
    constructor(tabifiedResponse) {
      super();
      this._table = tabifiedResponse;
    }

    columnType(index) {
      if (index === 0) {
        return ponder.Table.IGNORE;
      } else {
        return ponder.Table.ORDINAL;
      }
    }

    getName() {
      return 'Elasticsearch results';
    }

    columnCount() {
      return this._table.columns.length;
    }

    rowCount() {
      //of course, we will need to unpack this once we do sub-buckets on terms
      return this._table.rows.length;
    }

    columnLabel(index) {
      return this._table.columns[index].title;
    }

    getValue(row, column) {
      return this._table.rows[row][column].value;
    }
  }


  return new Table(esResponse);

}



export default function makeTable(esResponse){

  const ponder = window.PONDER;

  class Table extends ponder.Table {
    constructor(esResponse) {
      super();
      this._esResponse = esResponse;
    }

    // columnType(index) {
    //   // var label = this._columns[index];
    //   //
    //   // return (this._selectedCategoryColumns.indexOf(label) >= 0) ? PONDER.Table.CATEGORY :
    //   //   (this._selectedOrdinalColumns.indexOf(label) >= 0) ? PONDER.Table.ORDINAL :
    //   //     PONDER.Table.IGNORE;
    // }
    //
    // getName () {
    //   return this._name;
    // }
    //
    // columnCount () {
    //   return this._columns.length;
    // }
    //
    // rowCount () {
    //   return this._data.length;
    // }
    //
    // columnLabel (index) {
    //   return this._columns[index];
    // }
    // getValue (row, column) {
    //   return this._data[row][column];
    // }
  }


  return new Table(esResponse);

}

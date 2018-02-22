import { Observable } from 'rxjs';

export function $getClips(dimensions, max) {
  return Observable.from(function* () {
    const columns = Math.ceil(dimensions.width / max);
    const rows = Math.ceil(dimensions.height / max);

    for (let row = 0; row < rows; ++row) {
      for (let column = 0; column < columns; ++column) {
        yield {
          x: column * max + dimensions.x,
          y: row * max + dimensions.y,
          width: column === columns - 1 ? dimensions.width - (column * max) : max,
          height: row === rows - 1 ? dimensions.height - (row * max) : max,
        };
      }
    }
  }());
}
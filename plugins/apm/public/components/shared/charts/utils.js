export function getYMaxRounded(yMax) {
  if (yMax <= 0) {
    return 0;
  }

  const yMaxUpper = yMax * 1.1;
  const initialBase = Math.floor(Math.log10(yMaxUpper));
  const base = initialBase > 2 ? initialBase - 1 : initialBase;
  return Math.ceil(yMaxUpper / 10 ** base) * 10 ** base;
}

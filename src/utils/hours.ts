export function roundToQuarter(number: number): number {
  return Math.round((Number(number) || 0) * 4) / 4;
}

export function toNumber(value: string | number): number {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? roundToQuarter(number) : 0;
}

export function formatNumberForInput(value: number): string {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? String(roundToQuarter(number)) : '';
}

export function formatHours(value: number): string {
  const number = roundToQuarter(value);
  return Number.isInteger(number) ? String(number) : number.toFixed(2).replace(/0$/, '');
}

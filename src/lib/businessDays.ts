// Calculo de dias uteis (seg-sex). Nao considera feriados nacionais/locais
// ainda -- se isso importar no futuro, plugar uma lista de feriados aqui.

function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

function atMidnightUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function addBusinessDays(start: Date, days: number): Date {
  const result = atMidnightUTC(start);
  let remaining = days;
  while (remaining > 0) {
    result.setUTCDate(result.getUTCDate() + 1);
    if (!isWeekend(result)) remaining -= 1;
  }
  return result;
}

// Numero de dias uteis entre `from` e `to` (positivo se `to` esta no futuro).
// Nao conta o proprio dia `from`.
export function businessDaysBetween(from: Date, to: Date): number {
  const a = atMidnightUTC(from);
  const b = atMidnightUTC(to);
  if (a.getTime() === b.getTime()) return 0;

  const direction = b > a ? 1 : -1;
  const cursor = new Date(a);
  let count = 0;
  while (cursor.getTime() !== b.getTime()) {
    cursor.setUTCDate(cursor.getUTCDate() + direction);
    if (!isWeekend(cursor)) count += direction;
  }
  return count;
}

/**
 * Formatage des dates et heures selon la convention française :
 * - Dates : JJ/MM/AAAA
 * - Heures : HH:mm (24 h)
 */

const pad = (n: number): string => String(n).padStart(2, '0');

/**
 * Formate une Date en JJ/MM/AAAA.
 */
export function formatDate(input: Date | string | number | undefined): string {
  if (input === undefined || input === null || input === '') {
    return '';
  }
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) {
    return String(input);
  }
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/**
 * Formate une Date en HH:mm (24 h).
 */
export function formatTime(input: Date | string | number | undefined): string {
  if (input === undefined || input === null || input === '') {
    return '';
  }
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) {
    return String(input);
  }
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Formate une date et heure en JJ/MM/AAAA HH:mm.
 */
export function formatDateTime(input: Date | string | number | undefined): string {
  if (input === undefined || input === null || input === '') {
    return '';
  }
  return `${formatDate(input)} ${formatTime(input)}`;
}
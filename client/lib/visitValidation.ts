import { DataValidationError } from './errors';

export function validateVisitBody(body: unknown) {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new DataValidationError('Body must be an object');
  }
  const restaurantId = 'restaurantId' in body ? body.restaurantId : undefined;
  const date = 'date' in body ? body.date : undefined;
  const amountSpent = 'amountSpent' in body ? body.amountSpent : undefined;
  const notes = 'notes' in body ? body.notes : null;

  if (typeof restaurantId !== 'number' || !Number.isInteger(restaurantId) || restaurantId < 1 || restaurantId > 2_147_483_647) {
    throw new DataValidationError('Restaurant ID must be a positive integer');
  }
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date.startsWith('0000')) {
    throw new DataValidationError('Date must be a valid date in YYYY-MM-DD format');
  }
  const parsedDate = new Date(`${date}T00:00:00.000Z`);
  if (!Number.isFinite(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
    throw new DataValidationError('Date must be a valid calendar date');
  }
  if (notes !== null && (typeof notes !== 'string' || notes.length > 2000)) {
    throw new DataValidationError('Notes must be text of at most 2000 characters, or null');
  }
  // Match NUMERIC(10, 2); reject extra decimal places rather than silently rounding.
  if (typeof amountSpent !== 'number' || !Number.isFinite(amountSpent) || amountSpent < 0 || amountSpent > 99_999_999.99 ||
      Math.abs(amountSpent * 100 - Math.round(amountSpent * 100)) > 0.000001) {
    throw new DataValidationError('Amount spent must be between 0 and 99999999.99 with at most two decimal places');
  }
  return { restaurantId, date, amountSpent, notes };
}

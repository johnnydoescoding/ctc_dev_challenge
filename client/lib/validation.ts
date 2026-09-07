import { DataValidationError, DuplicateRestrauntError, NotFoundError } from '@/lib/errors';
 import { pool } from '@/db/pool';
 const POSTGRES_INTEGER_MAX = 2_147_483_647;

//enforce correct type
//make sure the field exists in body
export function validateRestrauntBody(body: unknown): void {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new DataValidationError('Body must be an object');
  }

  if (
    !('name' in body) ||
    typeof body.name !== 'string' ||
    body.name.trim() === ''
  ) {
    throw new DataValidationError('Name must be a non-empty string');
  }

  if (!('cuisine' in body) || typeof body.cuisine !== 'string') {
    throw new DataValidationError('Cuisine must be a string');
  }

  if (!('address' in body) || typeof body.address !== 'string') {
    throw new DataValidationError('Address must be a string');
  }

  if (
    !('rating' in body) ||
    (typeof body.rating !== 'number' ||
    !Number.isFinite(body.rating) ||
    body.rating < 0 ||
    body.rating > 5)
  ) {
    throw new DataValidationError('Rating must be a number between 0 and 5');
  }
}


export async function validateNoDuplicate(
    name: string,
    address: string,
    excludeId?: number
  ): Promise<void> {
    const { rows } = await pool.query(
      `SELECT id FROM restaurants
       WHERE (lower(trim(name)) = lower(trim($1::text))
           OR lower(trim(address)) = lower(trim($2::text)))
         AND ($3::integer IS NULL OR id <> $3::integer)
       LIMIT 1`,
      [name, address, excludeId ?? null]
    );

    if (rows.length > 0) {
      throw new DuplicateRestrauntError(
        'A restaurant with that name or address already exists'
      );
    }
}

export function validateId(rawId: string) : number { 
    const id = Number(rawId);
    if (!Number.isInteger(id) || id <= 0 || id > POSTGRES_INTEGER_MAX) {
        throw new NotFoundError('Restaurant not found');
    }

    return id; 
}

export function validateExistence(rowCount: number | null) : void {
    if (rowCount=== 0) {
      throw new NotFoundError("Restaurant not found");
    }
}

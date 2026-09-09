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

  const latitude = 'latitude' in body ? body.latitude ?? null : null;
  const longitude = 'longitude' in body ? body.longitude ?? null : null;

  // Missing/null coordinates mean this restaurant has no map location yet.
  if (latitude === null && longitude === null) return;

  if (latitude === null || longitude === null) {
    throw new DataValidationError('Latitude and longitude must be provided together');
  }

  if (
    typeof latitude !== 'number' || !Number.isFinite(latitude) ||
    latitude < -90 || latitude > 90
  ) {
    throw new DataValidationError('Latitude must be a finite number between -90 and 90');
  }

  if (
    typeof longitude !== 'number' || !Number.isFinite(longitude) ||
    longitude < -180 || longitude > 180
  ) {
    throw new DataValidationError('Longitude must be a finite number between -180 and 180');
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

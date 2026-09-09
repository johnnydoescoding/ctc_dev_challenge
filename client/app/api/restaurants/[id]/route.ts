import { NextResponse } from 'next/server';
import { pool } from '@/db/pool';
import { handleError } from '@/lib/errors';
import { toRestaurant } from '@/lib/types';
import { validateRestrauntBody, validateNoDuplicate, validateId, validateExistence } from '@/lib/validation';

type Params = { params: { id: string } };

/**
 * GET /api/restaurants/:id
 * Returns a single restaurant, or 404 if it doesn't exist.
 */
export async function GET(_req: Request, { params }: Params) {
  try {
    const id = validateId(params.id);
    const { rows } = await pool.query(
      'SELECT * FROM restaurants WHERE id = $1',
      [id]
    );
    validateExistence(rows.length);
    return NextResponse.json(toRestaurant(rows[0]));
  } catch (err) {
    return handleError(err);
  }
}

/**
 * PUT /api/restaurants/:id
 * Update an existing restaurant.
 *
 * TODO (A2): implement. Update the row matching :id and return the updated
 * record (or 404 if it doesn't exist). Validate the body the same way POST does.
 */
export async function PUT(_req: Request, { params }: Params) {
  try {
    const body = await _req.json();
    validateRestrauntBody(body);
    const { name, cuisine, address, rating, latitude = null, longitude = null } = body;
    const id = validateId(params.id);
    await validateNoDuplicate(name, address, id);

    const { rows } = await pool.query(
      `UPDATE restaurants
      SET name=$1, cuisine=$2, address=$3, rating=$4, latitude=$5, longitude=$6
      WHERE id=$7
      RETURNING *`,
      [name, cuisine, address, rating, latitude, longitude, id]
    );
    validateExistence(rows.length);
    return NextResponse.json(toRestaurant(rows[0]), { status: 200 });

  } catch (err) { 
    return handleError(err);
  }
  
}

/**
 * DELETE /api/restaurants/:id
 * Delete a restaurant.
 *
 * TODO (A2): implement. Delete the row matching :id and return 204 (or 404
 * if it doesn't exist).
 *
 * Worth noticing: the migration already made a call about what happens to that
 * restaurant's visits. Go read it. If you disagree with it, say so in your
 * write-up.
 */
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const id = validateId(params.id);
    const { rowCount } = await pool.query(
      `DELETE FROM restaurants WHERE id = $1`,
      [id]
    );
    validateExistence(rowCount);

    return new NextResponse(null, { status: 204 });

  } catch (err) {
    return handleError(err);
  }
}

import { NextResponse } from 'next/server';
import { pool } from '@/db/pool';
import { handleError, NotFoundError } from '@/lib/errors';
import { toRestaurant, toVisit } from '@/lib/types';
import { validateVisitBody } from '@/lib/visitValidation';
import { validateExistence } from '@/lib/validation';

// Nest the restaurant row to avoid collisions between restaurant and visit IDs.
export async function GET() {
  try {
    const { rows } = await pool.query(
      `SELECT v.*, row_to_json(r) AS restaurant
       FROM visits v JOIN restaurants r ON r.id = v."restaurantId"
       ORDER BY v.date DESC, v.id DESC`
    );
    return NextResponse.json(rows.map(row => ({
      ...toVisit(row),
      restaurant: toRestaurant(row.restaurant),
    })));
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = validateVisitBody(await request.json());
    // Selecting the restaurant as part of the insert handles missing IDs.
    const { rows } = await pool.query(
      `INSERT INTO visits ("restaurantId", date, "amountSpent", notes)
       SELECT id, $2::date, $3, $4 FROM restaurants WHERE id = $1
       RETURNING *`,
      [body.restaurantId, body.date, body.amountSpent, body.notes]
    );
    validateExistence(rows.length);
    return NextResponse.json(toVisit(rows[0]), { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

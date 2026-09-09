import { pool } from './pool';

/**
 * Seed the database with sample data: 5 restaurants and 3 visits.
 *
 * Run with: npm run seed
 *
 * Clears existing rows first so re-seeding gives you a clean, predictable set.
 */

// Real USC-area addresses; ratings below are fictional sample ratings.
// Coordinates come from MapTiler street-address matches, not suite entrances.
// Gogobop and sweetgreen share a building, so their coordinates are identical.
const restaurants = [
  {
    name: 'CAVA',
    cuisine: 'Mediterranean',
    address: '3201 S Hoover St, Suite 1840, Los Angeles, CA 90089',
    rating: 4.5,
    latitude: 34.025019,
    longitude: -118.284484,
  },
  {
    name: 'Gogobop',
    cuisine: 'Korean',
    address: '929 W Jefferson Blvd, Suite 1610, Los Angeles, CA 90089',
    rating: 4.8,
    latitude: 34.024925,
    longitude: -118.285134,
  },
  {
    name: 'sweetgreen',
    cuisine: 'Salads',
    address: '929 W Jefferson Blvd, Suite 1650, Los Angeles, CA 90089',
    rating: 4.2,
    latitude: 34.024925,
    longitude: -118.285134,
  },
  {
    name: 'Dulce',
    cuisine: 'Cafe and Bakery',
    address: '3096 McClintock Ave, Suite 1420, Los Angeles, CA 90007',
    rating: 4.6,
    latitude: 34.025634,
    longitude: -118.285216,
  },
  {
    // Near USC on Figueroa, rather than inside USC Village.
    name: "Jersey Mike's",
    cuisine: 'Sandwiches',
    address: '3584 S Figueroa St, Suite 2, Los Angeles, CA 90007',
    rating: 3.9,
    latitude: 34.018577,
    longitude: -118.281862,
  },
];

const visits = [
  { restaurantIndex: 0, date: '2026-01-12', amountSpent: 42.5, notes: 'Burger night with the crew.' },
  { restaurantIndex: 1, date: '2026-02-03', amountSpent: 88.0, notes: 'Omakase. Worth every penny.' },
  { restaurantIndex: 3, date: '2026-03-21', amountSpent: 31.75, notes: 'Tacos to go.' },
];

async function seed(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Wipe and reset identity so ids are stable between seeds.
    await client.query('TRUNCATE visits, restaurants RESTART IDENTITY CASCADE');

    const restaurantIds: number[] = [];
    for (const r of restaurants) {
      const { rows } = await client.query(
        `INSERT INTO restaurants (name, cuisine, address, rating, latitude, longitude)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [r.name, r.cuisine, r.address, r.rating, r.latitude, r.longitude]
      );
      restaurantIds.push(rows[0].id);
    }

    for (const v of visits) {
      await client.query(
        `INSERT INTO visits ("restaurantId", date, "amountSpent", notes)
         VALUES ($1, $2, $3, $4)`,
        [restaurantIds[v.restaurantIndex], v.date, v.amountSpent, v.notes]
      );
    }

    await client.query('COMMIT');
    console.log(`Seeded ${restaurants.length} restaurants and ${visits.length} visits.`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

seed()
  .then(() => pool.end())
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    pool.end().finally(() => process.exit(1));
  });

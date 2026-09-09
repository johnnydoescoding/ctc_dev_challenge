'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { Restaurant, Visit, VisitWithRestaurant } from '@/lib/types';
import { getRestaurants, getVisits } from '@/lib/apiClient';
import AddVisitForm from './AddVisitForm';
import VisitCard from './VisitCard';

// Leaflet needs the browser, so Next.js loads this component only there.
const MapPanel = dynamic(() => import('./MapPanel'), { ssr: false });

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default function VisitsDashboard() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [visits, setVisits] = useState<VisitWithRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const restaurantData = await getRestaurants();
        if (!Array.isArray(restaurantData)) {
          throw new Error('Could not load restaurants.');
        }
        const visitData = await getVisits();
        setRestaurants(restaurantData);
        setVisits(visitData);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('Could not load visits.');
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Sum integer cents to avoid floating-point accumulation errors.
  let totalCents = 0;
  for (const visit of visits) {
    totalCents += Math.round(visit.amountSpent * 100);
  }
  const total = totalCents / 100;
  let totalLabel = '—';
  if (!loading && !error) {
    totalLabel = money.format(total);
  }

  function addRestaurant(restaurant: Restaurant) {
    setRestaurants(current => current.concat(restaurant));
  }

  function addVisit(visit: Visit, restaurant: Restaurant) {
    const visitWithRestaurant = { ...visit, restaurant };
    const updatedVisits = visits.concat(visitWithRestaurant);
    updatedVisits.sort((first, second) => {
      if (first.date === second.date) {
        return second.id - first.id;
      }
      return second.date.localeCompare(first.date);
    });
    setVisits(updatedVisits);
    setShowForm(false);
  }

  return (
    <>
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <h1 className="text-xl font-semibold">Feeding Brennen</h1>
          <p className="text-sm" aria-live="polite">
            Total spent <strong className="ml-2">{totalLabel}</strong>
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        {loading && <p role="status">Loading visits…</p>}
        {error && <p role="alert">{error} Please refresh to try again.</p>}
        {!loading && !error && (
          <div className="grid gap-8 lg:grid-cols-2">
            <section className="min-w-0" aria-labelledby="visits-heading">
              <div className="mb-4 flex items-center justify-between">
                <h2 id="visits-heading" className="text-lg font-medium">Visits</h2>
                <button type="button" aria-label="Add visit" aria-expanded={showForm}
                  className="rounded bg-gray-900 px-3 py-1 text-xl text-white disabled:opacity-50"
                  disabled={showForm} onClick={() => setShowForm(true)}>+</button>
              </div>
              {showForm && (
                <AddVisitForm
                  restaurants={restaurants}
                  onRestaurantCreated={addRestaurant}
                  onSaved={addVisit}
                  onCancel={() => setShowForm(false)}
                />
              )}
              {visits.length === 0 && (
                <p className="text-gray-600">No visits yet. Use + to record your first meal out.</p>
              )}
              {visits.length > 0 && (
                <ul className="max-h-[650px] space-y-3 overflow-y-auto">
                  {visits.map(visit => (
                    <VisitCard key={visit.id} visit={visit} />
                  ))}
                </ul>
              )}
            </section>
            <MapPanel restaurants={restaurants} visits={visits} />
          </div>
        )}
      </main>
    </>
  );
}

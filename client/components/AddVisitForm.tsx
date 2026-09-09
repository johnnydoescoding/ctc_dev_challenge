'use client';

import { useState, type FormEvent } from 'react';
import dynamic from 'next/dynamic';
import type { Restaurant, Visit } from '@/lib/types';
import { addRestaurant, addVisit } from '@/lib/apiClient';
import type { AddressResult } from './AddressSearch';

// MapTiler's search element needs the browser.
const AddressSearch = dynamic(() => import('./AddressSearch'), { ssr: false });

function today() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function AddVisitForm({ restaurants, onRestaurantCreated, onSaved, onCancel }: {
  restaurants: Restaurant[];
  onRestaurantCreated: (restaurant: Restaurant) => void;
  onSaved: (visit: Visit, restaurant: Restaurant) => void;
  onCancel: () => void;
}) {
  let initialRestaurantId = '';
  if (restaurants.length === 0) {
    initialRestaurantId = 'new';
  }
  const [restaurantId, setRestaurantId] = useState(initialRestaurantId);
  const [location, setLocation] = useState<AddressResult | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  let saveButtonLabel = 'Save visit';
  if (saving) {
    saveButtonLabel = 'Saving…';
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) {
      return;
    }
    // 1. Read the form and check that a new restaurant has an address.
    const form = new FormData(event.currentTarget);
    setError('');
    if (restaurantId === 'new' && !location) {
      setError('Choose an address from the search results.');
      return;
    }
    setSaving(true);
    let created = false;
    try {
      // 2. Use an existing restaurant, or save a new one first.
      let restaurant = restaurants.find(item => item.id === Number(restaurantId));
      if (restaurantId === 'new' && location) {
        restaurant = await addRestaurant({
          name: String(form.get('name') ?? ''),
          cuisine: String(form.get('cuisine') ?? ''),
          rating: Number(form.get('rating')),
          address: location.address,
          latitude: location.latitude,
          longitude: location.longitude,
        });
        // Keep the restaurant if the following visit request fails.
        onRestaurantCreated(restaurant);
        setRestaurantId(String(restaurant.id));
        created = true;
      }
      if (!restaurant) {
        throw new Error('Choose a restaurant.');
      }
      // 3. Save the visit and tell the dashboard to display it.
      const notesText = String(form.get('notes') ?? '').trim();
      let notes: string | null = null;
      if (notesText !== '') {
        notes = notesText;
      }
      const visit = await addVisit({
        restaurantId: restaurant.id,
        date: String(form.get('date') ?? ''),
        amountSpent: Number(form.get('amountSpent')),
        notes: notes,
      });
      onSaved(visit, restaurant);
    } catch (error) {
      let message = 'Could not save the visit.';
      if (error instanceof Error) {
        message = error.message;
      }
      if (created) {
        message = `Restaurant saved, but the visit was not saved. ${message}`;
      }
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="mb-5 rounded-lg border border-gray-200 bg-white p-4" aria-label="Add visit">
      <fieldset disabled={saving} className="space-y-4">
        <legend className="mb-3 font-semibold">Record a visit</legend>
        <label className="block text-sm font-medium">Restaurant
          <select className="form-input" value={restaurantId} onChange={event => setRestaurantId(event.target.value)} required>
            <option value="" disabled>Choose a restaurant</option>
            {restaurants.map(restaurant => (
              <option key={restaurant.id} value={restaurant.id}>
                {restaurant.name} — {restaurant.address}
              </option>
            ))}
            <option value="new">+ Add a new restaurant</option>
          </select>
        </label>
        {restaurantId === 'new' && (
          <div className="space-y-4 rounded bg-gray-50 p-3">
            <label className="block text-sm font-medium">
              Name
              <input className="form-input" name="name" required maxLength={200} />
            </label>
            <label className="block text-sm font-medium">
              Cuisine
              <input className="form-input" name="cuisine" required maxLength={100} />
            </label>
            <AddressSearch onSelect={setLocation} />
            <label className="block text-sm font-medium">Restaurant rating (0–5)
              <input className="form-input" name="rating" type="number" min="0" max="5" step="0.1" required />
            </label>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            Visit date
            <input className="form-input" name="date" type="date" defaultValue={today()} required />
          </label>
          <label className="block text-sm font-medium">
            Amount spent ($)
            <input className="form-input" name="amountSpent" type="number" min="0" max="99999999.99" step="0.01" required />
          </label>
        </div>
        <label className="block text-sm font-medium">
          Notes (optional)
          <textarea className="form-input" name="notes" rows={2} maxLength={2000} />
        </label>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <div className="flex gap-3">
          <button className="rounded bg-gray-900 px-4 py-2 text-sm text-white disabled:opacity-50" type="submit">
            {saveButtonLabel}
          </button>
          <button className="rounded border px-4 py-2 text-sm" type="button" onClick={onCancel}>Cancel</button>
        </div>
      </fieldset>
    </form>
  );
}

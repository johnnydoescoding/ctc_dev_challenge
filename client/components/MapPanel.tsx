'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { Restaurant, Visit } from '@/lib/types';

export default function MapPanel({ restaurants, visits }: { restaurants: Restaurant[]; visits: Visit[] }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;

  useEffect(() => {
    if (!mapContainer.current || !apiKey) {
      return;
    }

    const map = L.map(mapContainer.current, { scrollWheelZoom: false }).setView([39, -98], 4);

    L.tileLayer(
      `https://api.maptiler.com/maps/streets-v4/256/{z}/{x}/{y}.png?key=${encodeURIComponent(apiKey)}`,
      {
        minZoom: 1,
        maxZoom: 19,
        attribution:
          '<a href="https://www.maptiler.com/copyright/">&copy; MapTiler</a> ' +
          '<a href="https://www.openstreetmap.org/copyright">&copy; OpenStreetMap contributors</a>',
      },
    ).addTo(map);

    const bounds = L.latLngBounds([]);
    for (const restaurant of restaurants) {
      // One pin per restaurant, and only after a recorded visit.
      const hasVisit = visits.some(visit => visit.restaurantId === restaurant.id);
      if (!hasVisit) {
        continue;
      }
      if (restaurant.latitude === null || restaurant.longitude === null) {
        continue;
      }

      const rating = restaurant.rating;
      let color = '#b91c1c'; // Red
      if (rating >= 4) {
        color = '#15803d'; // Green
      } else if (rating >= 2.5) {
        color = '#a16207'; // Amber
      }

      const label = document.createElement('div');
      label.className = 'restaurant-pin';
      label.style.backgroundColor = color;
      label.textContent = `${rating} ★`;
      const icon = L.divIcon({
        html: label,
        className: '',
        iconSize: [52, 34],
        iconAnchor: [26, 17],
      });
      L.marker([restaurant.latitude, restaurant.longitude], {
        icon: icon,
        title: restaurant.name,
        alt: restaurant.name,
      }).addTo(map);
      bounds.extend([restaurant.latitude, restaurant.longitude]);
    }
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [35, 35], maxZoom: 15 });
    }

    return () => {
      map.remove();
    };
  }, [apiKey, restaurants, visits]);

  return (
    <section className="min-w-0" aria-labelledby="map-heading">
      <h2 id="map-heading" className="mb-4 text-lg font-medium">Map</h2>
      {!apiKey && <p role="status" className="mb-2 text-sm text-gray-600">Map unavailable: no map key configured.</p>}
      <div
        ref={mapContainer}
        className="relative z-0 h-[450px] w-full rounded-lg border border-gray-200"
        role="region"
        aria-label="Interactive restaurant map"
      />
      <p className="mt-2 text-sm text-gray-600">Ratings: green 4–5 · amber 2.5 to below 4 · red below 2.5.</p>
    </section>
  );
}

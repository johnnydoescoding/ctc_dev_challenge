'use client';

import { useEffect, useRef } from 'react';
import { MaptilerGeocoderElement, type PickEvent } from '@maptiler/geocoding-control';

export interface AddressResult {
  address: string;
  latitude: number;
  longitude: number;
}

export default function AddressSearch(
  { onSelect }: { onSelect: (result: AddressResult | null) => void }
) {
  const container = useRef<HTMLDivElement>(null);
  const apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;

  useEffect(() => {
    if (!container.current || !apiKey) {
      return;
    }

    // 1. Create MapTiler's ready-made address search.
    const geocoder = new MaptilerGeocoderElement();
    geocoder.setOptions({
      apiKey,
      types: ['address'],
      placeholder: 'Search for a street address',
      fetchFullGeometryOnPick: false,
    });

    // 2. Send the chosen address and coordinates to the visit form.
    function selectAddress(event: PickEvent) {
      const feature = event.detail.feature;
      if (!feature) {
        onSelect(null);
        return;
      }
      onSelect({
        address: feature.place_name,
        longitude: feature.center[0],
        latitude: feature.center[1],
      });
    }

    function clearAddress() {
      onSelect(null);
    }

    geocoder.addEventListener('pick', selectAddress);
    geocoder.addEventListener('querychange', clearAddress);
    geocoder.addEventListener('queryclear', clearAddress);
    // This cast works around MapTiler's DOM type definitions.
    container.current.appendChild(geocoder as unknown as Node);

    // 3. Remove the search and listeners when the form closes.
    return () => {
      geocoder.removeEventListener('pick', selectAddress);
      geocoder.removeEventListener('querychange', clearAddress);
      geocoder.removeEventListener('queryclear', clearAddress);
      geocoder.remove();
    };
  }, [apiKey, onSelect]);

  return (
    <div>
      <p className="mb-1 text-sm font-medium">Address</p>
      <div ref={container} />
      {!apiKey && <p role="status">Address search is not configured.</p>}
    </div>
  );
}

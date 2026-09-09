import type { VisitWithRestaurant } from '@/lib/types';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default function VisitCard({ visit }: { visit: VisitWithRestaurant }) {
  const costLabel = money.format(visit.amountSpent);
  const ratingLabel = `${visit.restaurant.rating} ★`;

  return (
    <li className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex justify-between gap-3">
        <h3 className="font-semibold">{visit.restaurant.name}</h3>
        <span>{costLabel}</span>
      </div>
      <p className="mt-1 text-sm text-gray-600">
        <time dateTime={visit.date}>{visit.date}</time> · {ratingLabel}
      </p>
      <p className="text-sm text-gray-600">{visit.restaurant.address}</p>
      {visit.notes && (
        <p className="mt-2 whitespace-pre-wrap break-words text-sm">{visit.notes}</p>
      )}
    </li>
  );
}

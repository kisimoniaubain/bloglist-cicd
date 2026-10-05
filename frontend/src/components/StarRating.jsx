import { Star } from 'lucide-react';

export default function StarRating({ rating = 0, max = 5, size = 16 }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => {
        const filled = i < Math.floor(rating);
        const half = !filled && i < rating;
        return (
          <Star
            key={i}
            size={size}
            className={filled || half ? 'text-[#b45309]' : 'text-gray-200'}
            fill={filled ? 'currentColor' : half ? 'url(#half)' : 'none'}
          />
        );
      })}
    </div>
  );
}


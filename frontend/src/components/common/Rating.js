import React from 'react';

const Rating = ({ value, count, onRate, editable, size = 'base' }) => {
  // Calculate the filled and empty stars
  const stars = Array.from({ length: 5 }, (_, i) => i + 1);
  
  // Size classes
  const sizeClasses = {
    'sm': 'h-4 w-4',
    'base': 'h-5 w-5',
    'lg': 'h-6 w-6'
  };
  
  const starSize = sizeClasses[size] || sizeClasses.base;
  
  // Handle star click (for editable rating)
  const handleClick = (rating) => {
    if (editable && onRate) {
      onRate(rating);
    }
  };
  
  return (
    <div className="flex items-center">
      <div className="flex">
        {stars.map((star) => (
          <button
            key={star}
            type="button"
            className={`${editable ? 'cursor-pointer' : 'cursor-default'} p-0 bg-transparent border-none focus:outline-none`}
            onClick={() => handleClick(star)}
            disabled={!editable}
          >
            {star <= value ? (
              <svg 
                className={`text-yellow-400 ${starSize}`} 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ) : (
              <svg 
                className={`text-gray-300 dark:text-gray-600 ${starSize}`} 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            )}
          </button>
        ))}
      </div>
      
      {count !== undefined && (
        <p className="ml-2 text-sm text-gray-500 dark:text-gray-400">
          ({count} {count === 1 ? 'review' : 'reviews'})
        </p>
      )}
    </div>
  );
};

export default Rating;
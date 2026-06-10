import React from 'react';

import { Group } from '../../../../utilities/api/types';

// Square group avatar — the group image when present, otherwise a gradient
// tile with the first letter. `lg` is used in the detail header.
const GroupAvatar: React.FC<{ group: Group; size?: 'sm' | 'lg' }> = ({ group, size = 'sm' }) => {
  const initial = (group.name || '?').trim().charAt(0).toUpperCase();
  // Detail view gets a larger avatar, scaling up where the modal has room.
  const sizeClass = size === 'lg' ? 'w-14 h-14 sm:w-20 sm:h-20 rounded-lg' : 'w-10 h-10 rounded-md';
  if (group.image_url) {
    return (
      <img
        src={group.image_url}
        alt=""
        className={`${sizeClass} object-cover shrink-0 ring-1 ring-white/10`}
      />
    );
  }
  return (
    <div
      className={`${sizeClass} bg-gradient-to-br from-[var(--er-button-primary)] to-[var(--er-button-primary-hover)] flex items-center justify-center text-white ${size === 'lg' ? 'text-2xl sm:text-3xl' : 'text-sm'} font-semibold shrink-0 shadow-sm`}
    >
      {initial}
    </div>
  );
};

export default GroupAvatar;

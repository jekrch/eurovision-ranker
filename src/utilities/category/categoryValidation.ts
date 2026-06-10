import toast from 'react-hot-toast';

import { Category } from './types';

/**
 * Determines whether the provided category name is valid.
 * If not, a toast alert is displayed
 *
 * @param name
 * @returns
 */
export function isValidCategoryName(newCategoryName: string, categories: Category[]) {
  if (newCategoryName.includes('|')) {
    toast.error('Category names cannot contain "|"');
    return false;
  }
  if (newCategoryName.trim().toLowerCase() === 'total') {
    toast.error('"Total" cannot be used as a category name');
    return false;
  }
  if (
    categories.some(
      (c: Category) => newCategoryName.toLowerCase().trim() === c.name.toLowerCase().trim(),
    )
  ) {
    toast.error(`"${newCategoryName}" is already taken`);
    return false;
  }
  return true;
}

import toast from "react-hot-toast";
import { updateQueryParams } from "./UrlUtil";

export type Category = {
    name: string;
    weight: number;
}

 /**
     * Determines whether the provided category name is valid.
     * If not, a toast alert is displayed
     * 
     * @param name 
     * @returns 
     */
 export function isValidCategoryName(newCategoryName: string) {
    if (newCategoryName.includes('|')) {
        toast.error('Category names cannot contain "|"');
        return false;
    }
    if (newCategoryName.trim().toLowerCase() == 'total') {
        toast.error('"Total" cannot be used as a category name');
        return false;
    }
    return true;
}


export function saveCategoriesToUrl(updatedCategories: Category[]) {
    const categoriesParam = updatedCategories.map(
        category => `${category.name}-${category.weight}`
    ).join('|');
    updateQueryParams({ c: categoriesParam });
}

export function parseCategoriesUrlParam(categoriesParam: string) {
    return categoriesParam.split('|').map(category => {
        const lastDashIndex = category.lastIndexOf('-');
        const name = category.slice(0, lastDashIndex);
        const weight = parseInt(category.slice(lastDashIndex + 1), 10);
        return { name, weight };
    });
}
import React, { useEffect, useState } from 'react';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import IconButton from '../../IconButton';
import { AppDispatch, AppState } from '../../../redux/store';
import { deleteCategory, isValidCategoryName, saveCategories } from '../../../utilities/CategoryUtil';
import TooltipHelp from '../../TooltipHelp';
import Checkbox from '../../Checkbox';
import { setShowComparison } from '../../../redux/rootSlice';
import { updateQueryParams } from '../../../utilities/UrlUtil';
import { useAppDispatch, useAppSelector } from '../../../hooks/stateHooks';

const CategoriesTab: React.FC = () => {
  const dispatch: AppDispatch = useAppDispatch();
  const categories = useAppSelector((state: AppState) => state.categories);
  const activeCategory = useAppSelector((state: AppState) => state.activeCategory);
  const [newCategoryName, setNewCategoryName] = useState('');
  const showComparison = useAppSelector((state: AppState) => state.showComparison);


  const addCategory = () => {
    if (newCategoryName.trim() !== '') {
      if (!isValidCategoryName(newCategoryName, categories)) {
        return;
      }
      const updatedCategories = [...categories, { name: newCategoryName, weight: 5 }];
      setNewCategoryName('');
      saveCategories(updatedCategories, dispatch, categories, activeCategory);
    }
  };

  const updateCategoryName = (index: number, name: string) => {
    if (!isValidCategoryName(name, categories)) {
      return;
    }
    let updatedCategories = [...categories];
    updatedCategories[index] = {...categories[index], name: name};
    saveCategories(updatedCategories, dispatch, categories, activeCategory);
  };

  const updateCategoryWeight = (index: number, weight: number) => {
    let updatedCategories = [...categories];
    updatedCategories[index] = {...updatedCategories[index], weight: weight };
    saveCategories(updatedCategories, dispatch, categories, activeCategory);
  };

  /**
   * Handle check even on show category comparison checkbox
   * @param checked 
   */
  const onShowComparisonChange = (checked: boolean) => {
    updateQueryParams({ cm: checked === true ? 't' : 'f' })
    dispatch(
      setShowComparison(checked === true)
    );
  };

  return (
    <div className="mb-0">
      <p className="relative mb-[1em] mt-2 text-sm">
        Create categories to build multiple rankings based on different criteria: e.g. <i>Vocals, Dance, Lyrics</i>{' '}
        etc.
      </p>
      <div className="mt-5 mb-[1.5em]">
        <span className="font-bold ml-0 whitespace-nowrap">Categories</span>
        <div className="mt-4">
          <input
            type="text"
            placeholder="Enter category name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addCategory();
            }}
            className="px-2.5 py-1.5 ml-1 mr-3 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
          />
          <IconButton
            className="ml-1 bg-blue-500 hover:bg-blue-700 text-white font-normal pl-[0.7em] rounded-md text-xs py-[0.5em] pr-[1em]"
            onClick={addCategory}
            icon={undefined}
            title="Add"
          />
          {categories?.length > 0 && (
            <IconButton
              className="ml-3 mt-2 bg-rose-800 hover:bg-rose-700 text-white font-normal pl-[0.7em] rounded-md text-xs py-[0.5em] pr-[1em]"
              onClick={() => {
                saveCategories([], dispatch, categories, activeCategory);
              }}
              disabled={!categories?.length}
              icon={faTrash}
              title="Clear"
            />
          )}
        </div>
        <div className="mt-1">
          <TooltipHelp
            content="When viewing a category ranking, also display the contestant's rank in each other category"
            className="ml-2 pb-1"
          />
          <Checkbox
            id="total-checkbox"
            checked={showComparison}
            onChange={(c) => onShowComparisonChange(c)}
            label="Show Category Comparisons"
          />
        </div>
        <table className="mt-4 w-full table-auto">
          {categories?.length > 0 && (
            <thead>
              <tr className="text-sm">
                <th className="text-left px-2">Name</th>
                <th className="text-left px-2">Weight</th>
                <th className="px-2"></th>
              </tr>
            </thead>
          )}
          <tbody>
            {categories.map((category, index) => (
              <tr key={index}>
                <td className="px-2 py-2">
                  <input
                    type="text"
                    value={category.name}
                    onChange={(e) => updateCategoryName(index, e.target.value)}
                    className="px-2.5 py-1.5 mr-3 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white w-full"
                  />
                </td>
                <td className="px-2">
                  <div className="flex items-center">
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="1"
                      value={category.weight}
                      onChange={(e) => updateCategoryWeight(index, parseInt(e.target.value))}
                      className="w-full"
                    />
                    <span className="ml-2 w-3">{category.weight}</span>
                  </div>
                </td>
                <td className="px-2">
                  <button
                    onClick={() => deleteCategory(index, dispatch, categories, activeCategory)}
                    className="bg-rose-700 hover:bg-rose-600 text-white rounded-md px-2 py-[0.1em]"
                  >
                    X
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CategoriesTab;
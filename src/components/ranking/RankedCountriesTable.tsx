import classNames from 'classnames';
import React, { useEffect, useState } from 'react';

import { useAppSelector } from '../../hooks/stateHooks';
import { AppState } from '../../redux/store';
import { updateUrlFromRankedItems } from '../../utilities/UrlUtil';
import ContestantTable from '../table/ContestantTable';

/**
 * The list of ranked country contestants that appears on the right side column
 * of the select view and as the central column on the details/list view
 *
 * @param
 * @returns
 */
const RankedCountriesTable: React.FC = () => {
  const [refreshUrl, _setRefreshUrl] = useState(0);
  const rankedItems = useAppSelector((state: AppState) => state.root.rankedItems);
  const categories = useAppSelector((state: AppState) => state.root.categories);
  const activeCategory = useAppSelector((state: AppState) => state.root.activeCategory);

  useEffect(() => {
    if (refreshUrl === 0) return;
    updateUrlFromRankedItems(activeCategory, categories, rankedItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshUrl]);

  return (
    <div className="z-20">
      <div className={classNames('grid h-full max-h-full min-h-full grid-rows-[auto_1fr]')}>
        <div className="overflow-y-auto h-full">
          <ContestantTable />
        </div>
      </div>
    </div>
  );
};

export default RankedCountriesTable;

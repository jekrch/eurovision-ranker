import classNames from 'classnames';
import React from 'react';

import ContestantTable from '../table/ContestantTable';

/**
 * The list of ranked country contestants that appears on the right side column
 * of the select view and as the central column on the details/list view.
 * Ranking edits flow into the store and are projected to the URL by the single
 * URL writer.
 *
 * @param
 * @returns
 */
const RankedCountriesTable: React.FC = () => {
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

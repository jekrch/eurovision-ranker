import React, { useState } from 'react';
import { faCopy, faDownload } from '@fortawesome/free-solid-svg-icons';
import Dropdown from '../Dropdown';
import IconButton from '../IconButton';
import { EXPORT_TYPE, getExportType } from '../../utilities/export/ExportType';
import { copyToClipboard, copyUrlToClipboard, downloadFile, getExportDataString } from '../../utilities/export/ExportUtil';
import { useSelector } from 'react-redux';
import { AppState } from '../../redux/types';

const ExportTab: React.FC = () => {
  const [exportTypeSelection, setExportTypeSelection] = useState('Text');
  const exportTypeOptions = Object.values(EXPORT_TYPE).map((exportType) => exportType);
  const rankedItems = useSelector((state: AppState) => state.rankedItems);
  
  /**
   * Downloads rankedItems in the selected format
   */
  async function download() {
    let data = await getExportDataString(exportTypeSelection as EXPORT_TYPE, rankedItems);
    let exportType = getExportType(exportTypeSelection);
    downloadFile(data, exportType?.fileExtension);
  }

  return (
    <div className="mb-0">
      <div className="mb-[1.5em]">
        <IconButton
          className="bg-blue-500 hover:bg-blue-700 text-white font-normal pl-[0.7em] ml-0 rounded-md text-xs py-[0.5em] px-[1em]"
          onClick={copyUrlToClipboard}
          icon={faCopy}
          title="Copy URL to Clipboard"
        />
      </div>

      <Dropdown
        key="type-selector"
        className="z-50 w-20 h-10 mx-auto"
        menuClassName=""
        value={exportTypeSelection}
        onChange={(t) => setExportTypeSelection(t)}
        options={exportTypeOptions}
        showSearch={false}
      />

      <div>
        <IconButton
          className="ml-0 bg-blue-500 hover:bg-blue-700 text-white font-normal pl-[0.7em] rounded-md text-xs py-[0.5em] pr-[1em]"
          onClick={download}
          icon={faDownload}
          title="Download"
        />

        <IconButton
          className="ml-4 bg-blue-500 hover:bg-blue-700 text-white font-normal pl-[0.7em] rounded-md text-xs py-[0.5em] pr-[1em]"
          onClick={() => copyToClipboard(rankedItems, exportTypeSelection as EXPORT_TYPE)}
          icon={faCopy}
          title="Copy to Clipboard"
        />
      </div>
    </div>
  );
};

export default ExportTab;
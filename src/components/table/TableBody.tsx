import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus, faCheck } from '@fortawesome/free-solid-svg-icons';
import Ripples from 'react-ripples';
import { ContestantRow } from './tableTypes';


interface TableBodyProps {
    paginatedContestants: ContestantRow[];
    handleToggleSelected: (id: string) => void;
    showSelected: boolean;
    selectedContestants: ContestantRow[];
}

const TableBody: React.FC<TableBodyProps> = ({
    paginatedContestants,
    handleToggleSelected,
    showSelected,
    selectedContestants
}) => {
    return (
        <tbody className="bg-transparent divide-y divide-gray-700">
            {paginatedContestants.map((contestant) => (
                <tr key={contestant.id} className="hover:bg-slate-800 bg-opacity-50 text-slate-300">
                    <td className="py-0 whitespace-nowrap sticky left-0 z-30 bg-slate-900 hover:bg-[#3068ba]">
                        <div className="flex justify-center h-full">
                            <Ripples className="flex items-center justify-center w-full h-full" placeholder={<></>}>
                                <button
                                    onClick={() => handleToggleSelected(contestant.id)}
                                    className="text-slate-300 hover:text-slate-100 p-2 rounded-md h-full w-full"
                                >
                                    {showSelected ? (
                                        <FontAwesomeIcon icon={faMinus} className="text-red-500" />
                                    ) : selectedContestants.some(c => c.id === contestant.id) ? (
                                        <FontAwesomeIcon icon={faCheck} className="text-green-500" />
                                    ) : (
                                        <FontAwesomeIcon icon={faPlus} />
                                    )}
                                </button>
                            </Ripples>
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap overflow-x-clip">{contestant.year}</td>
                    <td className="px-6 py-4 whitespace-nowrap overflow-x-clip">{contestant.to_country}</td>
                    <td className="px-6 py-4 whitespace-nowrap overflow-x-clip" title={contestant.performer}>{contestant.performer}</td>
                    <td className="px-6 py-4 whitespace-nowrap overflow-x-clip" title={contestant.song}>{contestant.song}</td>
                </tr>
            ))}
        </tbody>
    );
};

export default TableBody;
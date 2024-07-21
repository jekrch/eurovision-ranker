import React, { useEffect, useState } from 'react';
import Modal from '../modals/Modal';
import ContestantTable from './ContestantTable';
// import { setEntries } from '../../redux/tableSlice';
import { EurovisionEntry } from './tableTypes';
import { useAppDispatch } from '../../utilities/hooks';
import { setEntries } from '../../redux/rootSlice';

type TableModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

/**
 * A modal for searching contestant data
 * @param  
 * @returns 
 */
const TableModal: React.FC<TableModalProps> = (props: TableModalProps) => {

    const dispatch = useAppDispatch();

    useEffect(() => {
        // fetch data from your CSV file
        fetch('/contestants.csv')
            .then(response => response.text())
            .then(text => {
                const entries: EurovisionEntry[] = parseCSV(text);
                dispatch(setEntries(entries));
            });
    }, [dispatch]);

    // helper function to parse CSV
    function parseCSV(csv: string): EurovisionEntry[] {
        const lines = csv.split('\n');
        const headers = lines[0].split(',');

        return lines.slice(1).map(line => {
            const values = line.split(',');
            const entry: Partial<EurovisionEntry> = {};

            headers.forEach((header, index) => {
                const value = values[index]?.trim();
                switch (header.trim()) {
                    case 'year':
                        entry.year = parseInt(value, 10);
                        break;
                    case 'to_country_id':
                        entry.to_country_id = value;
                        break;
                    case 'to_country':
                        entry.to_country = value;
                        break;
                    case 'performer':
                        entry.performer = value;
                        break;
                    case 'song':
                        entry.song = value;
                        break;
                    case 'place_contest':
                        entry.place_contest = parseInt(value, 10);
                        break;
                    // add cases for other fields as needed
                }
            });

            return entry as EurovisionEntry;
        }).filter(entry => entry.year && entry.to_country && entry.performer && entry.song);
    }

    return (
        <Modal
            isOpen={props.isOpen}
            onClose={props.onClose}
            className="z-50 select-text gradient-background-modal max-w-6xl w-full h-[90vh] flex flex-col"
        >
            <div className="flex-grow overflow-hidden">
                <ContestantTable />
            </div>
        </Modal>
    );
};

export default TableModal;
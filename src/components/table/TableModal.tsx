import React, { useEffect, useState } from 'react';
import Modal from '../modals/Modal';
import ContestantTable from './ContestantTable';
import { ContestantRow } from './tableTypes';
import { useAppDispatch } from '../../utilities/hooks';
import { setEntries } from '../../redux/rootSlice';
import Papa from 'papaparse';

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
                const entries: ContestantRow[] = parseCSV(text);
                dispatch(setEntries(entries));
            });
    }, [dispatch]);

    // helper function to parse CSV
    function parseCSV(csv: string): ContestantRow[] {
        const parseResult = Papa.parse(csv, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header: string) => header.trim(),
            transform: (value: string) => value.trim()
        });

        return parseResult.data
            .map((row: any) => {
                const entry: Partial<ContestantRow> = {
                    id: row.id,
                    year: parseInt(row.year, 10),
                    to_country_id: row.to_country_id,
                    to_country: row.to_country,
                    performer: row.performer,
                    song: row.song,
                    place_contest: parseInt(row.place_contest, 10)
                };

                return entry as ContestantRow;
            })
            .filter((entry: ContestantRow) =>
                entry.year && entry.to_country && entry.performer && entry.song
            );
    }

    return (
        <Modal
            isOpen={props.isOpen}
            onClose={props.onClose}
            className="z-50 select-text max-w-[95vw] w-full h-[90vh] flex flex-col"
        >
            <div className="flex-grow overflow-hidden">
                <ContestantTable />
            </div>
        </Modal>
    );
};

export default TableModal;
import { CountryContestant } from "../data/CountryContestant";
import { hasAnyJuryVotes, hasAnyTeleVotes } from "./VoteProcessor";

import Papa from 'papaparse';

export function convertToCSV(
    countryContestants: CountryContestant[]
): string {

    const hasJuryVotes = hasAnyJuryVotes(countryContestants);
    const hasTeleVotes = hasAnyTeleVotes(countryContestants);

    const headers = [
        { id: 'rank', title: 'rank' },
        { id: 'countryName', title: 'country name' },
        { id: 'countryKey', title: 'country key' },
        { id: 'artist', title: 'artist' },
        { id: 'song', title: 'song' },
        { id: 'youtube', title: 'youtube' }
    ];

    if (hasJuryVotes) {
        headers.push({ id: 'juryVotes', title: 'jury votes' });
    }

    if (hasTeleVotes) {
        headers.push({ id: 'teleVotes', title: 'tele votes' });
    }

    headers.push({ id: 'totalVotes', title: 'total votes' });

    const data = countryContestants.map((cc, index) => {
        const record: any = {
            rank: index + 1,
            countryName: cc.country.name,
            countryKey: cc.country.key,
            artist: cc.contestant?.artist || '',
            song: cc.contestant?.song || '',
            youtube: cc.contestant?.youtube || '',
        };

        if (hasJuryVotes) {
            record.juryVotes = cc.contestant?.votes?.juryPoints || 0;
        }

        if (hasTeleVotes) {
            record.teleVotes = cc.contestant?.votes?.telePoints || 0;
        }

        record.totalVotes = cc.contestant?.votes?.totalPoints || 0;

        return record;
    });

    return Papa.unparse(data, {
        header: true,
        skipEmptyLines: true
    });
}

export async function convertToJSON(
    countryContestants: CountryContestant[]
): Promise<string> {
    let csv = convertToCSV(countryContestants);
    let jsonArray = await converCsvToJson(csv);
    return JSON.stringify(jsonArray);
}

function converCsvToJson(csvString: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
        Papa.parse(csvString, {
            header: true,
            complete: (result: any) => {
                resolve(result.data as any[]);
            },
            error: (error: any) => {
                reject(error);
            }
        });
    });
}
export function convertDataToText(
    countryContestants: CountryContestant[]
): string {
    const listArray = countryContestants.map((cc, index) => {
        return `${index + 1}. ${cc.country.name}: ${cc?.contestant?.artist} "${cc.contestant?.song}"` 
    });
    return listArray.join('\n');
}

export const downloadFile = (
    string: string, 
    fileExtension: string
) => {

    const blob = new Blob([string], { type: `text/${fileExtension};charset=utf-8;` });
    const url = URL.createObjectURL(blob);

    // create link and trigger the download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `escRanking.${fileExtension}`); 
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // clean up the URL
    URL.revokeObjectURL(url);
};

export const copyDataToClipboard = async (text: string) => {
    try {
        await navigator.clipboard.writeText(text);
    } catch (err) {
        console.error("Failed to copy: ", err);
    }
};

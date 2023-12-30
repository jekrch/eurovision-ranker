export enum EXPORT_TYPE {
    TEXT = 'Text',
    JSON = 'Json',
    CSV = 'Csv',
    EXCEL = 'Excel',
}

export function getExportType(value: string): any {
    const entry: EXPORT_TYPE | undefined = Object.entries(EXPORT_TYPE)
        .find(
            ([key, val]) => val === value
        )?.[1];

    if (entry){
        return EXPORT_TYPES[entry];
    } 
}

export type ExportType = {
    name: EXPORT_TYPE,
    fileExtension: string
};

export const EXPORT_TYPES: { [key in EXPORT_TYPE]: ExportType } = {
    [EXPORT_TYPE.TEXT]: {
        name: EXPORT_TYPE.TEXT,
        fileExtension: 'txt'
    },
    [EXPORT_TYPE.JSON]: {
        name: EXPORT_TYPE.JSON,
        fileExtension: 'json'
    },
    [EXPORT_TYPE.CSV]: {
        name: EXPORT_TYPE.CSV,
        fileExtension: 'csv'
    },
    [EXPORT_TYPE.EXCEL]: {
        name: EXPORT_TYPE.EXCEL,
        fileExtension: 'xls'
    },
};

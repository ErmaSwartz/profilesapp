import Papa from 'papaparse';

export function parseCSV(csvContent) {
    const parsed = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
    });

    if (parsed.errors.length > 0) {
        console.error("Errors while parsing CSV:", parsed.errors);
    }

    console.log("Parsed Data:", parsed.data); // Log the parsed data to see what is returned
    return parsed.data;
}
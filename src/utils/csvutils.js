export function parseCSV(csvContent) {
    // Split the CSV content into lines and filter out any empty lines.
    const lines = csvContent.split(/\r?\n/).filter(line => line.trim() !== "");
    
    if (lines.length === 0) {
        console.error("The file is empty or incorrectly formatted.");
        return [];
    }

    // Extract the headers (column names) from the first line of the CSV.
    const headers = lines[0].split(",").map(header => header.trim());

    // Map over the remaining lines (data rows), split each line by commas to get individual values,
    // and then create an object for each row using the headers as keys.
    return lines.slice(1).map((line, lineNumber) => {
        // Regex to correctly split values even if they are enclosed in quotes or contain commas.
        const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g).map(value => value.replace(/^"|"$/g, '').trim());

        // Ensure that the number of values matches the number of headers.
        if (values.length !== headers.length) {
            console.warn(`Row length doesn't match header length at line ${lineNumber + 2}. Skipping row:`, line);
            return null;  // Or handle the discrepancy as needed.
        }

        // Create an object for each row using the headers as keys.
        return headers.reduce((acc, header, index) => {
            acc[header] = values[index] || "";
            return acc;
        }, {});
    }).filter(row => row !== null);  // Filter out any null rows.
}
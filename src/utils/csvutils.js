// src/utils/csvUtils.js

/**
 * Parses a CSV string into an array of objects.
 * @param {string} csvContent - The CSV content as a string.
 * @returns {Array<Object>} - Parsed CSV data as an array of objects.
 */
export function parseCSV(csvContent) {
    const lines = csvContent.split("\n").filter(line => line.trim() !== "");
    const headers = lines[0].split(",").map(header => header.trim());
  
    return lines.slice(1).map(line => {
      const values = line.split(",").map(value => value.trim());
      return headers.reduce((acc, header, index) => {
        acc[header] = values[index];
        return acc;
      }, {});
    });
  }
  
  /**
   * Joins two arrays of objects based on the `VANID` field.
   * @param {Array<Object>} file1Data - The first dataset (array of objects).
   * @param {Array<Object>} file2Data - The second dataset (array of objects).
   * @returns {Array<Object>} - The joined and cleaned dataset.
   */
  export function joinDataOnVANID(file1Data, file2Data) {
    const joinedData = file1Data.map(row1 => {
      const match = file2Data.find(row2 => row2.VANID === row1.VANID);
      return match ? { ...row1, ...match } : row1;
    });
  
    // Optional: Clean the joined data if needed
    return joinedData.filter(row => row.VANID); // Assuming `VANID` must be present
  }
/**
 * Parses a CSV string into an array of objects.
 * @param {string} csvContent - The CSV content as a string.
 * @returns {Array<Object>} - Parsed CSV data as an array of objects.
 */
export function parseCSV(csvContent) {
    // Split the CSV content into lines and filter out any empty lines.
    const lines = csvContent.split("\n").filter(line => line.trim() !== "");
    
    // Extract the headers (column names) from the first line of the CSV.
    const headers = lines[0].split(",").map(header => header.trim());
  
    // Map over the remaining lines (data rows), split each line by commas to get individual values,
    // and then create an object for each row using the headers as keys.
    return lines.slice(1).map(line => {
      const values = line.split(",").map(value => value.trim()); // Split the line into values and trim whitespace.
      
      // Use reduce to create an object where each key is a header and each value is the corresponding data.
      return headers.reduce((acc, header, index) => {
        acc[header] = values[index]; // Assign the value to the corresponding header key.
        return acc; // Return the accumulated object.
      }, {}); // Start with an empty object.
    });
}
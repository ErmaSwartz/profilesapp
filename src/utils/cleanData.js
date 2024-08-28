import { parse } from "date-fns"; // For parsing dates

export function cleanData(data) {
  // 1. Handle missing values
  data.forEach((item) => {
    Object.keys(item).forEach((key) => {
      if (typeof item[key] === "number" && item[key] == null) {
        // Replace with mean of the column
        item[key] = calculateColumnMean(data, key);
      } else if (typeof item[key] === "string" && !item[key]) {
        // Replace with 'Unknown'
        item[key] = "Unknown";
      }
    });
  });

  // 2. Standardize data types
  data.forEach((item) => {
    Object.keys(item).forEach((key) => {
      if (typeof item[key] === "string") {
        // Convert to lowercase
        item[key] = item[key].toLowerCase();
      }
    });
  });

  // 3. Correct inconsistent formatting
  data.forEach((item) => {
    if (item["Date Created"]) {
      item["Date Created"] = parseDate(item["Date Created"]);
    }
    if (item["Date"]) {
      item["Date"] = parseDate(item["Date"]);
    }
    if (item["Donor ZIP"]) {
      // Truncate ZIP codes to the first 5 digits
      item["Donor ZIP"] = item["Donor ZIP"].toString().substring(0, 5);
    }
    if (item["Email"]) {
      // Remove spaces and convert to lowercase
      item["Email"] = item["Email"].replace(/\s+/g, "").toLowerCase();
    }
    if (item["Donor Email"]) {
      // Remove spaces and convert to lowercase
      item["Donor Email"] = item["Donor Email"].replace(/\s+/g, "").toLowerCase();
    }
  });

  return data;
}

// Helper function to calculate the mean of a column
function calculateColumnMean(data, key) {
  const values = data.map((item) => item[key]).filter((val) => val != null);
  const sum = values.reduce((acc, val) => acc + val, 0);
  return values.length ? sum / values.length : 0;
}

// Helper function to parse dates
function parseDate(dateStr) {
  const parsedDate = parse(dateStr, "yyyy-MM-dd", new Date());
  return parsedDate;
}
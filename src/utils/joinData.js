/**
 * Function to join two datasets based on the 'VANID' column.
 * @param {Array} Email_ngp_df - The first dataset (array of objects)
 * @param {Array} activist_code_df - The second dataset (array of objects)
 * @returns {Array} - The joined dataset
 */
export function joinData(Email_ngp_df, activist_code_df) {
    // Check if both datasets are empty
    if (Email_ngp_df.length === 0 && activist_code_df.length === 0) {
        console.warn("Both datasets are empty. Returning an empty array.");
        return [];
    }
    // Check if either dataset is empty
    if (Email_ngp_df.length === 0) {
        console.warn("Email_ngp_df is empty. Returning an empty array.");
        return [];
    }
    if (activist_code_df.length === 0) {
        console.warn("activist_code_df is empty. Returning an empty array.");
        return [];
    }

    // Merge the two datasets based on the 'VANID' column
    const joinedData = mergeDataFrames(Email_ngp_df, activist_code_df, "VANID");

    // Log the result of the joined data for debugging
    console.log("Joined Data:", joinedData);

    // Return the joined data to be used in the state or further processing.
    return joinedData;
}

/**
 * Function to merge two datasets based on a common column
 * @param {Array} df1 - The first dataset (array of objects)
 * @param {Array} df2 - The second dataset (array of objects)
 * @param {String} key - The common column to merge on
 * @returns {Array} - The merged dataset
 */
function mergeDataFrames(df1, df2, key) {
    const merged = [];

    // Convert the second dataset into a map for fast lookup
    const df2Map = df2.reduce((map, row) => {
        map[row[key]] = row;
        return map;
    }, {});

    // Log the map to check keys
    console.log("DF2 Map:", df2Map);

    // Loop through the first dataset and merge with the corresponding row in the second dataset
    df1.forEach(row1 => {
        const match = df2Map[row1[key]];
        if (match) {
            // If a match is found, merge the objects
            merged.push({ ...row1, ...match });
        } else {
            // If no match is found, just add the row from the first dataset
            merged.push({ ...row1 });
        }
    });

    // Handle any remaining rows in the second dataset that don't have a match in the first
    df2.forEach(row2 => {
        if (!df1.find(row1 => row1[key] === row2[key])) {
            merged.push({ ...row2 });
        }
    });

    // Log the final merged dataset for debugging
    console.log("Final Merged Data:", merged);

    return merged;
}
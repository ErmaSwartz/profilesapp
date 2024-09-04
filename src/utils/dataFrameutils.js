// src/utils/dataFrameUtils.js

import * as dfd from "danfojs-node";

export function createDataFrame(data) {
    // Convert the data (an array of objects) to a DataFrame
    return new dfd.DataFrame(data);
}

export function displayDataFrame(df) {
    // Print the DataFrame to console for debugging
    df.print();
}
import { useState, useEffect } from "react";
import { Button, Heading, Flex, Divider, Text, View, ToggleButton } from "@aws-amplify/ui-react";
import { useAuthenticator } from "@aws-amplify/ui-react"; 
import { Amplify } from "aws-amplify"; 
import "@aws-amplify/ui-react/styles.css";
import { generateClient } from "aws-amplify/data"; 
import outputs from "./aws-exports.js"; // AWS configuration file
import { parseCSV } from "./utils/csvutils"; // Utility function to parse CSV files
import { cleanData } from "./utils/cleanData"; // Utility function to clean data
import { joinData } from "./utils/joinData"; // Utility function to join data
import Papa from 'papaparse'; // CSV parser library
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'; // Charting library
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'; // Leaflet for mapping
import 'leaflet/dist/leaflet.css'; // Leaflet styles
import moment from 'moment';


// Configure Amplify with AWS outputs
Amplify.configure(outputs);

// Set up an authenticated client for making requests
const client = generateClient({
  authMode: "userPool", // Specify the authentication mode as userPool
});

// Example mapping from zip code to coordinates for the map visualization
const zipCodeToLatLng = {
  "94103": { latitude: 37.7749, longitude: -122.4194 },
  "10001": { latitude: 40.7128, longitude: -74.0060 },
  "30301": { latitude: 33.7490, longitude: -84.3880 }
};

// Function to calculate the median of an array
function median(arr) {
  const sorted = [...arr].sort((a, b) => a - b); // Sort array numerically
  const middle = Math.floor(sorted.length / 2); // Find middle index
  return sorted.length % 2 !== 0 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2; // Return median value
}

// Converts a column in the dataset to a Date object
function convertToDateTime(data, columnName) {
  return data.map((row) => ({
    ...row, // Spread other row data
    [columnName]: new Date(row[columnName]), // Convert the specified column to Date type
  }));
}

// Main App Component
export default function App() {
  // State declarations
  const [userprofiles, setUserProfiles] = useState([]); // For storing user profiles fetched from the client
  const [file1Data, setFile1Data] = useState(null); // Stores the first uploaded file data
  const [file2Data, setFile2Data] = useState(null); // Stores the second uploaded file data
  const [file3Data, setFile3Data] = useState(null); // Stores the third uploaded file data (donations)
  const [filesUploaded, setFilesUploaded] = useState(false); // Flags if the files are uploaded
  const [dataCleaned, setDataCleaned] = useState(false); // Flags if the data has been cleaned
  const [joinedData, setJoinedData] = useState([]); // Stores the joined dataset
  const [finalData, setFinalData] = useState(null); // Stores the final cleaned and joined data
  const [donationResults, setDonationResults] = useState([]); // Stores the analysis results of donations
  const [donationFileUploaded, setDonationFileUploaded] = useState(false); // Flags if the donation file is uploaded
  const { signOut } = useAuthenticator((context) => [context.user]); // Auth hook for signout
  const [totalDonations, setTotalDonations] = useState(0); // Stores the total donations amount
  const [totalNumberOfDonations, setTotalNumberOfDonations] = useState(0); // Stores total number of donations
  const [averageTimeToFirstDonation, setAverageTimeToFirstDonation] = useState(0); // Average time to first donation
  const [averageDonation, setAverageDonation] = useState(0); // Average donation amount
  const [medianDonation, setMedianDonation] = useState(0); // Median donation amount
  const [medianTimeToFirstDonation, setMedianTimeToFirstDonation] = useState(0); // Median time to first donation
  const [zipCodeData, setZipCodeData] = useState([]); // Data for mapping donations by zip code
  const [acquisitionPrice, setAcquisitionPrice] = useState(0); // Stores acquisition price for ROI calculation
  const [roiTime, setRoiTime] = useState(undefined); // Stores time taken to reach ROI
  const [roiPercentage, setRoiPercentage] = useState(undefined); // ROI percentage
  const [refcodes, setRefcodes] = useState([]); // Stores unique refcodes from the joined data
  const [dateRange, setDateRange] = useState({ earliest: null, latest: null }); // Earliest and latest dates for date range
  const [tableExpanded, setTableExpanded] = useState(false); // Flag to expand/collapse the table
  const [dashboardVisible, setDashboardVisible] = useState(false); // Flag to show/hide the dashboard
  const [barchartData, setBarChartData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [percentToBreakEven, setPercentToBreakEven] = useState(undefined);

  // Fetch user profiles on component mount
  useEffect(() => {
    fetchUserProfile();
  }, []); // Empty dependency array means this effect runs once after the initial render

  // Function to fetch user profiles from AWS Amplify
  async function fetchUserProfile() {
    try {
      const { data: profiles } = await client.models.UserProfile.list(); // Fetch user profiles from AWS
      console.log("Fetched profiles:", profiles);
      setUserProfiles(profiles); // Set the fetched profiles into state
    } catch (error) {
      console.error("Error fetching user profiles:", error); // Add error handling
    }
  }

  function handleFileChange(event, setFileData, fileIndex) {
    const file = event.target.files[0]; 
    if (!file) return;

    const reader = new FileReader(); 
    reader.onload = (e) => {
        const fileContent = e.target.result; 
        const data = parseCSV(fileContent);
        console.log(`File ${fileIndex} uploaded data:`, data); // Log parsed file data
        setFileData(data); // Set parsed data into state
    };
    reader.readAsText(file);
}

function handleCleanData() {
    if (file1Data && file2Data) {
        const cleanedFile1 = file1Data.map(row => {
            if (row["Date Created"]) {
                const date = new Date(row["Date Created"]);
                const formattedDate = date.toLocaleDateString("en-GB");
                return { ...row, "Date Created": formattedDate };
            }
            return row;
        });
        const cleanedFile2 = file2Data.map(row => {
            if (row["Date Created"]) {
                const date = new Date(row["Date Created"]);
                const formattedDate = date.toLocaleDateString("en-GB");
                return { ...row, "Date Created": formattedDate };
            }
            return row;
        });
        
        console.log("Cleaned File 1:", cleanedFile1); // Log cleaned file1 data
        console.log("Cleaned File 2:", cleanedFile2); // Log cleaned file2 data

        setFile1Data(cleanedFile1); 
        setFile2Data(cleanedFile2); 
        setDataCleaned(true); 
    }
}

function handleJoinData() {
  if (file1Data && file2Data && dataCleaned) {
      let joined = joinData(file1Data, file2Data);
      console.log("Joined Data (before cleaning date columns):", joined); // Log before handling dates

      // Ensure only one "Date Created" column is kept
      joined = joined.map(row => {
          if (row["Date Created"] && row["Date Added"]) {
              return {
                  ...row,
                  "Date": row["Date Created"], // Keep "Date Created" and store it as "Date"
              };
          }
          return row;
      });

      console.log("Joined Data (after cleaning):", joined); // Log after handling dates
      
      setJoinedData(joined);
  }
}

function handleDonationFileChange(event) {
  const file = event.target.files[0]; 
  if (!file) return;

  Papa.parse(file, {
      header: true, 
      complete: (result) => {
          const cleanedData = result.data.map(row => {
              if (row["Date"]) {
                  const date = new Date(row["Date"]);
                  const formattedDate = date.toLocaleDateString("en-GB");
                  return { ...row, "Date": formattedDate };
              }
              return row;
          });
          
          console.log("Cleaned Donation File Data:", cleanedData); // Log cleaned donation data

          setFile3Data(cleanedData); 
          
          const filteredData = cleanedData.filter(donationRow => {
              return joinedData.some(joinedRow => joinedRow.Email === donationRow["Donor Email"]);
          });

          const joinedWithDonations = joinedData.map(joinedRow => {
              const matchingDonation = filteredData.find(donationRow => donationRow["Donor Email"] === joinedRow.Email);
              if (matchingDonation) {
                  return { ...joinedRow, ...matchingDonation };
              }
              return null;
          }).filter(row => row !== null);

          console.log("Joined Data with Donations:", joinedWithDonations); // Log after joining donations
          
          setJoinedData(joinedWithDonations);
      }
  });

  setDonationFileUploaded(true);
}

function removeDuplicates(arr) {
  const seen = new Set(); 
  return arr.reduce((accumulator, current) => {
    const vanId = current.VANID; 
    if (!seen.has(vanId)) {
      seen.add(vanId);
      accumulator.push(current);
    }
    return accumulator;
  }, []);
}

  // Analyzes the donations, calculates totals, and sets data for visualizations and results
  function analyzeDonations() {
    if (!file3Data || !joinedData.length) return; 

    console.log("Starting donation analysis with joinedData:", joinedData); // Log before analysis

    let analyzedData = joinedData.map(row => {
        let dateCreated = moment(row["Date Created"], "DD/MM/YYYY").toDate(); 
        let donationDate = moment(row["Date"], "DD/MM/YYYY").toDate();

        let timeDifference = Math.floor(Math.abs(donationDate - dateCreated) / (1000 * 60 * 60 * 24) );
        
        let donationsByEmail = file3Data.filter(donationRow => donationRow["Donor Email"] === row.Email);
        let totalTimesDonated = donationsByEmail.length;
        let totalDonatedAmount = donationsByEmail.reduce((sum, donationRow) => sum + parseFloat(donationRow.Amount || 0), 0);

        return {
            ...row,
            "FirstName": row["FirstName"], 
            "Times Donated": totalTimesDonated, 
            "Total Donated": totalDonatedAmount, 
            "Time Between Creation and Donation (days)": timeDifference 
        };
    }).filter(row => row["Total Donated"]); // Filter out rows with invalid dates

    console.log("Analyzed Donation Data:", analyzedData); // Log after analysis
    setDonationResults(analyzedData);
    
    const uniqueData = removeDuplicates(analyzedData);
    const chartData = uniqueData.map(row => ({
      FirstName : (row["Donor First Name"] ?? "" + row["Donor Last Name"] ?? ""),
      TotalAmountDonated : row["Total Donated"]
    }));
    
    console.log("Chart Data", chartData)

    setBarChartData(chartData);
    setTableData(uniqueData);

    // [{FirstName: "jeff", TotalAmountDonated: 10}, {FirstName: "notjeff", TotalAmountDonated: 15}]

    let totalAmountDonated = analyzedData.reduce((sum, row) => sum + row["Total Donated"], 0);
    let totalDonationsCount = analyzedData.reduce((sum, row) => sum + row["Times Donated"], 0);
    let totalDaysToFirstDonation = analyzedData.reduce((sum, row) => sum + row["Time Between Creation and Donation (days)"], 0);
    let totalUsersWithDonations = analyzedData.length;

    console.log("Total Amount Donated:", totalAmountDonated); // Log totals
    console.log("Total Number of Donations:", totalDonationsCount); 

    console.log("Average Time to First Donation:", totalDaysToFirstDonation / totalUsersWithDonations);

    setTotalDonations(totalAmountDonated); 
    setTotalNumberOfDonations(totalDonationsCount);
    setAverageTimeToFirstDonation(totalDaysToFirstDonation / totalUsersWithDonations);
    setAverageDonation(totalAmountDonated / totalUsersWithDonations);
    setMedianDonation(median(analyzedData.map(row => row["Total Donated"]))); 
    setMedianTimeToFirstDonation(median(analyzedData.map(row => row["Time Between Creation and Donation (days)"])));
}

function filterOutAndPull(arr, currentDay) {
  const itemsToRemove = arr.filter(row => row["Time Between Creation and Donation (days)"] == currentDay); // Get items to remove
  itemsToRemove.forEach(item => {
    const index = arr.indexOf(item);
    if (index > -1) {
      arr.splice(index, 1); // Remove the item from the original array
    }
  });
  return itemsToRemove; // Return the removed items
}

  // Function to calculate ROI (Return on Investment)
  function calculateROI() {
   let data = JSON.parse(JSON.stringify(donationResults));
   data = removeDuplicates(data)

   let currentDay = 0
   let currentDonations = 0
   let dayRoiReached = undefined
   while(data.length){
    let donationsOnCurrentDay = filterOutAndPull(data, currentDay);

    donationsOnCurrentDay.forEach((donation) =>{
      currentDonations += parseFloat(donation["Amount"])
    })
    console.log("Day: " + currentDay + " amount donated: " + currentDonations)

    if(!dayRoiReached && currentDonations >= acquisitionPrice){
      dayRoiReached = currentDay
    }
    currentDay += 1
   }


   const percentageReturn = currentDonations/acquisitionPrice

   if(dayRoiReached){
    setRoiPercentage(percentageReturn*100)
    setPercentToBreakEven(undefined)
   }else{
    setRoiPercentage(undefined)
    setPercentToBreakEven(percentageReturn * 100)
   }
   setRoiTime(dayRoiReached)

   console.log(currentDonations)
   console.log(acquisitionPrice)
   console.log(percentageReturn)
   console.log(dayRoiReached)
  }

  // Rendering the UI components for the app
  return (
    <Flex className="App" justifyContent="center" alignItems="center" direction="column" width="80%" margin="0 auto" padding="2rem">
      <Heading level={1}>Mandate Media Acquisition App</Heading>

      {!dashboardVisible && (
        <>
          <Text fontSize="large" color="black">Upload NGP Files Here</Text>
          <Divider margin="1rem 0" />

          <Flex direction="row" justifyContent="space-around" width="100%">
            <input type="file" accept=".csv" onChange={(e) => handleFileChange(e, setFile1Data, 1)} />
            <input type="file" accept=".csv" onChange={(e) => handleFileChange(e, setFile2Data, 2)} />
          </Flex>
          {filesUploaded && <Text color="black">Files Uploaded</Text>}

          <Button onClick={handleCleanData} disabled={!file1Data || !file2Data}>Clean Data</Button>
          {dataCleaned && <Text color="black">Data Cleaned</Text>}
          <Button onClick={handleJoinData} disabled={!dataCleaned}>Join Data</Button>

          <Divider margin="2rem 0" />

          <Text fontSize="large" color="black">Upload ActBlue Data</Text>
          <input type="file" accept=".csv" onChange={handleDonationFileChange} />
          {donationFileUploaded && <Button onClick={analyzeDonations}>Analyze Donations</Button>}

          <Divider margin="2rem 0" />

          {barchartData.length > 0 && (
            <>
              <Text fontSize="large" color="black">Total Donations per User</Text>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barchartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="TotalAmountDonated" fill="#8884d8" name="Cumulative Donation Per Donor" />
                </BarChart>
              </ResponsiveContainer>
              <Text fontSize="small" color="black">
                Average Donation: ${averageDonation.toFixed(2)} | Median Donation: ${medianDonation.toFixed(2)}
              </Text>

              <Divider margin="2rem 0" />
            </>
          )}

          <ToggleButton
            onClick={() => setTableExpanded(!tableExpanded)}
            isPressed={tableExpanded}
            ariaLabel="Toggle Donations Table"
          >
            {tableExpanded ? "Hide Donation Details" : "Show Donation Details"}
          </ToggleButton>

          {tableExpanded && tableData.length > 0 && (
            <View>
              {/* Collapsible Table for Donations */}
              <h3>Donation Analysis Results</h3>
              <table>
                <thead>
                  <tr>
                    <th style={{padding: "10px", border: "1px", align: "center"}} >First Name</th>
                    <th style={{padding: "10px", border: "1px", align: "center"}}>Date Added</th>
                    <th style={{padding: "10px", border: "1px", align: "center"}}>Total Amount Donated</th>
                    <th style={{padding: "10px", border: "1px", align: "center"}}>Times Donated</th>
                    <th style={{padding: "10px", border: "1px", align: "center"}}>Time to First Donation</th>
                  </tr>
                </thead>
                <tbody>
                {tableData.map((row, index) => (
                  <tr key={index}>
                    <td style={{padding: "10px", border: "1px", align: "center"}} >{row['Donor First Name'] + " " + row["Donor Last Name"]}</td>
                    {/* Format the date using toLocaleDateString */}
                    <td style={{padding: "10px", border: "1px", align: "center"}} >{row['Date Created'] ? moment(row["Date Created"], "DD/MM/YYYY").format("MM/DD/YYYY") : "N/A"}</td>
                    <td style={{padding: "10px", border: "1px", align: "center"}} >${row['Total Donated'].toFixed(2)}</td>
                    <td style={{padding: "10px", border: "1px", align: "center"}} >{row['Times Donated']}</td>
                    <td style={{padding: "10px", border: "1px", align: "center"}} >{row['Time Between Creation and Donation (days)']} days</td>
                  </tr>
                ))}
              </tbody>
              </table>
            </View>
          )}

          <Divider margin="2rem 0" />

          {/* ROI Section */}
          <input
            type="number"
            placeholder="Enter Acquisition Price"
            value={acquisitionPrice}
            onChange={(e) => setAcquisitionPrice(parseFloat(e.target.value))}
          />
          <Button onClick={calculateROI}>Calculate ROI</Button>

          <View> 
            {roiPercentage && <Text>Current ROI: {roiPercentage.toFixed(2)}%</Text>}
            {percentToBreakEven && <Text>Current Percentage Recovered: {percentToBreakEven}%</Text>}
            {roiTime && (
              <Text>
                Reached ROI on day {roiTime instanceof Date ? roiTime.toDateString() : roiTime}
              </Text>
            )}
          </View>
          
          <Divider margin="2rem 0" />

          <Button onClick={() => setDashboardVisible(true)}>Create Dashboard</Button>
        </>
      )}

      {dashboardVisible && (
        <View style={{ marginTop: "2rem", width: "100%" }}>
          <Heading level={2}>Dashboard</Heading>

          {/* Summary section */}
          <View>
            <Text>Total Amount Donated: ${totalDonations.toFixed(2)}</Text>
            <Text>Total Number of Donations: {totalNumberOfDonations}</Text>
            <Text>Average Donation: ${averageDonation.toFixed(2)}</Text>
            <Text>Median Donation: ${medianDonation.toFixed(2)}</Text>
            <Text>Current ROI: {roiPercentage.toFixed(2)}%</Text>
            {roiTime && (
              <Text>Reached ROI on: {roiTime instanceof Date ? roiTime.toDateString() : roiTime}</Text>
            )}
            <Text>Refcodes: {refcodes.join(", ")}</Text>
            <Text>Date Range: {new Date(dateRange.earliest).toLocaleDateString()} - {new Date(dateRange.latest).toLocaleDateString()}</Text>
          </View>

          <Divider margin="2rem 0" />

          {/* Bar Chart for Total Donations */}
          <Text fontSize="large" color="black">Total Donations per User</Text>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={donationResults}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="FirstName" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Total Amount Donated" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>

          <Divider margin="2rem 0" />

          {/* Line Chart for Time Between Addition and First Donation */}
          <Text fontSize="large" color="black">Time Between Addition and First Donation</Text>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={donationResults}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="FirstName" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Time Between Addition and First Donation (days)" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>

          <Divider margin="2rem 0" />

          {/* Render Map with Zip Code Data */}
          <MapContainer center={[37.7749, -122.4194]} zoom={5} style={{ height: '400px', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {zipCodeData.map((entry, index) => {
              const coords = zipCodeToLatLng[entry.zipCode];
              if (coords) {
                return (
                  <Marker key={index} position={[coords.latitude, coords.longitude]}>
                    <Popup>
                      <Text>
                        {entry.zipCode}: ${entry.totalAmount.toFixed(2)} donated over {entry.numberOfDonations} donations.
                      </Text>
                    </Popup>
                  </Marker>
                );
              } else {
                console.error(`Missing coordinates for zip code: ${entry.zipCode}`);
              }
              return null;
            })}
          </MapContainer>
        </View>
      )}
    </Flex>
  );
}
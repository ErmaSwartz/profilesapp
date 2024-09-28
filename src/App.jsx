import { useState, useEffect } from "react";
import { Button, Heading, Flex, Divider, Text, View, ToggleButton } from "@aws-amplify/ui-react";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { Amplify } from "aws-amplify";
import "@aws-amplify/ui-react/styles.css";
import { generateClient } from "aws-amplify/data";
import outputs from "../amplify_outputs.json";
import { parseCSV } from "./utils/csvutils";
import { cleanData } from "./utils/cleanData";
import { joinData } from "./utils/joinData";
import Papa from 'papaparse';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

Amplify.configure(outputs);

const client = generateClient({
  authMode: "userPool",
});

const zipCodeToLatLng = {
  "94103": { latitude: 37.7749, longitude: -122.4194 },
  "10001": { latitude: 40.7128, longitude: -74.0060 },
  "30301": { latitude: 33.7490, longitude: -84.3880 }
};

function median(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export default function App() {
  const [userprofiles, setUserProfiles] = useState([]);
  const [file1Data, setFile1Data] = useState(null);
  const [file2Data, setFile2Data] = useState(null);
  const [file3Data, setFile3Data] = useState(null);
  const [filesUploaded, setFilesUploaded] = useState(false);
  const [dataCleaned, setDataCleaned] = useState(false);
  const [joinedData, setJoinedData] = useState([]);
  const [finalData, setFinalData] = useState(null);
  const [donationResults, setDonationResults] = useState([]);
  const [donationFileUploaded, setDonationFileUploaded] = useState(false);
  const { signOut } = useAuthenticator((context) => [context.user]);
  const [totalDonations, setTotalDonations] = useState(0);
  const [totalNumberOfDonations, setTotalNumberOfDonations] = useState(0);
  const [averageTimeToFirstDonation, setAverageTimeToFirstDonation] = useState(0);
  const [averageDonation, setAverageDonation] = useState(0);
  const [medianDonation, setMedianDonation] = useState(0);
  const [medianTimeToFirstDonation, setMedianTimeToFirstDonation] = useState(0);
  const [zipCodeData, setZipCodeData] = useState([]);
  const [acquisitionPrice, setAcquisitionPrice] = useState(0);
  const [roiTime, setRoiTime] = useState(null);
  const [roiPercentage, setRoiPercentage] = useState(0);
  const [refcodes, setRefcodes] = useState([]);
  const [dateRange, setDateRange] = useState({ earliest: null, latest: null });
  const [tableExpanded, setTableExpanded] = useState(false); // For collapsible table
  const [dashboardVisible, setDashboardVisible] = useState(false); // For dashboard toggle

  useEffect(() => {
    fetchUserProfile();
  }, []);

  async function fetchUserProfile() {
    const { data: profiles } = await client.models.UserProfile.list();
    setUserProfiles(profiles);
  }

  function handleFileChange(event, setFileData, fileIndex) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const fileContent = e.target.result;
      const data = parseCSV(fileContent);
      setFileData(data);
    };
    reader.readAsText(file);
  }

  useEffect(() => {
    if (file1Data && file2Data) setFilesUploaded(true);
  }, [file1Data, file2Data]);

  function handleCleanData() {
    if (file1Data && file2Data) {
      const cleanedFile1 = cleanData(file1Data);
      const cleanedFile2 = cleanData(file2Data);
      setFile1Data(cleanedFile1);
      setFile2Data(cleanedFile2);
      setDataCleaned(true);
    }
  }

  function handleJoinData() {
    if (file1Data && file2Data && dataCleaned) {
      const joined = joinData(file1Data, file2Data);
      setJoinedData(joined);
  
      // Collect unique refcodes from the joined dataset
      const joinedRefcodes = new Set(joined.map(row => row["Refcode"])); // Adjust "Refcode" key based on your dataset's field
      setRefcodes([...joinedRefcodes]);
  
      setFinalData({ cleanedFile1: file1Data, cleanedFile2: file2Data, joinedData: joined });
    }
  }

  function handleDonationFileChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    Papa.parse(file, { header: true, complete: (result) => setFile3Data(result.data) });
    setDonationFileUploaded(true);
  }

  function analyzeDonations() {
    if (!file3Data || !joinedData.length) return;

    let totalAmountDonated = 0;
    let totalDonationsCount = 0;
    let totalDaysToFirstDonation = 0;
    let totalUsersWithDonations = 0;
    const donationAmounts = [];
    const timeToFirstDonationList = [];
    const zipCodes = [];
    const emailMap = new Map();
    let earliestDate = new Date();
    let latestDate = new Date(0);
    let refcodeSet = new Set();

    joinedData.forEach((row) => {
      const joinedEmail = row["Email"];
      const matchingDonations = file3Data.filter(donation => donation["Donor Email"] === joinedEmail);
      if (matchingDonations.length > 0) {
        const totalAmount = matchingDonations.reduce((sum, donation) => sum + parseFloat(donation.Amount || 0), 0);
        const timeDiff = Math.floor((new Date(matchingDonations[0].Date) - new Date(row["DateCreated"])) / (1000 * 60 * 60 * 24));

        donationAmounts.push(totalAmount);
        timeToFirstDonationList.push(timeDiff);
        totalAmountDonated += totalAmount;
        totalDonationsCount += matchingDonations.length;
        totalDaysToFirstDonation += timeDiff;
        totalUsersWithDonations++;

        if (row["ZipCode"]) zipCodes.push({ zipCode: row["ZipCode"], totalAmount, numberOfDonations: matchingDonations.length });
        const refcode = matchingDonations[0]["Refcode"];
        if (refcode) refcodeSet.add(refcode);
        const donationDate = new Date(matchingDonations[0].Date);
        if (donationDate < earliestDate) earliestDate = donationDate;
        if (donationDate > latestDate) latestDate = donationDate;

        if (!emailMap.has(joinedEmail)) {
          emailMap.set(joinedEmail, {
            'FirstName': row["FirstName"],
            'Date Added': row["DateCreated"],
            'Total Amount Donated': totalAmount,
            'Times Donated': matchingDonations.length,
            'Time Between Addition and First Donation (days)': timeDiff
          });
        }
      }
    });

    setTotalDonations(totalAmountDonated);
    setTotalNumberOfDonations(totalDonationsCount);
    setAverageTimeToFirstDonation(totalDaysToFirstDonation / totalUsersWithDonations);
    setAverageDonation(totalAmountDonated / totalUsersWithDonations);
    setMedianDonation(median(donationAmounts));
    setMedianTimeToFirstDonation(median(timeToFirstDonationList));
    setZipCodeData(zipCodes);
    setRefcodes([...refcodeSet]);
    setDateRange({ earliest: earliestDate, latest: latestDate });
    const results = Array.from(emailMap.values());
    setDonationResults(results);
  }

  function calculateROI() {
    if (isNaN(acquisitionPrice) || acquisitionPrice <= 0) {
      console.error("Invalid acquisition price");
      return;
    }

    if (!isNaN(totalDonations) && totalDonations > 0) {
      const startDate = new Date(joinedData[0]["DateCreated"]);
      let cumulativeDonations = 0;
      let roiReachedDate = null;

      for (let i = 0; i < file3Data.length; i++) {
        const donation = file3Data[i];
        const donationAmount = parseFloat(donation.Amount || 0);
        const donationDate = new Date(donation["Date"]);

        if (donationDate >= startDate) {
          cumulativeDonations += donationAmount;

          if (cumulativeDonations >= acquisitionPrice) {
            roiReachedDate = donationDate;
            break;
          }
        }
      }

      if (roiReachedDate) {
        const timeToROI = Math.floor((roiReachedDate - startDate) / (1000 * 60 * 60 * 24));
        setRoiTime(`${timeToROI} days`);
      } else {
        setRoiTime("ROI not reached");
      }

      const roiPercentage = (totalDonations / acquisitionPrice) * 100;
      setRoiPercentage(roiPercentage);
    } else {
      console.error("Invalid total donations amount");
    }
  }

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

          {/* Charts */}
          {donationResults.length > 0 && (
            <>
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
              <Text fontSize="small" color="black">
                Average Donation: ${averageDonation.toFixed(2)} | Median Donation: ${medianDonation.toFixed(2)}
              </Text>

              <Divider margin="2rem 0" />

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
              <Text fontSize="small" color="black">
                Average Time to First Donation: {averageTimeToFirstDonation.toFixed(2)} days | Median Time: {medianTimeToFirstDonation.toFixed(2)} days
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

          {tableExpanded && donationResults.length > 0 && (
            <View>
              {/* Collapsible Table for Donations */}
              <h3>Donation Analysis Results</h3>
              <table>
                <thead>
                  <tr>
                    <th>First Name</th>
                    <th>Date Added</th>
                    <th>Total Amount Donated</th>
                    <th>Times Donated</th>
                    <th>Time Between Acquisition and First Donation (days)</th>
                  </tr>
                </thead>
                <tbody>
                  {donationResults.map((row, index) => (
                    <tr key={index}>
                      <td>{row['FirstName'] || "N/A"}</td>
                      <td>{row['Date Added'] || "N/A"}</td>
                      <td>${row['Total Amount Donated'].toFixed(2)}</td>
                      <td>{row['Times Donated']}</td>
                      <td>{row['Time Between Addition and First Donation (days)']} days</td>
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

          {roiPercentage > 0 && (
            <View>
              <Text>Current ROI: {roiPercentage.toFixed(2)}%</Text>
              {roiTime && (
                <Text>
                  Reached ROI on: {roiTime instanceof Date ? roiTime.toDateString() : roiTime}
                </Text>
              )}
            </View>
          )}

          <Divider margin="2rem 0" />

          <Button onClick={() => setDashboardVisible(true)}>Create Dashboard</Button>
        </>
      )}

      {/* Dashboard Section */}
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

          // Render Map with Zip Code Data
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
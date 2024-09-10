import { useState, useEffect } from "react";
import { Button, Heading, Flex, Divider, Text, View } from "@aws-amplify/ui-react";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { Amplify } from "aws-amplify";
import "@aws-amplify/ui-react/styles.css";
import { generateClient } from "aws-amplify/data";
import outputs from "../amplify_outputs.json";
import { parseCSV } from "./utils/csvutils";
import { cleanData } from "./utils/cleanData";
import { joinData } from "./utils/joinData";
import Papa from 'papaparse';

Amplify.configure(outputs);

const client = generateClient({
  authMode: "userPool",
});

export default function App() {
  const [userprofiles, setUserProfiles] = useState([]);
  const [file1Data, setFile1Data] = useState(null);
  const [file2Data, setFile2Data] = useState(null);
  const [file3Data, setFile3Data] = useState(null); // Third file for donations
  const [filesUploaded, setFilesUploaded] = useState(false);
  const [dataCleaned, setDataCleaned] = useState(false);
  const [joinedData, setJoinedData] = useState([]);
  const [finalData, setFinalData] = useState(null); // To store final cleaned and joined data
  const [donationResults, setDonationResults] = useState([]); // Store donation analysis results
  const [donationFileUploaded, setDonationFileUploaded] = useState(false); // Track if donation file is uploaded
  const { signOut } = useAuthenticator((context) => [context.user]);
  const [totalDonations, setTotalDonations] = useState(0);
  const [totalNumberOfDonations, setTotalNumberOfDonations] = useState(0);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  async function fetchUserProfile() {
    const { data: profiles } = await client.models.UserProfile.list();
    console.log("Fetched Profiles: ", profiles);
    setUserProfiles(profiles);
  }

  function handleFileChange(event, setFileData, fileIndex) {
    const file = event.target.files[0];
    if (!file) {
      console.error(`No file found for input ${fileIndex}`);
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const fileContent = e.target.result;
      console.log(`Raw CSV Content for File ${fileIndex}:`, fileContent);

      if (!fileContent) {
        console.error(`Failed to read file ${fileIndex}. The content is empty.`);
      } else {
        const data = parseCSV(fileContent);
        console.log(`Parsed CSV Data ${fileIndex}: `, data);
        setFileData(data);
      }
    };

    reader.readAsText(file);
  }

  useEffect(() => {
    if (file1Data && file2Data) {
      setFilesUploaded(true);
      console.log("Both files are uploaded");
    }
  }, [file1Data, file2Data]);

  function handleCleanData() {
    if (file1Data && file2Data) {
      const cleanedFile1 = cleanData(file1Data);
      const cleanedFile2 = cleanData(file2Data);
      setFile1Data(cleanedFile1);
      setFile2Data(cleanedFile2);
      setDataCleaned(true);
      console.log("Cleaned Data 1: ", cleanedFile1);
      console.log("Cleaned Data 2: ", cleanedFile2);
    }
  }

  function handleJoinData() {
    if (file1Data && file2Data && dataCleaned) {
      const joined = joinData(file1Data, file2Data);
      console.log("Cleaned and Joined Data: ", joined);
      setJoinedData(joined);
      setFinalData({
        cleanedFile1: file1Data,
        cleanedFile2: file2Data,
        joinedData: joined,
      });
    }
  }

  function handleDonationFileChange(event) {
    const file = event.target.files[0];
    if (!file) {
      console.log("No file selected");
      return;
    }
  
    Papa.parse(file, {
      header: true,
      complete: (result) => {
        console.log("Parsed Donation Data:", result.data);
        setFile3Data(result.data);
        setDonationFileUploaded(true);  // Set donation file uploaded to true
      }
    });
  }

  function analyzeDonations() {
    if (!file3Data) {
      console.log("No donation data available");
      return;
    }

    console.log("Joined Data:", joinedData);  // Ensure joined data exists
    if (!joinedData || joinedData.length === 0) {
      console.log("No joined data available");
      return;
    }

    let totalAmountDonated = 0;
    let totalDonationsCount = 0;

    // Group donations by email and sum their total donations
    const emailMap = new Map();

    joinedData.forEach((row) => {
      const joinedEmail = row["Email"];
      const dateCreated = new Date(row["DateCreated"]);

      const matchingDonations = file3Data.filter(donation => donation["Donor Email"] === joinedEmail);
      if (matchingDonations.length > 0) {
        const totalAmount = matchingDonations.reduce((sum, donation) => sum + parseFloat(donation.Amount || 0), 0);
        const numberOfDonations = matchingDonations.length;
        const firstDonationDate = new Date(
          matchingDonations.reduce((earliest, donation) => {
            const donationDate = new Date(donation.Date);
            return donationDate < earliest ? donationDate : earliest;
          }, new Date())
        );

        const timeDiff = Math.floor((firstDonationDate - dateCreated) / (1000 * 60 * 60 * 24));

        if (!emailMap.has(joinedEmail)) {
          emailMap.set(joinedEmail, {
            'Activist Code': row['Activist Code'],
            'Donor Email': joinedEmail,
            'Total Amount Donated': totalAmount,
            'Number of Donations': numberOfDonations,
            'Time Between Addition and First Donation (days)': timeDiff
          });
        }

        totalAmountDonated += totalAmount;
        totalDonationsCount += numberOfDonations;
      }
    });

    setTotalDonations(totalAmountDonated);
    setTotalNumberOfDonations(totalDonationsCount);

    const results = Array.from(emailMap.values());
    setDonationResults(results);
  }

  return (
    <Flex
      className="App"
      justifyContent="center"
      alignItems="center"
      direction="column"
      width="80%"
      margin="0 auto"
      padding="2rem"
      backgroundColor="#f4f4f4"
      borderRadius="8px"
      boxShadow="0 4px 8px rgba(0, 0, 0, 0.1)"
    >
      <Heading level={1} color="black">Mandate Media Acquisition</Heading>
      <Text fontSize="large" color="black">
        Upload NGP and ActBlue Files Here
      </Text>

      <Divider margin="2rem 0" />

      <Flex direction="row" justifyContent="space-around" width="100%">
        <input
          type="file"
          accept=".csv"
          onChange={(e) => handleFileChange(e, setFile1Data, 1)}
        />
        <input
          type="file"
          accept=".csv"
          onChange={(e) => handleFileChange(e, setFile2Data, 2)}
        />
      </Flex>

      {filesUploaded && <Text color="black">Files Uploaded</Text>}

      <Divider margin="2rem 0" />

      <Button
        onClick={handleCleanData}
        disabled={!file1Data || !file2Data}  // Enable when both files are uploaded
      >
        Clean Data
      </Button>

      {dataCleaned && <Text color="black">Data Cleaned</Text>}

      <Button
        onClick={handleJoinData}
        disabled={!dataCleaned}  // Enable when data is cleaned
      >
        Join Data
      </Button>

      {joinedData.length > 0 && (
        <>
          <Text color="black">Data successfully cleaned and joined</Text>
          <View>
            {joinedData.slice(0, 10).map((row, index) => (
              <Text key={index} color="black">{JSON.stringify(row)}</Text>
            ))}
          </View>

          <Divider margin="2rem 0" />

          {/* Single input for the third file (Donation file) */}
          <Text color="black">Upload Donation Data</Text>
          <input
            type="file"
            accept=".csv"
            onChange={handleDonationFileChange}  // Link to the donation file handler
          />
        </>
      )}

      {donationFileUploaded && (
        <>
          <Button onClick={analyzeDonations}>
            Analyze Donations
          </Button>
        </>
      )}

      <Divider margin="2rem 0" />

      {/* Total Donations and Number of Donations */}
      {totalDonations > 0 && (
        <View>
          <Text fontWeight="bold">Total Amount Donated: ${totalDonations.toFixed(2)}</Text>
          <Text fontWeight="bold">Total Number of Donations: {totalNumberOfDonations}</Text>
        </View>
      )}

      {donationResults.length > 0 && (
        <View>
          <h3>Donation Analysis Results</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f4f4f4', textAlign: 'left' }}>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Activist Code</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Donor Email</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Total Amount Donated</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Number of Donations</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Time Between Addition and First Donation (days)</th>
              </tr>
            </thead>
            <tbody>
              {donationResults.map((result, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{result['Activist Code'] || "N/A"}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{result['Donor Email'] || "N/A"}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    {isNaN(result['Total Amount Donated']) ? "N/A" : result['Total Amount Donated']}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    {isNaN(result['Number of Donations']) ? "N/A" : result['Number of Donations']}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    {isNaN(result['Time Between Addition and First Donation (days)']) ? "N/A" : result['Time Between Addition and First Donation (days)']}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </View>
      )}
    </Flex>
  );
}
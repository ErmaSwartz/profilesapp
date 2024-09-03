import { useState, useEffect } from "react";
import { Button, Heading, Flex, Divider, Text, View } from "@aws-amplify/ui-react";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { Amplify } from "aws-amplify";
import { useNavigate } from 'react-router-dom'; // Correct import
import "@aws-amplify/ui-react/styles.css";
import { generateClient } from "aws-amplify/data";
import outputs from "../amplify_outputs.json";
import { parseCSV } from "./utils/csvutils";
import { cleanData } from "./utils/cleanData";
import { joinData } from "./utils/joinData";

Amplify.configure(outputs);

const client = generateClient({
  authMode: "userPool",
});

export default function App() {
  const [userprofiles, setUserProfiles] = useState([]);
  const [file1Data, setFile1Data] = useState(null);
  const [file2Data, setFile2Data] = useState(null);
  const [filesUploaded, setFilesUploaded] = useState(false);
  const [dataCleaned, setDataCleaned] = useState(false);
  const [joinedData, setJoinedData] = useState([]);
  const { signOut } = useAuthenticator((context) => [context.user]);
  const navigate = useNavigate();

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
    const reader = new FileReader();

    reader.onload = (e) => {
        const fileContent = e.target.result;
        console.log(`Raw CSV Content for File ${fileIndex}:`, fileContent);

        const data = parseCSV(fileContent);
        console.log(`Parsed CSV Data ${fileIndex}: `, data);  // Log the parsed data
        
        setFileData(data);

        // Log to verify both files have data
        console.log("File1Data after setting:", fileIndex === 1 ? data : file1Data);
        console.log("File2Data after setting:", fileIndex === 2 ? data : file2Data);

        if (file1Data && file2Data) {
            setFilesUploaded(true);
        }
    };

    reader.readAsText(file);
}

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
      const joinedData = joinData(file1Data, file2Data);
      console.log("Cleaned and Joined Data: ", joinedData);
      setJoinedData(joinedData.slice(0, 10)); // Display top 10 rows
    }
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
            {joinedData.map((row, index) => (
              <Text key={index} color="black">{JSON.stringify(row)}</Text>
            ))}
          </View>
        </>
      )}

      <Divider margin="2rem 0" />

      <Button onClick={() => navigate('/next')}>
        Next
      </Button>
    </Flex>
  );
}
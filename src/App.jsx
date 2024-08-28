import { useState, useEffect } from "react";
import {
  Button,
  Heading,
  Flex,
  Grid,
  Divider,
} from "@aws-amplify/ui-react";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { Amplify } from "aws-amplify";
import "@aws-amplify/ui-react/styles.css";
import { generateClient } from "aws-amplify/data";
import outputs from "../amplify_outputs.json";
import { parseCSV } from "./utils/csvutils";
import { cleanData } from "./utils/cleanData"; // Import the cleanData function
import { joinData } from "./utils/joinData"; // Import the joinData function
import { parseCSV } from "./utils/csvutils";

Amplify.configure(outputs);

const client = generateClient({
  authMode: "userPool",
});

export default function App() {
  const [userprofiles, setUserProfiles] = useState([]);
  const [file1Data, setFile1Data] = useState(null);
  const [file2Data, setFile2Data] = useState(null);
  const { signOut } = useAuthenticator((context) => [context.user]);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  async function fetchUserProfile() {
    const { data: profiles } = await client.models.UserProfile.list();
    console.log("Fetched Profiles: ", profiles);
    setUserProfiles(profiles);
  }

  function handleFileChange(event, setFileData) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const fileContent = e.target.result;
      const data = parseCSV(fileContent);
      console.log("Parsed CSV Data: ", data);
      setFileData(data);
    };

    reader.readAsText(file);
  }

  function handleJoinAndCleanData() {
    if (file1Data && file2Data) {
      const joinedData = joinData(file1Data, file2Data);
      const cleanedData = cleanData(joinedData);
      console.log("Cleaned and Joined Data: ", cleanedData);
      setUserProfiles(cleanedData);
    }
  }

  function handleCleanData() {
    if (userprofiles.length > 0) {
      const cleanedData = cleanData(userprofiles);
      console.log("Cleaned Data: ", cleanedData);
      setUserProfiles(cleanedData);
    }
  }

  return (
    <Flex
      className="App"
      justifyContent="center"
      alignItems="center"
      direction="column"
      width="70%"
      margin="0 auto"
    >
      <Heading level={1}>Clean and Join Data</Heading>
      <Heading level={2}>Mandate Media Acquisition App</Heading>

      <Divider />

      <Grid
        margin="3rem 0"
        autoFlow="column"
        justifyContent="center"
        gap="2rem"
        alignContent="center"
      >
        {userprofiles.map((userprofile) => (
          <Flex
            key={userprofile.id || userprofile.email}
            direction="column"
            justifyContent="center"
            alignItems="center"
            gap="2rem"
            border="1px solid #ccc"
            padding="2rem"
            borderRadius="5%"
            className="box"
          >
            {/* Additional content for each profile could go here */}
          </Flex>
        ))}
      </Grid>

      <input
        type="file"
        accept=".csv"
        onChange={(e) => handleFileChange(e, setFile1Data)}
      />
      <Button>Upload ActBlue Data</Button>

      <input
        type="file"
        accept=".csv"
        onChange={(e) => handleFileChange(e, setFile2Data)}
      />
      <Button>Upload NGP Data</Button>

      <Button onClick={handleJoinAndCleanData}>Join and Clean Data</Button>
      <Button onClick={handleCleanData}>Clean Data</Button>
      <Button onClick={signOut}>Sign Out</Button>
    </Flex>
  );
}
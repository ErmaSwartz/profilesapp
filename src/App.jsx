import { useState, useEffect } from "react";
import {
  Button,
  Heading,
  Flex,
  Grid,
  Divider,
  Text,
} from "@aws-amplify/ui-react";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { Amplify } from "aws-amplify";
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
  const [joinedData, setJoinedData] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
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
      const joined = joinData(file1Data, file2Data);
      const cleaned = cleanData(joined);
      console.log("Cleaned and Joined Data: ", cleaned);
      setJoinedData(cleaned.slice(0, 10)); // Save the top 10 rows for display
      setSuccessMessage("Data successfully cleaned and joined");
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

      {/* Upload Data Section */}
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

      <Divider />

      {/* Join and Clean Data Section */}
      <Button onClick={handleJoinAndCleanData}>Join and Clean Data</Button>

      <Divider />

      {/* Display Success Message */}
      {successMessage && (
        <Text variation="success" margin="1rem 0">
          {successMessage}
        </Text>
      )}

      {/* Display Top 10 Joined and Cleaned Data */}
      {joinedData && (
        <Grid
          margin="3rem 0"
          autoFlow="row"
          gap="0.5rem"
          alignContent="center"
        >
          {joinedData.map((row, index) => (
            <Flex
              key={index}
              direction="row"
              justifyContent="center"
              alignItems="center"
              gap="1rem"
              border="1px solid #ccc"
              padding="1rem"
              borderRadius="5%"
            >
              {Object.values(row).map((value, i) => (
                <Text key={i}>{value}</Text>
              ))}
            </Flex>
          ))}
        </Grid>
      )}

      <Divider />

      <Button onClick={signOut}>Sign Out</Button>
    </Flex>
  );
}
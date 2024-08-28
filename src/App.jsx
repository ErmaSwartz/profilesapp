import { useState, useEffect } from "react";
import {
  Button,
  Heading,
  Flex,
  View,
  Grid,
  Divider,
} from "@aws-amplify/ui-react";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { Amplify } from "aws-amplify";
import "@aws-amplify/ui-react/styles.css";
import { generateClient } from "aws-amplify/data";
import outputs from "../amplify_outputs.json";
/**
 * @type {import('aws-amplify/data').Client<import('../amplify/data/resource').Schema>}
 */

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
    setUserProfiles(profiles);
  }

  function handleFileChange(event, setFileData) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const fileContent = e.target.result;
      // Assume the files are CSV, parse them (we'll use a simple parsing function)
      const data = parseCSV(fileContent);
      setFileData(data);
    };

    reader.readAsText(file);
  }

  function parseCSV(data) {
    const rows = data.split("\n");
    const headers = rows[0].split(",");
    const result = rows.slice(1).map((row) => {
      const values = row.split(",");
      return headers.reduce((acc, header, index) => {
        acc[header] = values[index];
        return acc;
      }, {});
    });
    return result;
  }

  function joinData() {
    if (file1Data && file2Data) {
      const joinedData = file1Data.map((row1) => {
        const match = file2Data.find((row2) => row2.VANID === row1.VANID);
        return match ? { ...row1, ...match } : row1;
      });
      console.log("Joined Data: ", joinedData);
      setUserProfiles(joinedData);
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
      <Heading level={1}>My Profile</Heading>

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
            <View>
              <Heading level="3">{userprofile.email}</Heading>
            </View>
          </Flex>
        ))}
      </Grid>

      <input
        type="file"
        accept=".csv"
        onChange={(e) => handleFileChange(e, setFile1Data)}
      />
      <input
        type="file"
        accept=".csv"
        onChange={(e) => handleFileChange(e, setFile2Data)}
      />
      <Button onClick={joinData}>Join Data</Button>
      <Button onClick={signOut}>Sign Out</Button>
    </Flex>
  );
}

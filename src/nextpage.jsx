import React from "react";
import { Button, Heading, Flex } from "@aws-amplify/ui-react";
import { useNavigate } from "react-router-dom"; // Correct import

function NextPage() {
  const navigate = useNavigate();

  return (
    <Flex
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
      <Heading level={1} color="black">Next Page</Heading>
      <Button onClick={() => navigate("/")}>Go Back</Button>
      {/* Add more content here for the next page */}
    </Flex>
  );
}

export default NextPage;
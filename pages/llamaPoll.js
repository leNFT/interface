import contractAddresses from "../contractAddresses.json";
import { useNotification, Loading, Typography } from "@web3uikit/core";
import { getAddressNFTCollections } from "../helpers/getAddressNFTCollections.js";
import { Grid, TextField, Box } from "@mui/material";
import { Button, Spinner } from "grommet";
import {
  useContract,
  useProvider,
  useNetwork,
  useAccount,
  chainId,
} from "wagmi";
import { sendLlamaPoll } from "../helpers/sendLlamaPoll";
import { useEffect, useState } from "react";

export default function LlamaPoll() {
  const [userCollections, setUserCollections] = useState([]);
  const { address, isConnected } = useAccount();
  const [answered, setAnswered] = useState(false);
  const { chain } = useNetwork();

  const dispatch = useNotification();
  var addresses = contractAddresses[1];
  // Add the new states
  const [inputValue, setInputValue] = useState("");

  // Update the updateUI function to set user collections when they connect their wallet
  async function updateUI() {
    if (address) {
      const updatedCollections = await getAddressNFTCollections(
        address,
        chain.id
      );
      setUserCollections(updatedCollections);
    }
  }

  function CollectionButton({ collection, onClick }) {
    return (
      <Grid item xs={3}>
        <div
          className="flex bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 rounded-lg shadow-md hover:shadow-lg cursor-pointer text-white text-center font-bold py-2 px-4"
          onClick={() => onClick(collection.name)}
        >
          {collection.name}
        </div>
      </Grid>
    );
  }

  const handleButtonClick = (collectionName) => {
    if (!inputValue.includes(collectionName)) {
      setInputValue((prev) => prev + collectionName + ", ");
    }
  };

  const sendEmail = async () => {
    console.log("Sending email", inputValue);
    const finalMessage = `Message: ${inputValue}`;

    setAnswered(true);

    await sendLlamaPoll(finalMessage);
  };

  useEffect(() => {
    if (isConnected) {
      updateUI();
    }
  }, [isConnected, address]);

  return (
    <>
      {answered ? (
        <div className="flex flex-col">
          <Box
            className="my-8 text-center"
            sx={{
              fontFamily: "Monospace",
              fontSize: "h6.fontSize",
              fontWeight: "bold",
            }}
          >
            {"'" + inputValue + "'"}
          </Box>
          <Box
            className="my-8 text-center"
            sx={{
              fontFamily: "Monospace",
              fontSize: "h6.fontSize",
              fontWeight: "bold",
            }}
          >
            Thank you for your answer!
          </Box>
        </div>
      ) : (
        <div>
          <Box
            className="my-8 text-center"
            sx={{
              fontFamily: "Monospace",
              fontSize: "h6.fontSize",
              fontWeight: "bold",
            }}
          >
            Which collections would you like to see in leNFT?
          </Box>

          {isConnected && (
            <div className="flex flex-col items-center m-12">
              <Grid container spacing={2} className="w-8/12  items-center">
                {userCollections.map((collection) => (
                  <CollectionButton
                    key={collection.id}
                    collection={collection}
                    onClick={handleButtonClick}
                  />
                ))}
              </Grid>
            </div>
          )}

          <div className="flex flex-col items-center mt-4">
            <div className="flex flex-col w-6/12">
              <TextField
                label="Collections you'd like to LP in leNFT"
                variant="outlined"
                fullWidth
                multiline
                rows={4}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
            </div>
            <div className="flex flex-col items-center mt-4">
              <Button
                primary
                size="small"
                color={"#d2c6d2"}
                onClick={sendEmail}
                label={
                  <div className="flex">
                    <Box
                      sx={{
                        fontFamily: "Monospace",
                        fontSize: "subtitle2.fontSize",
                        fontWeight: "bold",
                        letterSpacing: 2,
                      }}
                    >
                      Send Answer
                    </Box>
                  </div>
                }
              />
            </div>
          </div>

          {!isConnected && (
            <Box
              className="mt-12 text-center"
              sx={{
                fontFamily: "Monospace",
                fontSize: "subtitle2.fontSize",
                fontWeight: "bold",
                letterSpacing: 2,
              }}
            >
              ...connect your wallet to pick from your collections
            </Box>
          )}
        </div>
      )}
    </>
  );
}

import styles from "../styles/Home.module.css";
import contractAddresses from "../contractAddresses.json";
import { useAccount, useNetwork, useContract, useProvider } from "wagmi";
import { Button, Menu } from "grommet";
import { useState } from "react";
import { getAddressNFTs } from "../helpers/getAddressNFTs.js";
import { buyQuoteAmount } from "../helpers/buyQuoteAmount.js";
import { buyQuote } from "../helpers/buyQuote.js";
import { sellQuote } from "../helpers/sellQuote.js";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import { CardActionArea } from "@mui/material";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import { BigNumber } from "@ethersproject/bignumber";
import { Divider } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { formatUnits, parseUnits } from "@ethersproject/units";
import { Loading, Typography, Input } from "@web3uikit/core";
import { ethers } from "ethers";

export default function Swap() {
  const { chain } = useNetwork();
  const { address, isConnected } = useAccount();

  const [nftAddress, setNFTAddress] = useState("");
  const [amount, setAmount] = useState(0);
  const [selectingNFTs, setSelectingNFTs] = useState(false);
  const [selectedNFTs, setSelectedNFTs] = useState([]);
  const [userNFTs, setUserNFTs] = useState([]);
  const provider = useProvider();
  const addresses =
    chain && chain.id in contractAddresses
      ? contractAddresses[chain.id]
      : contractAddresses["1"];
  const SELECTED_COLOR = "#d2c6d2";
  const UNSELECTED_COLOR = "#eae5ea";
  const [option, setOption] = useState("buy");

  async function getUserNFTs(collection) {
    // Get user NFT assets
    const addressNFTs = await getAddressNFTs(address, collection, chain.id);
    setUserNFTs(addressNFTs);
  }

  const handleAmountInputChange = (event) => {
    console.log("handleAmountInputChange", event.target.value);
    try {
      setAmount(event.target.value);
    } catch (error) {
      console.log(error);
    }
  };

  const handleNFTAddressChange = (event) => {
    console.log("handleNFTAddressChange", event.target.value);
    try {
      ethers.utils.getAddress(event.target.value);
      setNFTAddress(event.target.value);
      getUserNFTs(event.target.value);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-col items-center text-center justify-center md:w-6/12 border-4 m-2 rounded-3xl bg-black/5 shadow-lg">
        <div className="flex flex-row m-4">
          <div className="flex flex-col m-2">
            <Button
              primary
              size="medium"
              color={option == "buy" ? SELECTED_COLOR : UNSELECTED_COLOR}
              onClick={() => {
                setOption("buy");
              }}
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
                    Buy
                  </Box>
                </div>
              }
            />
          </div>
          <div className="flex flex-col m-2">
            <Button
              primary
              size="medium"
              color={option == "sell" ? SELECTED_COLOR : UNSELECTED_COLOR}
              onClick={() => {
                setOption("sell");
              }}
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
                    Sell
                  </Box>
                </div>
              }
            />
          </div>
        </div>
        <div className="flex flex-row w-8/12 justify-center items-center">
          <Divider style={{ width: "100%" }} />
        </div>
        <div className="flex flex-row m-8">
          <TextField
            size="big"
            placeholder="NFT Address"
            variant="outlined"
            onChange={handleNFTAddressChange}
          />
        </div>
        <div className="flex flex-col justify-center mb-8">
          <div className="flex flex-row justify-center">
            <div className="flex flex-col w-4/12 justify-center m-2">
              <TextField
                size="small"
                placeholder="Amount"
                variant="outlined"
                value={amount}
                onChange={handleAmountInputChange}
              />
            </div>
            <div className="flex flex-col text-center justify-center m-2">
              OR
            </div>
            <div className="flex flex-col text-center justify-center m-2">
              <Button
                primary
                size="medium"
                color={SELECTED_COLOR}
                onClick={() => {
                  // Reset selected NFTs
                  setSelectedNFTs([]);
                  setSelectingNFTs(!selectingNFTs);
                }}
                disabled={!nftAddress}
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
                      Select NFTs
                    </Box>
                  </div>
                }
              />
            </div>
          </div>
          {selectingNFTs && (
            <div className="flex flex-row m-4 grid md:grid-cols-3 lg:grid-cols-4">
              {userNFTs.map((nft, _) => (
                <div
                  key={BigNumber.from(nft.id.tokenId).toNumber()}
                  className="flex m-2 items-center justify-center max-w-[300px]"
                >
                  <Card
                    sx={{
                      borderRadius: 4,
                      background: selectedNFTs.find(
                        (element) =>
                          element == BigNumber.from(nft.id.tokenId).toNumber()
                      )
                        ? "linear-gradient(to right bottom, #fccb90 0%, #d57eeb 100%)"
                        : "linear-gradient(to right bottom, #eff2ff, #f0e5e9)",
                    }}
                  >
                    <CardActionArea
                      onClick={function () {
                        //If it's selected we unselect and if its unselected we select
                        var newSelectedNFTs = selectedNFTs.slice();
                        var index = newSelectedNFTs.findIndex(
                          (element) =>
                            element == BigNumber.from(nft.id.tokenId).toNumber()
                        );
                        if (index == -1) {
                          newSelectedNFTs.push(
                            BigNumber.from(nft.id.tokenId).toNumber()
                          );
                        } else {
                          newSelectedNFTs.splice(index, 1);
                        }
                        setSelectedNFTs(newSelectedNFTs);
                      }}
                    >
                      <CardContent>
                        <Box
                          sx={{
                            fontFamily: "Monospace",
                            fontSize: "caption",
                          }}
                        >
                          {BigNumber.from(nft.id.tokenId).toNumber()}
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-row justify-center m-4 items-center">
            <Typography>PRICE is</Typography>
          </div>
        </div>
        <div className="flex flex-row w-11/12 justify-center items-center">
          <Divider style={{ width: "100%" }} />
        </div>
        <div className="flex flex-row m-6 w-4/12">
          <Button
            primary
            fill="horizontal"
            size="large"
            color="#063970"
            onClick={() => {}}
            label={
              <div className="flex justify-center">
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "subtitle2.fontSize",
                    fontWeight: "bold",
                    letterSpacing: 2,
                  }}
                >
                  {option.toUpperCase() + " " + selectedNFTs.length + " NFTs"}
                </Box>
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
}

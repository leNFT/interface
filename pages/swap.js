import contractAddresses from "../contractAddresses.json";
import {
  useAccount,
  useNetwork,
  useContract,
  useProvider,
  useSigner,
} from "wagmi";
import { Button } from "grommet";
import { useState } from "react";
import { getAddressNFTs } from "../helpers/getAddressNFTs.js";
import { getBuyQuote } from "../helpers/getBuyQuote.js";
import { getSellQuote } from "../helpers/getSellQuote.js";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import { CardActionArea } from "@mui/material";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import { BigNumber } from "@ethersproject/bignumber";
import { Divider } from "@mui/material";
import { formatUnits } from "@ethersproject/units";
import tradingPoolFactoryContract from "../contracts/TradingPoolFactory.json";
import tradingPoolContract from "../contracts/TradingPool.json";
import { Typography, useNotification } from "@web3uikit/core";
import { ethers } from "ethers";

export default function Swap() {
  const { chain } = useNetwork();
  const { data: signer } = useSigner();
  const { address, isConnected } = useAccount();
  const [nftAddress, setNFTAddress] = useState("0x");
  const [poolAddress, setPoolAddress] = useState("");
  const [amount, setAmount] = useState(0);
  const [selectingNFTs, setSelectingNFTs] = useState(false);
  const [selectedNFTs, setSelectedNFTs] = useState([]);
  const [userNFTs, setUserNFTs] = useState([]);
  const [priceQuote, setPriceQuote] = useState();
  const [swapLoading, setSwapLoading] = useState(false);
  const dispatch = useNotification();

  const provider = useProvider();
  const addresses =
    chain && chain.id in contractAddresses
      ? contractAddresses[chain.id]
      : contractAddresses["1"];
  const SELECTED_COLOR = "#d2c6d2";
  const UNSELECTED_COLOR = "#eae5ea";
  const [option, setOption] = useState("buy");

  const factoryProvider = useContract({
    contractInterface: tradingPoolFactoryContract.abi,
    addressOrName: addresses.TradingPoolFactory,
    signerOrProvider: provider,
  });

  async function getUserNFTs(collection) {
    // Get user NFT assets
    const addressNFTs = await getAddressNFTs(address, collection, chain.id);
    setUserNFTs(addressNFTs);
  }
  async function getTradingPoolAddress(collection) {
    // Get trading pool for collection
    const updatedPool = (
      await factoryProvider.getTradingPool(collection, addresses.ETH.address)
    ).toString();

    setPoolAddress(updatedPool);
  }

  async function getPriceQuote(amount) {
    if (option == "buy") {
      const newBuyQuote = await getBuyQuote(chain.id, amount, poolAddress);
      setPriceQuote(newBuyQuote);
      setAmount(newBuyQuote.lps.length);
      console.log("newBuyQuote", newBuyQuote);
    } else if (option == "sell") {
      const newSellQuote = await getSellQuote(chain.id, amount, poolAddress);
      setPriceQuote(newSellQuote);
      setAmount(newSellQuote.lps.length);
      console.log("newSellQuote", newSellQuote);
      // Get an amount of random NFTs to sell
      var newSelectedNFTs = [];
      for (let index = 0; index < newSellQuote.lps.length; index++) {
        if (index > userNFTs.length) {
          break;
        }
        newSelectedNFTs.push(
          BigNumber.from(userNFTs[index].id.tokenId).toNumber()
        );
      }
      console.log("newSelectedNFTs", newSelectedNFTs);
      setSelectedNFTs(newSelectedNFTs);
    }
  }

  const handleAmountInputChange = (event) => {
    console.log("handleAmountInputChange", event.target.value);
    try {
      if (event.target.value) {
        getPriceQuote(event.target.value);
      }
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
      getTradingPoolAddress(event.target.value);
    } catch (error) {
      console.log(error);
    }
  };

  const handleBuySuccess = async function () {
    dispatch({
      type: "success",
      message: "You just bought.",
      title: "Buy Successful!",
      position: "topR",
    });
  };

  const handleSellSuccess = async function () {
    dispatch({
      type: "success",
      message: "Your just sold.",
      title: "Sell Successful!",
      position: "topR",
    });
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
        <div className="flex flex-col m-8">
          <TextField
            size="big"
            placeholder="NFT Address"
            variant="outlined"
            onChange={handleNFTAddressChange}
          />
          {poolAddress && (
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: "caption.fontSize",
                fontWeight: "bold",
                letterSpacing: 2,
              }}
            >
              {"Pool: " +
                poolAddress.slice(0, 5) +
                ".." +
                poolAddress.slice(-2)}
            </Box>
          )}
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
          {priceQuote && (
            <div className="flex flex-row justify-center m-4 items-center">
              <Typography>
                {"Price is " + formatUnits(priceQuote.price, 18) + " ETH"}
              </Typography>
            </div>
          )}
        </div>
        <div className="flex flex-row w-11/12 justify-center items-center">
          <Divider style={{ width: "100%" }} />
        </div>
        <div className="flex flex-row m-6 w-4/12">
          <Button
            primary
            fill="horizontal"
            size="large"
            loading={swapLoading}
            color="#063970"
            onClick={async function () {
              const tradingPool = new ethers.Contract(
                poolAddress,
                tradingPoolContract.abi,
                signer
              );
              var tx;
              if (option == "buy") {
                try {
                  tx = await tradingPool.buy(priceQuote.exampleNFTs);
                  await tx.wait(1);
                  handleBuySuccess();
                } catch (error) {
                  console.log(error);
                } finally {
                  setSwapLoading(false);
                }
              } else if (option == "sell") {
                try {
                  tx = await tradingPool.sell(selectedNFTs, priceQuote.lps);
                  await tx.wait(1);
                  handleSellSuccess();
                } catch (error) {
                  console.log(error);
                } finally {
                  setSwapLoading(false);
                }
              }
            }}
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
                  {option.toUpperCase() + " " + amount + " NFTs"}
                </Box>
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
}

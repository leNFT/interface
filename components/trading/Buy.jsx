import { useNotification, Typography } from "@web3uikit/core";
import contractAddresses from "../../contractAddresses.json";
import {
  useAccount,
  useNetwork,
  useContract,
  useSigner,
  useProvider,
} from "wagmi";
import { Table } from "@nextui-org/react";
import { ethers } from "ethers";
import { getTradingPoolHistory } from "../../helpers/getTradingPoolHistory.js";
import Image from "next/image";
import erc20 from "../../contracts/erc20.json";
import erc721 from "../../contracts/erc721.json";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import { Input, Loading } from "@nextui-org/react";
import { getAddressNFTs } from "../../helpers/getAddressNFTs.js";
import { getTradingNFTCollections } from "../../helpers/getTradingNFTCollections.js";
import { getBuyQuote } from "../../helpers/getBuyQuote.js";
import { getNFTImage } from "../../helpers/getNFTImage.js";
import { getBuyExactQuote } from "../../helpers/getBuyExactQuote.js";
import Chip from "@mui/material/Chip";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import { CardActionArea } from "@mui/material";
import { formatUnits } from "@ethersproject/units";
import { BigNumber } from "@ethersproject/bignumber";
import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import { Button, Spinner } from "grommet";
import { Divider } from "@mui/material";
import tradingPoolFactoryContract from "../../contracts/TradingPoolFactory.json";
import wethGateway from "../../contracts/WETHGateway.json";
import * as timeago from "timeago.js";

export default function Buy() {
  const { chain } = useNetwork();
  const { address, isConnected } = useAccount();
  const provider = useProvider();
  const [availableNFTs, setAvailableNFTs] = useState([]);
  const [selectingNFTs, setSelectingNFTs] = useState(false);
  const [selectedNFTs, setSelectedNFTs] = useState([]);
  const [tradingCollections, setTradingCollections] = useState([]);
  const { data: signer } = useSigner();
  const [approvedToken, setApprovedToken] = useState(false);
  const [nftAddress, setNFTAddress] = useState("");
  const [poolAddress, setPoolAddress] = useState("");
  const [amount, setAmount] = useState(0);
  const [priceQuote, setPriceQuote] = useState();
  const [loadingPriceQuote, setLoadingPriceQuote] = useState(false);
  const [buyLoading, setBuyLoading] = useState(false);
  const [nftName, setNFTName] = useState("");
  const [collectionThumbnailURL, setCollectionThumbnailURL] = useState("");
  const [poolHistory, setPoolHistory] = useState([]);

  const dispatch = useNotification();

  var addresses = contractAddresses["11155111"];

  const factoryProvider = useContract({
    contractInterface: tradingPoolFactoryContract.abi,
    addressOrName: addresses.TradingPoolFactory,
    signerOrProvider: provider,
  });

  const wethGatewaySigner = useContract({
    contractInterface: wethGateway.abi,
    addressOrName: addresses.WETHGateway,
    signerOrProvider: signer,
  });

  async function getAvailableNFTs(pool, collection) {
    // Get user NFT assets
    const addressNFTs = await getAddressNFTs(
      pool,
      collection,
      isConnected ? chain.id : 5
    );
    setAvailableNFTs(addressNFTs);
  }

  async function getTradingCollections(chain) {
    // Get user NFT assets
    const updatedTradingCollections = await getTradingNFTCollections(chain);
    setTradingCollections(updatedTradingCollections);
    console.log("tradingCollections", updatedTradingCollections);
  }

  async function getCollectionThumbnailURL(collection) {
    const updatedURL = await getNFTImage(
      collection,
      1,
      isConnected ? chain.id : 1
    );
    console.log("updatedURL", updatedURL);
    setCollectionThumbnailURL(updatedURL);
  }

  async function getTradingPoolAddress(collection) {
    console.log("Getting trading pool address for", collection);
    // Get trading pool for collection
    const updatedPool = (
      await factoryProvider.getTradingPool(collection, addresses.ETH.address)
    ).toString();

    console.log("updatedpool", updatedPool);
    getNFTName(collection);
    setPoolAddress(updatedPool);
    getAvailableNFTs(updatedPool, collection);

    // Get history
    const updatedHistory = await getTradingPoolHistory(
      isConnected ? chain.id : 1,
      updatedPool
    );
    setPoolHistory(updatedHistory);

    if (isConnected) {
      getTokenAllowance(updatedPool);
    }
  }

  async function getPriceQuote(amount) {
    if (amount > 0) {
      setPriceQuote();
      setLoadingPriceQuote(true);
      var newBuyQuote;
      if (selectingNFTs) {
        newBuyQuote = await getBuyExactQuote(
          isConnected ? chain.id : 5,
          selectedNFTs,
          poolAddress
        );
      } else {
        newBuyQuote = await getBuyQuote(
          isConnected ? chain.id : 5,
          amount,
          poolAddress
        );
      }
      if (newBuyQuote.lps.length) {
        setPriceQuote(newBuyQuote);
      }
      setLoadingPriceQuote(false);
      setAmount(newBuyQuote.lps.length);
      console.log("newBuyQuote", newBuyQuote);
      // Fill the selected NFTs array
      var newSelectedNFTs = [];
      if (selectingNFTs) {
        // Remove any NFTs that can't be sold as per the quote
        newSelectedNFTs = selectedNFTs.slice(0, newBuyQuote.lps.length);
      } else {
        for (let index = 0; index < newBuyQuote.lps.length; index++) {
          if (index > availableNFTs.length) {
            break;
          }
          newSelectedNFTs.push(
            BigNumber.from(availableNFTs[index].tokenId).toNumber()
          );
        }
      }
      if (newSelectedNFTs.length != selectedNFTs.length) {
        console.log("newSelectedNFTs", newSelectedNFTs);
        setSelectedNFTs(newSelectedNFTs);
      }
    }
  }

  async function getNFTName(collection) {
    console.log("nftAddress", nftAddress);
    const nftContract = new ethers.Contract(collection, erc721, provider);
    const name = await nftContract.name();

    console.log("Got nft name:", name);

    if (name) {
      setNFTName(name);
    } else {
      setNFTName("");
    }
  }

  async function getTokenAllowance(pool) {
    const tokenContract = new ethers.Contract(
      addresses.ETH.address,
      erc20,
      provider
    );

    const allowance = await tokenContract.allowance(address, pool);

    console.log("Got allowance:", allowance);

    if (!allowance.eq(BigNumber.from(0))) {
      setApprovedToken(true);
    } else {
      setApprovedToken(false);
    }
  }

  // Runs once
  useEffect(() => {
    if (isConnected) {
      addresses = contractAddresses[chain.id];
      getTradingCollections(chain.id);
    }

    console.log("useEffect called");
  }, [isConnected, chain]);

  useEffect(() => {
    if (nftAddress && poolAddress && selectedNFTs.length > 0) {
      setAmount(selectedNFTs.length);
      getPriceQuote(selectedNFTs.length);
    } else {
      setAmount(0);
      setPriceQuote();
    }
  }, [selectedNFTs]);

  const handleBuySuccess = async function () {
    setPriceQuote();
    dispatch({
      type: "success",
      message: "You just bought.",
      title: "Buy Successful!",
      position: "bottomL",
    });
  };

  const handleAmountInputChange = (event) => {
    setSelectingNFTs(false);
    console.log("handleAmountInputChange", event.target.value);
    if (event.target.value > availableNFTs.length) {
      setAmount(availableNFTs.length);
      dispatch({
        type: "warning",
        message:
          "Pool only has " +
          availableNFTs.length +
          " " +
          nftName +
          "s available",
        title: "Amount too high!",
        position: "bottomL",
      });
    } else {
      setAmount(event.target.value);
      try {
        if (event.target.value && nftAddress) {
          getPriceQuote(event.target.value);
        } else {
          setPriceQuote();
        }
        setAmount(event.target.value);
      } catch (error) {
        console.log(error);
      }
    }
  };

  const handleNFTAddressChange = (_event, value) => {
    console.log("handleNFTAddressChange", value);
    setAmount(0);
    setSelectedNFTs([]);
    setPriceQuote();
    if (ethers.utils.isAddress(value)) {
      setNFTAddress(value);
      getCollectionThumbnailURL(value);
      getTradingPoolAddress(value);
    } else if (
      tradingCollections.map((collection) => collection.name).includes(value)
    ) {
      const nftAddress = tradingCollections.find(
        (collection) => collection.name == value
      ).address;
      setNFTAddress(nftAddress);
      getCollectionThumbnailURL(nftAddress);
      getTradingPoolAddress(nftAddress);
    } else {
      console.log("Invalid NFT Address");
      if (value == "") {
        setNFTAddress("");
      } else {
        setNFTAddress("0x");
      }
      setCollectionThumbnailURL("");
      setPriceQuote();
      setPoolAddress("");
      setNFTName("");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="flex flex-col items-center text-center w-full py-8 md:w-fit md:p-8 justify-center m-4 rounded-3xl bg-black/5 shadow-lg">
        <div className="flex flex-col m-4">
          <div className="flex flex-row justify-center items-center mx-2">
            <Autocomplete
              autoComplete
              freeSolo
              disablePortal
              ListboxProps={{
                style: {
                  backgroundColor: "rgb(253, 241, 244)",
                  fontFamily: "Monospace",
                },
              }}
              options={tradingCollections.map((option) => option.name)}
              sx={{ minWidth: { xs: 215, sm: 300, md: 380 } }}
              onInputChange={handleNFTAddressChange}
              renderOption={(props, option, state) => (
                <div className="flex flex-row m-4" {...props}>
                  <div className="flex w-3/12 h-[50px]">
                    {tradingCollections.find(
                      (collection) => collection.name == option
                    ).image != "" && (
                      <Image
                        loader={() =>
                          tradingCollections.find(
                            (collection) => collection.name == option
                          ).image
                        }
                        src={
                          tradingCollections.find(
                            (collection) => collection.name == option
                          ).image
                        }
                        height="50"
                        width="50"
                        className="rounded-xl"
                      />
                    )}
                  </div>
                  <div className="flex mx-2">{option}</div>
                </div>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="NFT Name or Address"
                  sx={{
                    "& label": {
                      paddingLeft: (theme) => theme.spacing(2),
                      fontFamily: "Monospace",
                      fontSize: "subtitle1.fontSize",
                    },
                    "& input": {
                      paddingLeft: (theme) => theme.spacing(3.5),
                      fontFamily: "Monospace",
                    },
                    "& fieldset": {
                      paddingLeft: (theme) => theme.spacing(2.5),
                      borderRadius: "20px",
                      fontFamily: "Monospace",
                    },
                  }}
                />
              )}
            />
            {collectionThumbnailURL && (
              <div className="flex ml-4">
                <Image
                  loader={() => collectionThumbnailURL}
                  src={collectionThumbnailURL}
                  alt="NFT Thumbnail"
                  height="60"
                  width="60"
                  className="rounded-xl"
                />
              </div>
            )}
          </div>
          {nftAddress && (
            <div className="flex flex-row mt-1 justify-center">
              <Box
                sx={{
                  fontFamily: "Monospace",
                  fontSize: "caption.fontSize",
                  fontWeight: "bold",
                  letterSpacing: 2,
                }}
              >
                {poolAddress
                  ? "Pool: " +
                    poolAddress.slice(0, 5) +
                    ".." +
                    poolAddress.slice(-2)
                  : "No pool found"}
              </Box>
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center m-4">
          <div className="flex flex-col md:flex-row justify-center items-center">
            <div className="flex flex-col w-[200px] justify-center m-2">
              <Input
                labelLeft={
                  <Box
                    sx={{
                      fontFamily: "Monospace",
                      fontSize: "h6.fontSize",
                      fontWeight: "bold",
                    }}
                  >
                    Buy
                  </Box>
                }
                bordered
                size="xl"
                aria-label="NFTs"
                labelRight={
                  <Box
                    sx={{
                      fontFamily: "Monospace",
                      fontSize: "h6.fontSize",
                      fontWeight: "bold",
                    }}
                  >
                    NFTs
                  </Box>
                }
                placeholder="0"
                value={amount}
                onChange={handleAmountInputChange}
                css={{ textAlignLast: "center" }}
              />
            </div>
            <div className="flex flex-row">
              <div className="flex flex-col text-center justify-center m-2">
                OR
              </div>
              <div className="flex flex-col text-center justify-center m-2">
                <Button
                  primary
                  size="medium"
                  color="#d2c6d2"
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
          </div>
          {selectingNFTs &&
            (availableNFTs.length > 0 ? (
              <div className="flex flex-col justify-center items-center m-4">
                <div className="flex flex-row items-center text-center justify-center">
                  <Box
                    sx={{
                      fontFamily: "Monospace",
                      fontSize: "caption.fontSize",
                      fontWeight: "bold",
                      color: "#be4d25",
                    }}
                  >
                    {"Selecting NFTs doesn't guarantee the best buy price."}
                  </Box>
                </div>
                <div className="m-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 overflow-auto max-h-[24rem]">
                  {availableNFTs.map((nft, _) => (
                    <div
                      key={BigNumber.from(nft.tokenId).toNumber()}
                      className="flex m-2 items-center justify-center max-w-[300px]"
                    >
                      <Card
                        sx={{
                          borderRadius: 4,
                          background: selectedNFTs.includes(
                            BigNumber.from(nft.tokenId).toNumber()
                          )
                            ? "linear-gradient(to right bottom, #fccb90 0%, #d57eeb 100%)"
                            : "linear-gradient(to right bottom, #eff2ff, #f0e5e9)",
                        }}
                      >
                        <CardActionArea
                          onClick={function () {
                            //If it's selected we unselect and if its unselected we select
                            console.log("Clicked on ID", nft.tokenId);
                            var newSelectedNFTs = selectedNFTs.slice();
                            var index = newSelectedNFTs.findIndex(
                              (element) =>
                                element ==
                                BigNumber.from(nft.tokenId).toNumber()
                            );
                            if (index == -1) {
                              newSelectedNFTs.push(
                                BigNumber.from(nft.tokenId).toNumber()
                              );
                            } else {
                              newSelectedNFTs.splice(index, 1);
                            }
                            console.log(newSelectedNFTs);
                            setSelectedNFTs(newSelectedNFTs);
                          }}
                        >
                          <div className="flex flex-col items-center p-1">
                            {nft.media ? (
                              <Image
                                loader={() => nft.media.mediaCollection.low.url}
                                src={nft.media.mediaCollection.low.url}
                                height="100"
                                width="100"
                                className="rounded-xl"
                              />
                            ) : (
                              <Box
                                className="flex m-2 justify-center items-center w-[100px] h-[100px]"
                                sx={{
                                  fontFamily: "Monospace",
                                  fontSize: "caption",
                                }}
                              >
                                No Image
                              </Box>
                            )}
                            <Box
                              className="mt-1"
                              sx={{
                                fontFamily: "Monospace",
                                fontSize: "caption",
                              }}
                            >
                              {BigNumber.from(nft.tokenId).toNumber()}
                            </Box>
                          </div>
                        </CardActionArea>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Box
                sx={{
                  fontFamily: "Monospace",
                  fontSize: "subtitle2.fontSize",
                  fontWeight: "bold",
                }}
                className="flex mt-4 justify-center items-center text-center"
              >
                {"Pool has no " + nftName + "'s left."}
              </Box>
            ))}
        </div>
        {loadingPriceQuote && <Loading className="m-12" size="xl" />}
        {priceQuote && (
          <div className="flex flex-col items-center text-center justify-center p-4 m-4 rounded-3xl bg-black/5 shadow-lg">
            <Box
              className="mb-4"
              sx={{
                fontFamily: "Monospace",
                fontSize: "subtitle2.fontSize",
                fontWeight: "bold",
              }}
            >
              Your buy quote
            </Box>
            <div className="flex flex-row w-full justify-center items-center m-2">
              <Divider style={{ width: "100%" }}>
                {nftName && (
                  <Chip
                    label={
                      <Box
                        sx={{
                          fontFamily: "Monospace",
                          fontSize: "subtitle2.fontSize",
                          fontWeight: "bold",
                        }}
                      >
                        {nftName ? amount + " " + nftName : "?"}
                      </Box>
                    }
                    variant="outlined"
                    component="a"
                    clickable
                    target="_blank"
                    href={
                      isConnected
                        ? chain.id == 1
                          ? "https://etherscan.io/address/" + nftAddress
                          : "https://sepolia.etherscan.io/address/" + nftAddress
                        : "https://sepolia.etherscan.io/address/" + nftAddress
                    }
                  />
                )}
              </Divider>
            </div>
            <Box
              className="m-4"
              sx={{
                fontFamily: "Monospace",
                fontSize: "h6.fontSize",
                fontWeight: "bold",
              }}
            >
              {formatUnits(priceQuote.price, 18)} ETH
            </Box>
            {priceQuote.priceImpact != undefined && (
              <Box
                className="m-1"
                sx={{
                  fontFamily: "Monospace",
                  fontSize: "subtitle1.fontSize",
                }}
              >
                Price Impact: {priceQuote.priceImpact / 100}%
              </Box>
            )}
          </div>
        )}
        <div className="flex flex-row m-6 w-8/12 md:w-6/12">
          <Button
            primary
            fill="horizontal"
            size="large"
            disabled={buyLoading}
            color="#063970"
            onClick={async function () {
              if (!isConnected) {
                dispatch({
                  type: "info",
                  message: "Connect your wallet first",
                  title: "Connect",
                  position: "bottomL",
                });
                return;
              }
              setBuyLoading(true);
              try {
                const tx = await wethGatewaySigner.buy(
                  poolAddress,
                  selectingNFTs ? selectedNFTs : priceQuote.exampleNFTs,
                  priceQuote.price,
                  {
                    value: priceQuote.price,
                  }
                );
                await tx.wait(1);
                handleBuySuccess();
              } catch (error) {
                console.log(error);
              } finally {
                setBuyLoading(false);
              }
            }}
            label={
              <div className="flex justify-center">
                {buyLoading ? (
                  <Spinner color={"black"} size="small" />
                ) : (
                  <Box
                    sx={{
                      fontFamily: "Monospace",
                      fontSize: "subtitle2.fontSize",
                      fontWeight: "bold",
                      letterSpacing: 2,
                    }}
                  >
                    {"BUY " + amount + " " + (nftName ? nftName : "NFTs")}
                  </Box>
                )}
              </div>
            }
          />
        </div>
      </div>
      {poolAddress && (
        <div className="flex flex-col items-center justify-center">
          <Table
            shadow={false}
            bordered={false}
            aria-label="Trading Pool Activity"
            css={{
              height: "auto",
              width: "60vw",
              fontFamily: "Monospace",
            }}
          >
            <Table.Header>
              <Table.Column>Type</Table.Column>
              <Table.Column>Date</Table.Column>
              <Table.Column>Amount</Table.Column>
              <Table.Column>Price</Table.Column>
            </Table.Header>
            <Table.Body>
              {poolHistory.map((data, i) => (
                <Table.Row key={i}>
                  <Table.Cell>
                    {data.type.charAt(0).toUpperCase() + data.type.slice(1)}
                  </Table.Cell>
                  <Table.Cell>
                    {timeago.format(data.timestamp * 1000)}
                  </Table.Cell>
                  <Table.Cell>{data.nftIds.length}</Table.Cell>
                  <Table.Cell>
                    {formatUnits(data.price, 18) + " ETH"}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
            <Table.Pagination
              noMargin
              color={"secondary"}
              align="center"
              rowsPerPage={5}
              onPageChange={(page) => console.log({ page })}
            />
          </Table>
        </div>
      )}
    </div>
  );
}

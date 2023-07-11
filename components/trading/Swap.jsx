import { useNotification, Typography, Tooltip } from "@web3uikit/core";
import contractAddresses from "../../contractAddresses.json";
import { HelpCircle } from "@web3uikit/icons";
import {
  useAccount,
  useNetwork,
  useContract,
  useSigner,
  useProvider,
  useBalance,
} from "wagmi";
import Autocomplete from "@mui/material/Autocomplete";
import { getNFTImage } from "../../helpers/getNFTImage.js";
import TextField from "@mui/material/TextField";
import { getAddressNFTs } from "../../helpers/getAddressNFTs.js";
import Box from "@mui/material/Box";
import Image from "next/image";
import { getTradingNFTCollections } from "../../helpers/getTradingNFTCollections.js";
import Chip from "@mui/material/Chip";
import { ethers } from "ethers";
import { getSwapExactQuote } from "../../helpers/getSwapExactQuote.js";
import { getSwapQuote } from "../../helpers/getSwapQuote.js";
import { Input, Loading } from "@nextui-org/react";
import { Button, Spinner } from "grommet";
import Card from "@mui/material/Card";
import { CardActionArea } from "@mui/material";
import { formatUnits } from "@ethersproject/units";
import { BigNumber } from "@ethersproject/bignumber";
import { useState, useEffect } from "react";
import { Divider } from "@mui/material";
import ArrowDownwardOutlinedIcon from "@mui/icons-material/ArrowDownwardOutlined";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import tradingPoolFactoryContract from "../../contracts/TradingPoolFactory.json";
import swapRouterContract from "../../contracts/SwapRouter.json";
import erc721 from "../../contracts/erc721.json";
import erc20 from "../../contracts/erc20.json";
import wethGateway from "../../contracts/WETHGateway.json";

export default function Swap() {
  const SELECTED_COLOR = "#d2c6d2";
  const { chain } = useNetwork();
  const provider = useProvider();
  const { data: signer } = useSigner();
  const { address, isConnected } = useAccount();
  const [availableBuyPoolNFTs, setAvailableBuyPoolNFTs] = useState([]);
  const [tradingCollections, setTradingCollections] = useState([]);
  const [approvedNFT, setApprovedNFT] = useState(false);
  const [sellNFTAddress, setSellNFTAddress] = useState("");
  const [buyNFTAddress, setBuyNFTAddress] = useState("");
  const [sellPoolAddress, setSellPoolAddress] = useState("");
  const [buyPoolAddress, setBuyPoolAddress] = useState("");
  const [buyAmount, setBuyAmount] = useState(0);
  const [sellAmount, setSellAmount] = useState(0);
  const [selectingBuyNFTs, setSelectingBuyNFTs] = useState(false);
  const [selectedBuyNFTs, setSelectedBuyNFTs] = useState([]);
  const [selectingSellNFTs, setSelectingSellNFTs] = useState(false);
  const [selectedSellNFTs, setSelectedSellNFTs] = useState([]);
  const [userNFTs, setUserNFTs] = useState([]);
  const [priceQuote, setPriceQuote] = useState();
  const [loadingPriceQuote, setLoadingPriceQuote] = useState(false);
  const [swapLoading, setSwapLoading] = useState(false);
  const [nftApprovalLoading, setNFTApprovalLoading] = useState(false);
  const [sellNFTName, setSellNFTName] = useState("");
  const [buyNFTName, setBuyNFTName] = useState("");
  const [buyCollectionThumbnailURL, setBuyCollectionThumbnailURL] =
    useState("");
  const [sellCollectionThumbnailURL, setSellCollectionThumbnailURL] =
    useState("");
  const [buyNFTImages, setBuyNFTImages] = useState([]);
  const [sellNFTImages, setSellNFTImages] = useState([]);
  const { data: ethBalance } = useBalance({
    addressOrName: address,
  });

  const dispatch = useNotification();

  var addresses = contractAddresses[1];
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
      isConnected ? chain.id : 1
    );
    setAvailableBuyPoolNFTs(addressNFTs);
    console.log("availableBuyPoolNFTs", addressNFTs);
  }

  async function getTradingCollections(chain) {
    // Get user NFT assets
    const tradingCollections = await getTradingNFTCollections(chain);
    setTradingCollections(tradingCollections);
    console.log("tradingCollections", tradingCollections);
  }

  async function getNFTAllowance(collection) {
    const nftContract = new ethers.Contract(collection, erc721, provider);
    const allowed = await nftContract.isApprovedForAll(
      address,
      addresses.WETHGateway
    );

    console.log("Got nft allowed:", allowed);

    setApprovedNFT(allowed);
  }

  async function getPriceQuote(
    buyAmount,
    sellAmount,
    buyPoolAddress,
    sellPoolAddress
  ) {
    console.log("Getting swap quote");

    if (buyAmount > 0 && sellAmount > 0 && buyPoolAddress && sellPoolAddress) {
      setPriceQuote();
      setLoadingPriceQuote(true);
      var newSwapQuote;
      if (selectingBuyNFTs) {
        console.log("selectedBuyNFTs", selectedBuyNFTs);
        newSwapQuote = await getSwapExactQuote(
          chain.id,
          selectedBuyNFTs,
          sellAmount,
          buyPoolAddress,
          sellPoolAddress
        );
        console.log("getSwapExactQuote", newSwapQuote);
      } else {
        newSwapQuote = await getSwapQuote(
          isConnected ? chain.id : 1,
          buyAmount,
          sellAmount,
          buyPoolAddress,
          sellPoolAddress
        );
        console.log("newSwapQuote", newSwapQuote);
      }

      // Warn user if the quote couldnt be fully generated
      if (newSwapQuote.sellLps.length < sellAmount) {
        dispatch({
          type: "warning",
          message: "Pool can only buy " + newSwapQuote.sellLps.length + " NFTs",
          title: "Swap Quote Warning",
          position: "bottomL",
        });
      } else if (
        newSwapQuote.sellLps.length > 0 &&
        newSwapQuote.buyLps.length > 0
      ) {
        setPriceQuote(newSwapQuote);
      }

      setLoadingPriceQuote(false);
      setSellAmount(newSwapQuote.sellLps.length);
      // Fill the selected NFTs array
      var newSelectedSellNFTs = [];
      if (selectingSellNFTs) {
        // Remove any NFTs that can't be sold as per the quote
        newSelectedSellNFTs = selectedSellNFTs.slice(
          0,
          newSwapQuote.sellLps.length
        );
      } else {
        for (let index = 0; index < newSwapQuote.sellLps.length; index++) {
          if (index >= userNFTs.length) {
            break;
          }
          newSelectedSellNFTs.push(
            BigNumber.from(userNFTs[index].tokenId).toNumber()
          );
        }
      }
      if (newSelectedSellNFTs.length != selectedSellNFTs.length) {
        console.log("newSelectedNFTs", newSelectedSellNFTs);
        setSelectedSellNFTs(newSelectedSellNFTs);
      }

      // Get the sell NFT images
      const sellNFTImages = await Promise.all(
        newSelectedSellNFTs.map(async (nft) => {
          return await getNFTImage(sellNFTAddress, nft, chain.id);
        })
      );
      setSellNFTImages(sellNFTImages);

      setBuyAmount(newSwapQuote.buyLps.length);
      // Fill the selected NFTs array
      var newSelectedBuyNFTs = [];
      if (selectingBuyNFTs) {
        // Remove any NFTs that can't be sold as per the quote
        newSelectedBuyNFTs = selectedBuyNFTs.slice(
          0,
          newSwapQuote.buyLps.length
        );
      } else {
        for (let index = 0; index < newSwapQuote.buyLps.length; index++) {
          if (index > availableBuyPoolNFTs.length) {
            break;
          }
          newSelectedBuyNFTs.push(
            BigNumber.from(availableBuyPoolNFTs[index].tokenId).toNumber()
          );
        }
      }
      if (newSelectedBuyNFTs.length != selectedBuyNFTs.length) {
        console.log("newSelectedBuyNFTs", newSelectedBuyNFTs);
        setSelectedBuyNFTs(newSelectedBuyNFTs);
      }

      // Get the sell NFT images
      const buyNFTImages = await Promise.all(
        newSelectedBuyNFTs.map(async (nft) => {
          return await getNFTImage(buyNFTAddress, nft, chain.id);
        })
      );
      setBuyNFTImages(buyNFTImages);
    } else {
      setPriceQuote();
    }
  }

  async function getCollectionNFTs(collection) {
    // Get user NFT assets
    const addressNFTs = await getAddressNFTs(
      address,
      collection,
      isConnected ? chain.id : 1
    );
    console.log("addressNsellCollectionNFTs", addressNFTs);
    setUserNFTs(addressNFTs);
  }

  async function getSellNFTName(collection) {
    const nftContract = new ethers.Contract(collection, erc721, provider);
    const name = await nftContract.name();

    console.log("Got nft name:", name);

    if (name) {
      setSellNFTName(name);
    } else {
      setSellNFTName("");
    }
  }

  async function getBuyNFTName(collection) {
    const nftContract = new ethers.Contract(collection, erc721, provider);
    const name = await nftContract.name();

    console.log("Got nft name:", name);

    if (name) {
      setBuyNFTName(name);
    } else {
      setBuyNFTName("");
    }
  }

  async function getBuyCollectionThumbnailURL(collection) {
    const updatedURL = await getNFTImage(collection, 1, chain.id);
    console.log("updatedURL", updatedURL);
    setBuyCollectionThumbnailURL(updatedURL);
  }

  async function getSellCollectionThumbnailURL(collection) {
    const updatedURL = await getNFTImage(collection, 1, chain.id);
    console.log("updatedURL", updatedURL);
    setSellCollectionThumbnailURL(updatedURL);
  }

  async function getSellTradingPoolAddress(collection) {
    // Get trading pool for collection
    const updatedPool = (
      await factoryProvider.getTradingPool(collection, addresses.ETH.address)
    ).toString();

    console.log("updatedpool", updatedPool);
    getSellNFTName(collection);
    setSellPoolAddress(updatedPool);
    getPriceQuote(buyAmount, sellAmount, buyPoolAddress, updatedPool);
    if (isConnected) {
      getNFTAllowance(collection, updatedPool);
    }
  }

  async function getBuyTradingPoolAddress(collection) {
    // Get trading pool for collection
    const updatedPool = (
      await factoryProvider.getTradingPool(collection, addresses.ETH.address)
    ).toString();

    console.log("updatedpool", updatedPool);
    getBuyNFTName(collection);
    setBuyPoolAddress(updatedPool);
    getPriceQuote(buyAmount, sellAmount, updatedPool, sellPoolAddress);
    getAvailableNFTs(updatedPool, collection);
  }

  useEffect(() => {
    const chain = isConnected ? chain.id : 1;
    addresses = contractAddresses[chain];
    getTradingCollections(chain);

    console.log("useEffect called");
  }, [isConnected, chain]);

  useEffect(() => {
    setBuyAmount(selectedBuyNFTs.length);
    if (sellAmount && buyPoolAddress && sellPoolAddress) {
      getPriceQuote(
        selectedBuyNFTs.length,
        sellAmount,
        buyPoolAddress,
        sellPoolAddress
      );
    }
  }, [selectedBuyNFTs]);

  useEffect(() => {
    setSellAmount(selectedSellNFTs.length);
    if (buyAmount && buyPoolAddress && sellPoolAddress) {
      getPriceQuote(
        buyAmount,
        selectedSellNFTs.length,
        buyPoolAddress,
        sellPoolAddress
      );
    }
  }, [selectedSellNFTs]);

  const handleNFTApprovalSuccess = async function () {
    setApprovedNFT(true);
    dispatch({
      type: "success",
      message: "You just approved your NFTs.",
      title: "Approval Successful!",
      position: "bottomL",
    });
  };

  const handleSwapSuccess = async function () {
    setPriceQuote();
    dispatch({
      type: "success",
      message: "You just swapped your NFTs.",
      title: "Swap Successful!",
      position: "bottomL",
    });
  };

  const handleSellNFTAddressChange = (_event, value) => {
    console.log("handleSellNFTAddressChange", value);
    setSellAmount(0);
    setSelectedSellNFTs([]);
    if (ethers.utils.isAddress(value)) {
      setSellNFTAddress(value);
      getCollectionNFTs(value);
      getSellTradingPoolAddress(value);
      getSellCollectionThumbnailURL(value);
    } else if (
      tradingCollections.map((collection) => collection.name).includes(value)
    ) {
      const nftAddress = tradingCollections.find(
        (collection) => collection.name == value
      ).address;
      setSellNFTAddress(nftAddress);
      getCollectionNFTs(nftAddress);
      getSellCollectionThumbnailURL(nftAddress);
      getSellTradingPoolAddress(nftAddress);
    } else {
      console.log("Invalid NFT Address");
      if (value == "") {
        setSellNFTAddress("");
      } else {
        setSellNFTAddress("0x");
      }
      setPriceQuote();
      setSellCollectionThumbnailURL("");
      setSellPoolAddress("");
      setSellNFTName("");
    }
  };

  const handleBuyNFTAddressChange = (_event, value) => {
    console.log("handleBuyNFTAddressChange", value);
    setBuyAmount(0);
    setSelectedBuyNFTs([]);
    if (ethers.utils.isAddress(value)) {
      setBuyNFTAddress(value);
      getBuyTradingPoolAddress(value);
      getBuyCollectionThumbnailURL(value);
    } else if (
      tradingCollections.map((collection) => collection.name).includes(value)
    ) {
      const nftAddress = tradingCollections.find(
        (collection) => collection.name == value
      ).address;
      setBuyNFTAddress(nftAddress);
      getBuyTradingPoolAddress(nftAddress);
      getBuyCollectionThumbnailURL(nftAddress);
    } else {
      console.log("Invalid NFT Address");
      if (value == "") {
        setBuyNFTAddress("");
      } else {
        setBuyNFTAddress("0x");
      }
      setPriceQuote();
      setBuyCollectionThumbnailURL("");
      setBuyPoolAddress("");
      setBuyNFTName("");
    }
  };

  const handleSellAmountInputChange = (event) => {
    setSelectingSellNFTs(false);
    console.log("handleAmountInputChange", event.target.value);
    if (isConnected && event.target.value > userNFTs.length) {
      setSellAmount(userNFTs.length);
      dispatch({
        type: "warning",
        message: "You only own " + userNFTs.length + " " + sellNFTName + "s",
        title: "Amount too high!",
        position: "bottomL",
      });
    } else {
      setSellAmount(event.target.value);
      try {
        getPriceQuote(
          buyAmount,
          event.target.value,
          buyPoolAddress,
          sellPoolAddress
        );
      } catch (error) {
        setPriceQuote();
        console.log(error);
      }
    }
  };

  const handleBuyAmountInputChange = (event) => {
    setSelectingBuyNFTs(false);
    console.log("handleAmountInputChange", event.target.value);
    if (event.target.value > availableBuyPoolNFTs.length) {
      setBuyAmount(availableBuyPoolNFTs.length);
      dispatch({
        type: "warning",
        message:
          "Pool only has " +
          availableBuyPoolNFTs.length +
          " " +
          buyNFTName +
          "s available",
        title: "Amount too high!",
        position: "bottomL",
      });
    } else {
      setBuyAmount(event.target.value);
      try {
        getPriceQuote(
          event.target.value,
          sellAmount,
          buyPoolAddress,
          sellPoolAddress
        );
      } catch (error) {
        setPriceQuote();
        console.log(error);
      }
    }
  };

  return (
    <div className="flex flex-col items-center text-center w-full py-8 md:w-fit justify-center m-4 rounded-3xl bg-black/5 shadow-lg">
      <div className="flex flex-col lg:flex-row items-center justify-center m-2 md:m-8">
        <div className="flex flex-col items-center text-center justify-center p-8 m-4 w-full rounded-3xl bg-black/5 shadow-lg">
          <div className="flex flex-col mb-2">
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: "h5.fontSize",
                fontWeight: "bold",
                letterSpacing: 4,
              }}
            >
              From
            </Box>
          </div>
          <div className="flex flex-col my-4">
            <div className="flex flex-row items-center space-x-4">
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
                sx={{
                  minWidth: { xs: 235, sm: 250, md: 270, lg: 260, xl: 280 },
                }}
                onInputChange={handleSellNFTAddressChange}
                renderOption={(props, option, state) => (
                  <div className="flex flex-row m-4" {...props}>
                    <div className="flex w-3/12 h-[50px]">
                      {tradingCollections.find(
                        (collection) => collection.name == option
                      ).image && (
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
              {sellCollectionThumbnailURL && (
                <div className="flex ml-4">
                  <Image
                    loader={() => sellCollectionThumbnailURL}
                    src={sellCollectionThumbnailURL}
                    alt="NFT Thumbnail"
                    height="60"
                    width="60"
                    className="rounded-xl"
                  />
                </div>
              )}
            </div>
            {sellNFTAddress && (
              <div className="flex flex-row mt-1 justify-center">
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "caption.fontSize",
                    fontWeight: "bold",
                    letterSpacing: 2,
                  }}
                >
                  {sellPoolAddress
                    ? "Pool: " +
                      sellPoolAddress.slice(0, 5) +
                      ".." +
                      sellPoolAddress.slice(-2)
                    : "No pool found"}
                </Box>
              </div>
            )}
          </div>
          {sellNFTAddress && (
            <div className="flex flex-col justify-center">
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
                        Sell
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
                    value={sellAmount}
                    onChange={handleSellAmountInputChange}
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
                        setSelectedSellNFTs([]);
                        setSelectingSellNFTs(!selectingSellNFTs);
                      }}
                      disabled={!sellNFTAddress}
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
              {selectingSellNFTs &&
                (userNFTs.length > 0 ? (
                  <div className="flex flex-row m-4 grid grid-cols-3 lg:grid-cols-4 overflow-auto max-h-[24rem]">
                    {userNFTs.map((nft, _) => (
                      <div
                        key={BigNumber.from(nft.tokenId).toNumber()}
                        className="flex m-2 items-center justify-center max-w-[300px]"
                      >
                        <Card
                          sx={{
                            borderRadius: 4,
                            background: selectedSellNFTs.includes(
                              BigNumber.from(nft.tokenId).toNumber()
                            )
                              ? "linear-gradient(to right bottom, #fccb90 0%, #d57eeb 100%)"
                              : "linear-gradient(to right bottom, #eff2ff, #f0e5e9)",
                          }}
                        >
                          <CardActionArea
                            onClick={function () {
                              //If it's selected we unselect and if its unselected we select
                              var newSelectedSellNFTs =
                                selectedSellNFTs.slice();
                              var index = newSelectedSellNFTs.findIndex(
                                (element) =>
                                  element ==
                                  BigNumber.from(nft.tokenId).toNumber()
                              );
                              if (index == -1) {
                                newSelectedSellNFTs.push(
                                  BigNumber.from(nft.tokenId).toNumber()
                                );
                              } else {
                                newSelectedSellNFTs.splice(index, 1);
                              }
                              setSelectedSellNFTs(newSelectedSellNFTs);
                            }}
                          >
                            <div className="flex flex-col items-center p-1">
                              {nft.media[0] ? (
                                <Image
                                  loader={() => nft.media[0].gateway}
                                  src={nft.media[0].gateway}
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
                ) : (
                  <Box
                    sx={{
                      fontFamily: "Monospace",
                      fontSize: "subtitle2.fontSize",
                      fontWeight: "bold",
                    }}
                    className="flex mt-4 justify-center items-center text-center"
                  >
                    {"Couldn't find any " + sellNFTName + "'s in your wallet"}
                  </Box>
                ))}
            </div>
          )}
        </div>
        <div className="hidden lg:flex items-center m-2">
          <ArrowForwardOutlinedIcon />
        </div>
        <div className="flex lg:hidden items-center m-2">
          <ArrowDownwardOutlinedIcon />
        </div>
        <div className="flex flex-col items-center text-center justify-center p-8 m-4 w-full rounded-3xl bg-black/5 shadow-lg">
          <div className="flex flex-col mb-2">
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: "h5.fontSize",
                fontWeight: "bold",
                letterSpacing: 4,
              }}
            >
              To
            </Box>
          </div>
          <div className="flex flex-col my-4">
            <div className="flex flex-row items-center space-x-4">
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
                sx={{
                  minWidth: { xs: 235, sm: 250, md: 270, lg: 260, xl: 280 },
                }}
                onInputChange={handleBuyNFTAddressChange}
                renderOption={(props, option, state) => (
                  <div className="flex flex-row m-4" {...props}>
                    <div className="flex w-3/12 h-[50px]">
                      {tradingCollections.find(
                        (collection) => collection.name == option
                      ).image && (
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
              {buyCollectionThumbnailURL && (
                <div className="flex ml-4">
                  <Image
                    loader={() => buyCollectionThumbnailURL}
                    src={buyCollectionThumbnailURL}
                    alt="NFT Thumbnail"
                    height="60"
                    width="60"
                    className="rounded-xl"
                  />
                </div>
              )}
            </div>
            {buyPoolAddress && (
              <div className="flex flex-row mt-1 justify-center">
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "caption.fontSize",
                    fontWeight: "bold",
                    letterSpacing: 2,
                  }}
                >
                  {buyPoolAddress
                    ? "Pool: " +
                      buyPoolAddress.slice(0, 5) +
                      ".." +
                      buyPoolAddress.slice(-2)
                    : "No pool found"}
                </Box>
              </div>
            )}
          </div>
          {buyNFTAddress && (
            <div className="flex flex-col justify-center">
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
                    value={buyAmount}
                    onChange={handleBuyAmountInputChange}
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
                      color={SELECTED_COLOR}
                      onClick={() => {
                        // Reset selected NFTs
                        setSelectedBuyNFTs([]);
                        setSelectingBuyNFTs(!selectingBuyNFTs);
                      }}
                      disabled={!buyNFTAddress}
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
              {selectingBuyNFTs &&
                (availableBuyPoolNFTs.length > 0 ? (
                  <div className="flex flex-col justify-center items-center m-4">
                    <div className="flex flex-row items-center text-center justify-center">
                      <Box
                        sx={{
                          fontFamily: "Monospace",
                          fontSize: "caption.fontSize",
                          fontWeight: "bold",
                          color: "blue",
                        }}
                      >
                        {
                          "Selecting specific NFTs doesn't guarantee the cheapest buy price."
                        }
                      </Box>
                    </div>
                    <div className="flex flex-row m-4 grid grid-cols-3 lg:grid-cols-4 overflow-auto max-h-[24rem]">
                      {availableBuyPoolNFTs.map((nft, _) => (
                        <div
                          key={BigNumber.from(nft.tokenId).toNumber()}
                          className="flex m-2 items-center justify-center max-w-[300px]"
                        >
                          <Card
                            sx={{
                              borderRadius: 4,
                              background: selectedBuyNFTs.includes(
                                BigNumber.from(nft.tokenId).toNumber()
                              )
                                ? "linear-gradient(to right bottom, #fccb90 0%, #d57eeb 100%)"
                                : "linear-gradient(to right bottom, #eff2ff, #f0e5e9)",
                            }}
                          >
                            <CardActionArea
                              onClick={function () {
                                //If it's selected we unselect and if its unselected we select
                                var newSelectedBuyNFTs =
                                  selectedBuyNFTs.slice();
                                var index = newSelectedBuyNFTs.findIndex(
                                  (element) =>
                                    element ==
                                    BigNumber.from(nft.tokenId).toNumber()
                                );
                                if (index == -1) {
                                  newSelectedBuyNFTs.push(
                                    BigNumber.from(nft.tokenId).toNumber()
                                  );
                                } else {
                                  newSelectedBuyNFTs.splice(index, 1);
                                }
                                setSelectedBuyNFTs(newSelectedBuyNFTs);
                              }}
                            >
                              <div className="flex flex-col items-center p-1">
                                {nft.media[0] ? (
                                  <Image
                                    loader={() => nft.media[0].gateway}
                                    src={nft.media[0].gateway}
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
                    {"Pool has no " + buyNFTName + "'s left."}
                  </Box>
                ))}
            </div>
          )}
        </div>
      </div>
      {loadingPriceQuote && <Loading className="m-12" size="xl" />}
      {priceQuote && (
        <div className="flex flex-col lg:flex-row items-center justify-center">
          <div className="flex flex-col items-center text-center justify-center p-4 m-4 rounded-3xl bg-black/5 shadow-lg">
            <Box
              className="mb-4"
              sx={{
                fontFamily: "Monospace",
                fontSize: "subtitle2.fontSize",
                fontWeight: "bold",
              }}
            >
              Your swap quote
            </Box>
            <div className="flex flex-row w-full justify-center items-center m-2">
              <Divider style={{ width: "100%" }}>
                <Chip
                  label={
                    <Box
                      sx={{
                        fontFamily: "Monospace",
                        fontSize: "subtitle2.fontSize",
                        fontWeight: "bold",
                      }}
                    >
                      {sellNFTName ? sellAmount + " " + sellNFTName : "?"}
                    </Box>
                  }
                  variant="outlined"
                  component="a"
                  clickable={sellNFTAddress != ""}
                  target="_blank"
                  href={
                    isConnected
                      ? sellNFTAddress != ""
                        ? chain.id == 1
                          ? "https://etherscan.io/address/" + sellNFTAddress
                          : "https://sepolia.etherscan.io/address/" +
                            sellNFTAddress
                        : ""
                      : "https://sepolia.etherscan.io/address/" + sellNFTAddress
                  }
                />
                <ArrowForwardOutlinedIcon className="mx-1" />
                <Chip
                  label={
                    <Box
                      sx={{
                        fontFamily: "Monospace",
                        fontSize: "subtitle2.fontSize",
                        fontWeight: "bold",
                      }}
                    >
                      {buyNFTName ? buyAmount + " " + buyNFTName : "?"}
                    </Box>
                  }
                  variant="outlined"
                  component="a"
                  clickable={buyNFTAddress != ""}
                  target="_blank"
                  href={
                    isConnected
                      ? buyNFTAddress != ""
                        ? chain.id == 1
                          ? "https://etherscan.io/address/" + sellNFTAddress
                          : "https://sepolia.etherscan.io/address/" +
                            sellNFTAddress
                        : ""
                      : "https://sepolia.etherscan.io/address/" + sellNFTAddress
                  }
                />
              </Divider>
            </div>
            <div className="flex flex-row m-4 items-left">
              <Box
                className="m-2"
                sx={{
                  fontFamily: "Monospace",
                  fontSize: "h6.fontSize",
                  fontWeight: "bold",
                  color: BigNumber.from(priceQuote.buyPrice).gt(
                    priceQuote.sellPrice
                  )
                    ? "#e60000"
                    : "green",
                }}
              >
                {BigNumber.from(priceQuote.buyPrice).gt(priceQuote.sellPrice)
                  ? "− " +
                    Number(
                      formatUnits(
                        BigNumber.from(priceQuote.buyPrice).sub(
                          priceQuote.sellPrice
                        ),
                        18
                      )
                    ).toPrecision(6) +
                    " ETH"
                  : "＋ " +
                    Number(
                      formatUnits(
                        BigNumber.from(priceQuote.sellPrice).sub(
                          priceQuote.buyPrice
                        ),
                        18
                      )
                    ).toPrecision(6) +
                    " ETH"}
              </Box>
              <Tooltip
                content="The 'change' resulting from the swap. Negative you pay, positive you receive."
                position="right"
                minWidth={200}
              >
                <HelpCircle fontSize="20px" color="#000000" />
              </Tooltip>
            </div>
            {priceQuote.buyPriceImpact != undefined && (
              <Box
                className="m-1"
                sx={{
                  fontFamily: "Monospace",
                  fontSize: "subtitle1.fontSize",
                }}
              >
                {"Buy Side Impact: +" + priceQuote.buyPriceImpact / 100 + "%"}
              </Box>
            )}
            {priceQuote.sellPriceImpact != undefined && (
              <Box
                className="m-1"
                sx={{
                  fontFamily: "Monospace",
                  fontSize: "subtitle1.fontSize",
                }}
              >
                {"Sell Side Impact: -" + priceQuote.sellPriceImpact / 100 + "%"}
              </Box>
            )}
          </div>
          <div className="flex flex-col items-center">
            <div className="flex flex-col items-center text-center justify-center p-2 m-4 rounded-3xl bg-black/5 shadow-lg">
              <Typography variant="h4">From</Typography>
              <div className="grid grid-cols-2 gap-4 m-4">
                {sellNFTImages.map((imageUrl, index) => (
                  <div key={index} className="flex items-center justify-center">
                    <Image
                      loader={() => imageUrl}
                      src={imageUrl}
                      height="110"
                      width="110"
                      unoptimized={true}
                      className="rounded-2xl"
                    />
                  </div>
                ))}
              </div>
            </div>
            <ArrowDownwardOutlinedIcon />
            <div className="flex flex-col items-center text-center justify-center p-2 m-4 rounded-3xl bg-black/5 shadow-lg">
              <Typography variant="h4">To</Typography>
              <div className="grid grid-cols-2 gap-4 m-4">
                {buyNFTImages.map((imageUrl, index) => (
                  <div key={index} className="flex items-center justify-center">
                    <Image
                      loader={() => imageUrl}
                      src={imageUrl}
                      height="110"
                      width="110"
                      unoptimized={true}
                      className="rounded-2xl"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-row m-6 w-8/12 md:w-6/12">
        {!approvedNFT ? (
          <Button
            primary
            fill="horizontal"
            size="large"
            disabled={nftApprovalLoading || !sellNFTAddress || !isConnected}
            color="#063970"
            onClick={async function () {
              setNFTApprovalLoading(true);
              const nftContract = new ethers.Contract(
                sellNFTAddress,
                erc721,
                signer
              );
              try {
                const tx = await nftContract.setApprovalForAll(
                  addresses.WETHGateway,
                  true
                );
                await tx.wait(1);
                handleNFTApprovalSuccess();
              } catch (error) {
                console.log(error);
              } finally {
                setNFTApprovalLoading(false);
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
                  {isConnected
                    ? sellNFTName
                      ? "Approve " + sellNFTName
                      : "Approve NFT"
                    : "Connect Wallet"}
                </Box>
              </div>
            }
          />
        ) : (
          <Button
            primary
            fill="horizontal"
            size="large"
            disabled={swapLoading || !priceQuote || !isConnected}
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

              console.log("ethBalance: " + ethBalance);
              if (
                BigNumber.from(priceQuote.buyPrice)
                  .sub(priceQuote.sellPrice)
                  .gt(ethBalance.value)
              ) {
                dispatch({
                  type: "warning",
                  message: "Not enough ETH to pay for swap",
                  title: "Error",
                  position: "bottomL",
                });
                return;
              }
              setSwapLoading(true);
              console.log("Swapping...");
              var txValue = "0";
              if (
                BigNumber.from(priceQuote.buyPrice)
                  .sub(priceQuote.sellPrice)
                  .gt(0)
              ) {
                txValue = BigNumber.from(priceQuote.buyPrice)
                  .sub(priceQuote.sellPrice)
                  .toString();
                console.log("txValue: " + txValue);
              }
              console.log("txValue: " + txValue);
              console.log("buyPoolAddress: " + buyPoolAddress);
              console.log("sellPoolAddress: " + sellPoolAddress);
              console.log(
                "selectedBuyNFTs: ",
                selectingBuyNFTs ? selectedBuyNFTs : priceQuote.exampleBuyNFTs
              );
              console.log("priceQuote.buyPrice: ", priceQuote.buyPrice);
              console.log("selectedSellNFTs: ", selectedSellNFTs);
              console.log("priceQuote.sellLps: ", priceQuote.sellLps);
              console.log("priceQuote.sellPrice: ", priceQuote.sellPrice);
              try {
                let tx = await wethGatewaySigner.swap(
                  buyPoolAddress,
                  sellPoolAddress,
                  selectingBuyNFTs
                    ? selectedBuyNFTs
                    : priceQuote.exampleBuyNFTs,
                  priceQuote.buyPrice,
                  selectedSellNFTs,
                  priceQuote.sellLps,
                  priceQuote.sellPrice,
                  { value: txValue }
                );
                await tx.wait(1);
                handleSwapSuccess();
              } catch (error) {
                console.log(error);
              } finally {
                getPriceQuote(
                  buyAmount,
                  sellAmount,
                  buyPoolAddress,
                  sellPoolAddress
                );
                setSwapLoading(false);
              }
            }}
            label={
              <div className="flex justify-center">
                {swapLoading ? (
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
                    {isConnected ? "SWAP" : "Connect Wallet"}
                  </Box>
                )}
              </div>
            }
          />
        )}
      </div>
    </div>
  );
}

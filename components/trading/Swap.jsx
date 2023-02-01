import { useNotification, Typography, Tooltip } from "@web3uikit/core";
import contractAddresses from "../../contractAddresses.json";
import { HelpCircle } from "@web3uikit/icons";
import {
  useAccount,
  useNetwork,
  useContract,
  useSigner,
  useProvider,
} from "wagmi";
import Autocomplete from "@mui/material/Autocomplete";
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
import { Button, Select } from "grommet";
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

export default function Swap() {
  const SELECTED_COLOR = "#d2c6d2";
  const { chain } = useNetwork();
  const provider = useProvider();
  const { data: signer } = useSigner();
  const { address, isConnected } = useAccount();
  const [availableBuyPoolNFTs, setAvailableBuyPoolNFTs] = useState([]);
  const [tradingCollections, setTradingCollections] = useState([]);
  const [approvedToken, setApprovedToken] = useState(false);
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
  const [tokenApprovalLoading, setTokenApprovalLoading] = useState(false);
  const [nftApprovalLoading, setNFTApprovalLoading] = useState(false);
  const [sellNFTName, setSellNFTName] = useState("");
  const [buyNFTName, setBuyNFTName] = useState("");
  const [tokenBalance, setTokenBalance] = useState("");

  const dispatch = useNotification();

  const addresses =
    chain && chain.id in contractAddresses
      ? contractAddresses[chain.id]
      : contractAddresses["1"];

  const factoryProvider = useContract({
    contractInterface: tradingPoolFactoryContract.abi,
    addressOrName: addresses.TradingPoolFactory,
    signerOrProvider: provider,
  });

  const swapRouterSigner = useContract({
    contractInterface: swapRouterContract.abi,
    addressOrName: addresses.SwapRouter,
    signerOrProvider: signer,
  });

  async function getAvailableNFTs(pool, collection) {
    // Get user NFT assets
    const addressNFTs = await getAddressNFTs(pool, collection, chain.id);
    setAvailableBuyPoolNFTs(addressNFTs);
    console.log("availableBuyPoolNFTs", addressNFTs);
  }

  async function getTradingCollections() {
    // Get user NFT assets
    const tradingCollections = await getTradingNFTCollections(chain.id);
    setTradingCollections(tradingCollections);
    console.log("tradingCollections", tradingCollections);
  }

  async function getTokenDetails() {
    const tokenContract = new ethers.Contract(
      addresses.ETH.address,
      erc20,
      provider
    );

    const allowance = await tokenContract.allowance(
      address,
      addresses.SwapRouter
    );

    console.log("Got allowance:", allowance);

    if (!allowance.eq(BigNumber.from(0))) {
      setApprovedToken(true);
    } else {
      setApprovedToken(false);
    }

    const balance = await tokenContract.balanceOf(address);

    setTokenBalance(balance.toString());
  }

  async function getNFTAllowance(collection, pool) {
    const nftContract = new ethers.Contract(collection, erc721, provider);
    const allowed = await nftContract.isApprovedForAll(address, pool);

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

    if (
      buyAmount > 0 &&
      sellAmount > 0 &&
      buyPoolAddress &&
      sellPoolAddress &&
      buyPoolAddress != sellPoolAddress
    ) {
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
          chain.id,
          buyAmount,
          sellAmount,
          buyPoolAddress,
          sellPoolAddress
        );
        console.log("newSwapQuote", newSwapQuote);
      }

      // Warn user if the quote is couldnt be fully generated
      if (
        newSwapQuote.sellLps.length < sellAmount ||
        newSwapQuote.buyLps.length < buyAmount
      ) {
        dispatch({
          type: "warning",
          message:
            newSwapQuote.buyLps.length < buyAmount
              ? "Pool only has " +
                newSwapQuote.buyLps.length +
                " NFTs left to sell"
              : "Pool can only buy " + newSwapQuote.sellLps.length + " NFTs",
          title: "Swap Quote Warning",
          position: "bottomR",
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
          if (index > userNFTs.length) {
            break;
          }
          newSelectedSellNFTs.push(
            BigNumber.from(userNFTs[index].id.tokenId).toNumber()
          );
        }
      }
      if (newSelectedSellNFTs.length != selectedSellNFTs.length) {
        console.log("newSelectedNFTs", newSelectedSellNFTs);
        setSelectedSellNFTs(newSelectedSellNFTs);
      }

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
            BigNumber.from(availableBuyPoolNFTs[index].id.tokenId).toNumber()
          );
        }
      }
      if (newSelectedBuyNFTs.length != selectedBuyNFTs.length) {
        console.log("newSelectedBuyNFTs", newSelectedBuyNFTs);
        setSelectedBuyNFTs(newSelectedBuyNFTs);
      }
    } else {
      setPriceQuote();
    }
  }

  async function getCollectionNFTs(collection) {
    // Get user NFT assets
    const addressNFTs = await getAddressNFTs(address, collection, chain.id);
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

  async function getSellTradingPoolAddress(collection) {
    // Get trading pool for collection
    const updatedPool = (
      await factoryProvider.getTradingPool(collection, addresses.ETH.address)
    ).toString();

    console.log("updatedpool", updatedPool);
    getSellNFTName(collection);
    setSellPoolAddress(updatedPool);
    getNFTAllowance(collection, updatedPool);
    getPriceQuote(buyAmount, sellAmount, buyPoolAddress, updatedPool);
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
    if (isConnected && address) {
      getTradingCollections(chain.id);
      getTokenDetails();
    }
  }, [isConnected, address]);

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

  const handleTokenApprovalSuccess = async function () {
    setApprovedToken(true);
    dispatch({
      type: "success",
      message: "You just approved your tokens.",
      title: "Approval Successful!",
      position: "bottomR",
    });
  };

  const handleNFTApprovalSuccess = async function () {
    setApprovedNFT(true);
    dispatch({
      type: "success",
      message: "You just approved your NFTs.",
      title: "Approval Successful!",
      position: "bottomR",
    });
  };

  const handleSwapSuccess = async function () {
    dispatch({
      type: "success",
      message: "You just swapped your NFTs.",
      title: "Swap Successful!",
      position: "bottomR",
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
    } else if (
      tradingCollections
        .map((collection) => collection.contractMetadata.name)
        .includes(value)
    ) {
      const nftAddress = tradingCollections.find(
        (collection) => collection.contractMetadata.name == value
      ).address;
      setSellNFTAddress(nftAddress);
      getCollectionNFTs(nftAddress);
      getSellTradingPoolAddress(nftAddress);
    } else {
      console.log("Invalid NFT Address");
      if (value == "") {
        setSellNFTAddress("");
      } else {
        setSellNFTAddress("0x");
      }
      setPriceQuote();
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
    } else if (
      tradingCollections
        .map((collection) => collection.contractMetadata.name)
        .includes(value)
    ) {
      const nftAddress = tradingCollections.find(
        (collection) => collection.contractMetadata.name == value
      ).address;
      setBuyNFTAddress(nftAddress);
      getBuyTradingPoolAddress(nftAddress);
    } else {
      console.log("Invalid NFT Address");
      if (value == "") {
        setBuyNFTAddress("");
      } else {
        setBuyNFTAddress("0x");
      }
      setPriceQuote();
      setBuyPoolAddress("");
      setBuyNFTName("");
    }
  };

  const handleSellAmountInputChange = (event) => {
    setSelectingSellNFTs(false);
    console.log("handleAmountInputChange", event.target.value);
    try {
      setSellAmount(event.target.value);
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
  };

  const handleBuyAmountInputChange = (event) => {
    setSelectingBuyNFTs(false);
    console.log("handleAmountInputChange", event.target.value);
    try {
      setBuyAmount(event.target.value);
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
  };

  return (
    <div className="flex flex-col items-center">
      {sellPoolAddress == buyPoolAddress && sellPoolAddress != "" && (
        <div className="flex flex-row w-full justify-center">
          <Box
            sx={{
              fontFamily: "Monospace",
              fontSize: "subtitle1.fontSize",
              fontWeight: "bold",
            }}
          >
            Please select two different collections
          </Box>
        </div>
      )}
      <div className="flex flex-col md:flex-row items-center justify-center m-4">
        <div className="flex flex-col items-center text-center justify-center p-8 m-4 rounded-3xl bg-black/5 shadow-lg">
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
          <div className="flex flex-col m-4">
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
              options={tradingCollections.map(
                (option) => option.contractMetadata.name
              )}
              sx={{ minWidth: { xs: 260, sm: 350, md: 380 } }}
              onInputChange={handleSellNFTAddressChange}
              renderOption={(props, option, state) => (
                <div className="flex flex-row m-4" {...props}>
                  <div className="flex w-3/12 h-[50px]">
                    {tradingCollections.find(
                      (collection) => collection.contractMetadata.name == option
                    ).media.gateway && (
                      <Image
                        loader={() =>
                          tradingCollections.find(
                            (collection) =>
                              collection.contractMetadata.name == option
                          ).media.gateway
                        }
                        src={
                          tradingCollections.find(
                            (collection) =>
                              collection.contractMetadata.name == option
                          ).media.gateway
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
                      color={SELECTED_COLOR}
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
              {selectingSellNFTs && (
                <div className="flex flex-row m-4 grid grid-cols-3 lg:grid-cols-4 overflow-auto max-h-[24rem]">
                  {userNFTs.map((nft, _) => (
                    <div
                      key={BigNumber.from(nft.id.tokenId).toNumber()}
                      className="flex m-2 items-center justify-center max-w-[300px]"
                    >
                      <Card
                        sx={{
                          borderRadius: 4,
                          background: selectedSellNFTs.find(
                            (element) =>
                              element ==
                              BigNumber.from(nft.id.tokenId).toNumber()
                          )
                            ? "linear-gradient(to right bottom, #fccb90 0%, #d57eeb 100%)"
                            : "linear-gradient(to right bottom, #eff2ff, #f0e5e9)",
                        }}
                      >
                        <CardActionArea
                          onClick={function () {
                            //If it's selected we unselect and if its unselected we select
                            var newSelectedSellNFTs = selectedSellNFTs.slice();
                            var index = newSelectedSellNFTs.findIndex(
                              (element) =>
                                element ==
                                BigNumber.from(nft.id.tokenId).toNumber()
                            );
                            if (index == -1) {
                              newSelectedSellNFTs.push(
                                BigNumber.from(nft.id.tokenId).toNumber()
                              );
                            } else {
                              newSelectedSellNFTs.splice(index, 1);
                            }
                            setSelectedSellNFTs(newSelectedSellNFTs);
                          }}
                        >
                          <div className="flex flex-col items-center p-1">
                            {nft.metadata.image ? (
                              <Image
                                loader={() => nft.metadata.image}
                                src={nft.metadata.image}
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
                              {BigNumber.from(nft.id.tokenId).toNumber()}
                            </Box>
                          </div>
                        </CardActionArea>
                      </Card>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="hidden md:flex items-center m-2">
          <ArrowForwardOutlinedIcon />
        </div>
        <div className="flex md:hidden items-center m-2">
          <ArrowDownwardOutlinedIcon />
        </div>
        <div className="flex flex-col items-center text-center justify-center p-8 m-4 rounded-3xl bg-black/5 shadow-lg">
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
          <div className="flex flex-col m-4">
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
              options={tradingCollections.map(
                (option) => option.contractMetadata.name
              )}
              sx={{ minWidth: { xs: 260, sm: 350, md: 380 } }}
              onInputChange={handleBuyNFTAddressChange}
              renderOption={(props, option, state) => (
                <div className="flex flex-row m-4" {...props}>
                  <div className="flex w-3/12 h-[50px]">
                    {tradingCollections.find(
                      (collection) => collection.contractMetadata.name == option
                    ).media.gateway && (
                      <Image
                        loader={() =>
                          tradingCollections.find(
                            (collection) =>
                              collection.contractMetadata.name == option
                          ).media.gateway
                        }
                        src={
                          tradingCollections.find(
                            (collection) =>
                              collection.contractMetadata.name == option
                          ).media.gateway
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
              {selectingBuyNFTs && (
                <div className="flex flex-row m-4 grid grid-cols-3 lg:grid-cols-4 overflow-auto max-h-[24rem]">
                  {availableBuyPoolNFTs.map((nft, _) => (
                    <div
                      key={BigNumber.from(nft.id.tokenId).toNumber()}
                      className="flex m-2 items-center justify-center max-w-[300px]"
                    >
                      <Card
                        sx={{
                          borderRadius: 4,
                          background: selectedBuyNFTs.find(
                            (element) =>
                              element ==
                              BigNumber.from(nft.id.tokenId).toNumber()
                          )
                            ? "linear-gradient(to right bottom, #fccb90 0%, #d57eeb 100%)"
                            : "linear-gradient(to right bottom, #eff2ff, #f0e5e9)",
                        }}
                      >
                        <CardActionArea
                          onClick={function () {
                            //If it's selected we unselect and if its unselected we select
                            var newSelectedBuyNFTs = selectedBuyNFTs.slice();
                            var index = newSelectedBuyNFTs.findIndex(
                              (element) =>
                                element ==
                                BigNumber.from(nft.id.tokenId).toNumber()
                            );
                            if (index == -1) {
                              newSelectedBuyNFTs.push(
                                BigNumber.from(nft.id.tokenId).toNumber()
                              );
                            } else {
                              newSelectedBuyNFTs.splice(index, 1);
                            }
                            setSelectedBuyNFTs(newSelectedBuyNFTs);
                          }}
                        >
                          <div className="flex flex-col items-center p-1">
                            {nft.metadata.image ? (
                              <Image
                                loader={() => nft.metadata.image}
                                src={nft.metadata.image}
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
                              {BigNumber.from(nft.id.tokenId).toNumber()}
                            </Box>
                          </div>
                        </CardActionArea>
                      </Card>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
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
                  sellNFTAddress != ""
                    ? chain.id == 1
                      ? "https://etherscan.io/address/" + sellNFTAddress
                      : "https://goerli.etherscan.io/address/" + sellNFTAddress
                    : ""
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
                  buyNFTAddress != ""
                    ? chain.id == 1
                      ? "https://etherscan.io/address/" + buyNFTAddress
                      : "https://goerli.etherscan.io/address/" + buyNFTAddress
                    : ""
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
                  formatUnits(
                    BigNumber.from(priceQuote.buyPrice).sub(
                      priceQuote.sellPrice
                    ),
                    18
                  ) +
                  " WETH"
                : "＋ " +
                  formatUnits(
                    BigNumber.from(priceQuote.sellPrice).sub(
                      priceQuote.buyPrice
                    ),
                    18
                  ) +
                  " WETH"}
            </Box>
            <Tooltip
              content="The 'change' resulting from the swap. Negative you pay, positive you receive."
              position="right"
              minWidth={200}
            >
              <HelpCircle fontSize="20px" color="#000000" />
            </Tooltip>
          </div>
          {priceQuote.buyPriceImpact && (
            <Box
              className="m-1"
              sx={{
                fontFamily: "Monospace",
                fontSize: "subtitle1.fontSize",
              }}
            >
              Buy Side Impact: {priceQuote.buyPriceImpact / 100}%
            </Box>
          )}
          {priceQuote.sellPriceImpact && (
            <Box
              className="m-1"
              sx={{
                fontFamily: "Monospace",
                fontSize: "subtitle1.fontSize",
              }}
            >
              Sell Side Impact: {priceQuote.sellPriceImpact / 100}%
            </Box>
          )}
        </div>
      )}
      <div className="flex flex-row m-6 w-8/12 md:w-6/12">
        {!approvedNFT ? (
          <Button
            primary
            fill="horizontal"
            size="large"
            disabled={nftApprovalLoading || !sellNFTAddress}
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
                  sellPoolAddress,
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
                  {"Approve Sell Side NFTs"}
                </Box>
              </div>
            }
          />
        ) : priceQuote &&
          BigNumber.from(priceQuote.buyPrice).gt(priceQuote.sellPrice) &&
          !approvedToken ? (
          <Button
            primary
            fill="horizontal"
            size="large"
            color="#063970"
            disabled={tokenApprovalLoading}
            onClick={async function () {
              setTokenApprovalLoading(true);
              const tokenContract = new ethers.Contract(
                addresses.ETH.address,
                erc20,
                signer
              );
              try {
                const tx = await tokenContract.approve(
                  addresses.SwapRouter,
                  ethers.constants.MaxUint256
                );
                await tx.wait(1);
                handleTokenApprovalSuccess();
              } catch (error) {
                console.log(error);
              } finally {
                setTokenApprovalLoading(false);
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
                  {"Approve Change"}
                </Box>
              </div>
            }
          />
        ) : (
          <Button
            primary
            fill="horizontal"
            size="large"
            disabled={swapLoading || !priceQuote}
            color="#063970"
            onClick={async function () {
              if (
                BigNumber.from(priceQuote.buyPrice)
                  .sub(priceQuote.sellPrice)
                  .gt(tokenBalance)
              ) {
                dispatch({
                  type: "warning",
                  message: "Not enough WETH to pay for swap",
                  title: "Error",
                  position: "bottomR",
                });
                return;
              }
              setSwapLoading(true);
              console.log("Swapping...");
              console.log([
                buyPoolAddress,
                sellPoolAddress,
                selectingBuyNFTs ? selectedBuyNFTs : priceQuote.exampleBuyNFTs,
                priceQuote.buyPrice,
                selectedSellNFTs,
                priceQuote.sellLps,
                priceQuote.sellPrice,
              ]);
              try {
                let tx = await swapRouterSigner.swap(
                  buyPoolAddress,
                  sellPoolAddress,
                  selectingBuyNFTs
                    ? selectedBuyNFTs
                    : priceQuote.exampleBuyNFTs,
                  priceQuote.buyPrice,
                  selectedSellNFTs,
                  priceQuote.sellLps,
                  priceQuote.sellPrice
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
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "subtitle2.fontSize",
                    fontWeight: "bold",
                    letterSpacing: 2,
                  }}
                >
                  {"SWAP"}
                </Box>
              </div>
            }
          />
        )}
      </div>
    </div>
  );
}

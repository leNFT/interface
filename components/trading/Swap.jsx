import { useNotification, Typography } from "@web3uikit/core";
import contractAddresses from "../../contractAddresses.json";
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
import { getAddressNFTCollections } from "../../helpers/getAddressNFTCollections.js";
import Box from "@mui/material/Box";
import Image from "next/image";
import { getTradingNFTCollections } from "../../helpers/getTradingNFTCollections.js";
import Chip from "@mui/material/Chip";
import { ethers } from "ethers";
import { getSwapQuote } from "../../helpers/getSwapQuote.js";
import { Input } from "@nextui-org/react";
import { Button, Select } from "grommet";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
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
  const [approvedToken, setApprovedToken] = useState(false);
  const [approvedNFT, setApprovedNFT] = useState(false);
  const [sellNFTAddress, setSellNFTAddress] = useState("");
  const [buyNFTAddress, setBuyNFTAddress] = useState("");
  const [sellPoolAddress, setSellPoolAddress] = useState("");
  const [buyPoolAddress, setBuyPoolAddress] = useState("");
  const [buyAmount, setBuyAmount] = useState(0);
  const [sellAmount, setSellAmount] = useState(0);
  const [selectingNFTs, setSelectingNFTs] = useState(false);
  const [selectedNFTs, setSelectedNFTs] = useState([]);
  const [userSellCollectionNFTs, setUserSellCollectionNFTs] = useState([]);
  const [userNFTCollections, setUserNFTCollections] = useState([]);
  const [tradingCollections, setTradingCollections] = useState([]);
  const [priceQuote, setPriceQuote] = useState();
  const [swapLoading, setSwapLoading] = useState(false);
  const [tokenApprovalLoading, setTokenApprovalLoading] = useState(false);
  const [nftApprovalLoading, setNFTApprovalLoading] = useState(false);
  const [sellNFTName, setSellNFTName] = useState("");
  const [buyNFTName, setBuyNFTName] = useState("");

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

  async function getTradingCollections() {
    // Get user NFT assets
    const tradingCollections = await getTradingNFTCollections(chain.id);
    setTradingCollections(tradingCollections);
    console.log("tradingCollections", tradingCollections);
  }

  async function getTokenAllowance() {
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
    if (buyAmount && sellAmount && buyPoolAddress && sellPoolAddress) {
      const newSwapQuote = await getSwapQuote(
        chain.id,
        buyAmount,
        sellAmount,
        buyPoolAddress,
        sellPoolAddress
      );
      setPriceQuote(newSwapQuote);
      setBuyAmount(newSwapQuote.buyLps.length);
      console.log("newSwapQuote", newSwapQuote);

      // Get an amount of random NFTs to sell
      var newSelectedNFTs = [];
      for (let index = 0; index < newSwapQuote.sellLps.length; index++) {
        if (index > userSellCollectionNFTs.length - 1) {
          break;
        }
        newSelectedNFTs.push(
          BigNumber.from(userSellCollectionNFTs[index].id.tokenId).toNumber()
        );
      }
      console.log("newSelectedNFTs", newSelectedNFTs);
      setSelectedNFTs(newSelectedNFTs);
      setSellAmount(newSelectedNFTs.length);
    }
  }

  async function getSellSelectedPriceQuote(
    buyAmount,
    selectedNFTs,
    buyPoolAddress,
    sellPoolAddress
  ) {
    console.log("Getting sell seleted swap quote");
    if (buyAmount && selectedNFTs && buyPoolAddress && sellPoolAddress) {
      const newSwapQuote = await getSwapQuote(
        chain.id,
        buyAmount,
        selectedNFTs.length,
        buyPoolAddress,
        sellPoolAddress
      );

      console.log("newSwapQuote", newSwapQuote);
      setPriceQuote(newSwapQuote);
      setSellAmount(newSwapQuote.sellLps.length);
      setSelectedNFTs(selectedNFTs.slice(0, newSwapQuote.sellLps.length));
    } else {
      setSellAmount(selectedNFTs.length);
      setSelectedNFTs(selectedNFTs);
    }
  }

  async function getUserSellCollectionNFTs(collection) {
    // Get user NFT assets
    const addressNFTs = await getAddressNFTs(address, collection, chain.id);
    console.log("addressNsellCollectionNFTs", addressNFTs);
    setUserSellCollectionNFTs(addressNFTs);
  }

  async function getUserNFTCollections() {
    // Get user NFT assets
    const addressNFTCollections = await getAddressNFTCollections(
      address,
      chain.id
    );
    console.log("addressNFTCollections", addressNFTCollections);
    setUserNFTCollections(addressNFTCollections);
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
  }

  useEffect(() => {
    if (isConnected && address) {
      getTradingCollections(chain.id);
      getTokenAllowance();
      getUserNFTCollections();
    }
  }, [isConnected, address]);

  const handleTokenApprovalSuccess = async function () {
    setApprovedToken(true);
    dispatch({
      type: "success",
      message: "You just approved your tokens.",
      title: "Approval Successful!",
      position: "topR",
    });
  };

  const handleNFTApprovalSuccess = async function () {
    setApprovedNFT(true);
    dispatch({
      type: "success",
      message: "You just approved your NFTs.",
      title: "Approval Successful!",
      position: "topR",
    });
  };

  const handleSellNFTAddressChange = (_event, value) => {
    console.log("handleSellNFTAddressChange", value);
    if (ethers.utils.isAddress(value)) {
      setSellNFTAddress(value);
      getUserSellCollectionNFTs(value);
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
      getUserSellCollectionNFTs(nftAddress);
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
            Sell
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
                  ).media.raw && (
                    <Image
                      loader={() =>
                        tradingCollections.find(
                          (collection) =>
                            collection.contractMetadata.name == option
                        ).media.thumbnail
                      }
                      src={
                        tradingCollections.find(
                          (collection) =>
                            collection.contractMetadata.name == option
                        ).media.thumbnail
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
                label="NFT Collection"
                sx={{
                  "& label": {
                    paddingLeft: (theme) => theme.spacing(2),
                    fontFamily: "Monospace",
                    fontSize: "h6.fontSize",
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
                    setSelectedNFTs([]);
                    setSelectingNFTs(!selectingNFTs);
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
          {selectingNFTs && (
            <div className="flex flex-row m-4 grid md:grid-cols-3 lg:grid-cols-4">
              {userSellCollectionNFTs.map((nft, _) => (
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
                        getSellSelectedPriceQuote(
                          buyAmount,
                          newSelectedNFTs,
                          buyPoolAddress,
                          sellPoolAddress
                        );
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
        </div>
      </div>
      <div className="flex flex-col items-center m-2">
        <ArrowDownwardOutlinedIcon />
      </div>
      <div className="flex flex-col items-center text-center justify-center p-8 m-4 mb-14 rounded-3xl bg-black/5 shadow-lg">
        <div className="flex flex-col mb-2">
          <Box
            sx={{
              fontFamily: "Monospace",
              fontSize: "h5.fontSize",
              fontWeight: "bold",
              letterSpacing: 4,
            }}
          >
            Buy
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
                  ).media.raw && (
                    <Image
                      loader={() =>
                        tradingCollections.find(
                          (collection) =>
                            collection.contractMetadata.name == option
                        ).media.thumbnail
                      }
                      src={
                        tradingCollections.find(
                          (collection) =>
                            collection.contractMetadata.name == option
                        ).media.thumbnail
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
                label="NFT Collection"
                sx={{
                  "& label": {
                    paddingLeft: (theme) => theme.spacing(2),
                    fontFamily: "Monospace",
                    fontSize: "h6.fontSize",
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
        <div className="flex flex-col justify-center">
          <div className="flex flex-col md:flex-row justify-center items-center">
            <div className="flex flex-col w-[200px] justify-center">
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
          </div>
        </div>
      </div>
      <div className="flex flex-row w-full justify-center items-center">
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
              buyNFTAddress != "" &&
              (chain.id == 1
                ? "https://etherscan.io/address/" + buyNFTAddress
                : "https://goerli.etherscan.io/address/" + buyNFTAddress)
            }
          />
        </Divider>
      </div>
      {priceQuote && (
        <div className="flex flex-row w-full justify-center m-4">
          <Box
            sx={{
              fontFamily: "Monospace",
              fontSize: "h6.fontSize",
              fontWeight: "bold",
            }}
          >
            {BigNumber.from(priceQuote.buyPrice).gt(priceQuote.sellPrice)
              ? "You pay: " +
                formatUnits(
                  BigNumber.from(priceQuote.buyPrice).sub(priceQuote.sellPrice),
                  18
                ) +
                " WETH"
              : "You receive: " +
                formatUnits(
                  BigNumber.from(priceQuote.sellPrice).sub(priceQuote.buyPrice),
                  18
                ) +
                " WETH"}
          </Box>
        </div>
      )}
      <div className="flex flex-row mt-8 mb-2 w-8/12 md:w-6/12">
        {!approvedNFT ? (
          <Button
            primary
            fill="horizontal"
            size="large"
            disabled={nftApprovalLoading}
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
                  {"Approve Sell NFT Pool"}
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
            loading={tokenApprovalLoading}
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
                  "115792089237316195423570985008687907853269984665640564039457584007913129639935"
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
                  {"Approve Price Difference"}
                </Box>
              </div>
            }
          />
        ) : (
          <Button
            primary
            fill="horizontal"
            size="large"
            disabled={swapLoading}
            color="#063970"
            onClick={async function () {
              setSwapLoading(true);
              console.log("Swapping...");
              console.log([
                buyPoolAddress,
                sellPoolAddress,
                priceQuote.exampleBuyNFTs,
                priceQuote.buyPrice,
                selectedNFTs,
                priceQuote.sellLps,
                priceQuote.sellPrice,
              ]);
              try {
                let tx = await swapRouterSigner.swap(
                  buyPoolAddress,
                  sellPoolAddress,
                  priceQuote.exampleBuyNFTs,
                  priceQuote.buyPrice,
                  selectedNFTs,
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

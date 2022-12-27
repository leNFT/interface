import contractAddresses from "../contractAddresses.json";
import {
  useAccount,
  useNetwork,
  useContract,
  useProvider,
  useSigner,
} from "wagmi";
import Chip from "@mui/material/Chip";
import { Button } from "grommet";
import { useState } from "react";
import { getAddressNFTs } from "../helpers/getAddressNFTs.js";
import { getBuyQuote } from "../helpers/getBuyQuote.js";
import { getSellQuote } from "../helpers/getSellQuote.js";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import { Input } from "@nextui-org/react";
import { CardActionArea } from "@mui/material";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import { BigNumber } from "@ethersproject/bignumber";
import { Divider } from "@mui/material";
import { formatUnits } from "@ethersproject/units";
import tradingPoolFactoryContract from "../contracts/TradingPoolFactory.json";
import tradingPoolContract from "../contracts/TradingPool.json";
import { useNotification } from "@web3uikit/core";
import { ethers } from "ethers";
import erc20 from "../contracts/erc20.json";
import erc721 from "../contracts/erc721.json";

export default function Swap() {
  const { chain } = useNetwork();
  const { data: signer } = useSigner();
  const { address, isConnected } = useAccount();
  const [approvedToken, setApprovedToken] = useState(false);
  const [approvedNFT, setApprovedNFT] = useState(false);
  const [nftAddress, setNFTAddress] = useState("");
  const [poolAddress, setPoolAddress] = useState("");
  const [amount, setAmount] = useState(0);
  const [selectingNFTs, setSelectingNFTs] = useState(false);
  const [selectedNFTs, setSelectedNFTs] = useState([]);
  const [userNFTs, setUserNFTs] = useState([]);
  const [priceQuote, setPriceQuote] = useState();
  const [swapLoading, setSwapLoading] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [nftName, setNFTName] = useState("");

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

    console.log("updatedpool", updatedPool);
    getNFTAllowance(collection, updatedPool);
    getNFTName(collection);
    getTokenAllowance(updatedPool);
    setPoolAddress(updatedPool);
  }

  async function getSellSelectedPriceQuote(selected) {
    const newSellQuote = await getSellQuote(
      chain.id,
      selected.length,
      poolAddress
    );
    setPriceQuote(newSellQuote);
    if (newSellQuote.lps.length < selected.length) {
      dispatch({
        type: "warning",
        message: "Can only sell " + newSellQuote.lps.length + " NFTs",
        title: "Maximum is " + newSellQuote.lps.length,
        position: "topR",
      });
    }
    setAmount(newSellQuote.lps.length);
    console.log("amoutn", newSellQuote.lps.length);
    console.log("new selected:", selected.slice(0, newSellQuote.lps.length));
    setSelectedNFTs(selected.slice(0, newSellQuote.lps.length));
    console.log("newSellQuote", newSellQuote);
  }

  async function getPriceQuote(amount, mode) {
    if (mode == "buy") {
      const newBuyQuote = await getBuyQuote(chain.id, amount, poolAddress);
      setPriceQuote(newBuyQuote);
      if (newBuyQuote.lps.length < amount) {
        dispatch({
          type: "warning",
          message: "Can only buy " + newBuyQuote.lps.length + " NFTs",
          title: "Maximum is " + newBuyQuote.lps.length,
          position: "topR",
        });
      }
      setAmount(newBuyQuote.lps.length);
      console.log("newBuyQuote", newBuyQuote);
    } else if (mode == "sell") {
      const newSellQuote = await getSellQuote(chain.id, amount, poolAddress);
      setPriceQuote(newSellQuote);
      if (newSellQuote.lps.length < amount) {
        dispatch({
          type: "warning",
          message: "Can only sell " + newSellQuote.lps.length + " NFTs",
          title: "Maximum is " + newSellQuote.lps.length,
          position: "topR",
        });
      }
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

  async function getNFTAllowance(collection, pool) {
    console.log("nftAddress", nftAddress);
    const nftContract = new ethers.Contract(collection, erc721, provider);
    const allowed = await nftContract.isApprovedForAll(address, pool);

    console.log("Got nft allowed:", allowed);

    if (allowed) {
      setApprovedNFT(true);
    } else {
      setApprovedNFT(false);
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

  const handleAmountInputChange = (event) => {
    console.log("handleAmountInputChange", event.target.value);
    try {
      if (event.target.value && nftAddress) {
        getPriceQuote(event.target.value, option);
      } else {
        setPriceQuote();
      }
      setAmount(event.target.value);
    } catch (error) {
      console.log(error);
    }
  };

  const handleNFTAddressChange = (event) => {
    console.log("handleNFTAddressChange", event.target.value);
    setNFTAddress(event.target.value);
    try {
      ethers.utils.getAddress(event.target.value);
      getUserNFTs(event.target.value);
      getTradingPoolAddress(event.target.value);
    } catch (error) {
      setPriceQuote();
      setPoolAddress("");
      setNFTName("");
      console.log(error);
    }
  };

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
      <div className="flex flex-col items-center text-center justify-center w-10/12 md:w-6/12 border-4 m-2 rounded-3xl bg-black/5 shadow-lg">
        <div className="flex flex-row m-8">
          <div className="flex flex-col m-2">
            <Button
              primary
              size="medium"
              color={option == "buy" ? SELECTED_COLOR : UNSELECTED_COLOR}
              onClick={() => {
                setOption("buy");
                setSelectedNFTs(false);
                getPriceQuote(amount, "buy");
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
                getPriceQuote(amount, "sell");
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
        <div className="flex flex-row w-9/12 justify-center items-center">
          <Divider style={{ width: "100%" }}>
            {nftName && (
              <Chip
                label={nftName}
                variant="outlined"
                component="a"
                clickable
                target="_blank"
                href={
                  chain.id == 1
                    ? "https://etherscan.io/address/" + nftAddress
                    : "https://goerli.etherscan.io/address/" + nftAddress
                }
              />
            )}
          </Divider>
        </div>
        <div className="flex flex-col mt-8 mb-4">
          <Input
            size="xl"
            placeholder="NFT Address"
            bordered
            color="default"
            onChange={handleNFTAddressChange}
          />
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
          <div className="flex flex-row justify-center">
            <div className="flex flex-col w-[200px] justify-center m-2">
              <Input
                labelLeft={option.charAt(0).toUpperCase() + option.slice(1)}
                size="xl"
                labelRight={"NFTs"}
                placeholder="0"
                value={amount}
                onChange={handleAmountInputChange}
              />
            </div>
            {option == "sell" && (
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
            )}
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
                        getSellSelectedPriceQuote(newSelectedNFTs);
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
            <div className="flex flex-row justify-center mb-4 mt-8 items-center">
              <Box
                sx={{
                  fontFamily: "Monospace",
                  fontSize: "h6.fontSize",
                  fontWeight: "bold",
                }}
              >
                {"Price: " + formatUnits(priceQuote.price, 18) + " WETH"}
              </Box>
            </div>
          )}
        </div>
        <div className="flex flex-row w-11/12 justify-center items-center">
          <Divider style={{ width: "100%" }} />
        </div>
        <div className="flex flex-row m-6 w-4/12">
          {(option == "buy" && !approvedToken) ||
          (option == "sell" && !approvedNFT) ? (
            <Button
              primary
              fill="horizontal"
              size="large"
              disabled={approvalLoading || !nftAddress}
              color="#063970"
              onClick={async function () {
                setApprovalLoading(true);
                if (option == "buy") {
                  const tokenContract = new ethers.Contract(
                    addresses.ETH.address,
                    erc20,
                    signer
                  );
                  try {
                    const tx = await tokenContract.approve(
                      poolAddress,
                      "115792089237316195423570985008687907853269984665640564039457584007913129639935"
                    );
                    await tx.wait(1);
                    handleTokenApprovalSuccess();
                  } catch (error) {
                    console.log(error);
                  } finally {
                    setApprovalLoading(false);
                  }
                } else if (option == "sell") {
                  const nftContract = new ethers.Contract(
                    nftAddress,
                    erc721,
                    signer
                  );
                  try {
                    const tx = await nftContract.setApprovalForAll(
                      poolAddress,
                      true
                    );
                    await tx.wait(1);
                    handleNFTApprovalSuccess();
                  } catch (error) {
                    console.log(error);
                  } finally {
                    setApprovalLoading(false);
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
                    {option == "buy"
                      ? "Approve Token"
                      : "Approve " + (nftName ? nftName : "NFT")}
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
                    getPriceQuote(amount, option);
                    setSwapLoading(false);
                  }
                } else if (option == "sell") {
                  try {
                    console.log("selectedNFTs", selectedNFTs);
                    console.log("priceQuote.lps", priceQuote.lps);
                    tx = await tradingPool.sell(selectedNFTs, priceQuote.lps);
                    await tx.wait(1);
                    handleSellSuccess();
                  } catch (error) {
                    console.log(error);
                  } finally {
                    getPriceQuote(amount, option);
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
                    {option.toUpperCase() +
                      " " +
                      amount +
                      " " +
                      (nftName ? nftName : "NFTs")}
                  </Box>
                </div>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}

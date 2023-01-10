import { useNotification, Typography } from "@web3uikit/core";
import contractAddresses from "../../contractAddresses.json";
import {
  useAccount,
  useNetwork,
  useContract,
  useSigner,
  useProvider,
} from "wagmi";
import { getAddressNFTs } from "../../helpers/getAddressNFTs.js";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import { ethers } from "ethers";
import { getSwapQuote } from "../../helpers/getSwapQuote.js";
import { Input } from "@nextui-org/react";
import { Button } from "grommet";
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

export default function Swap(props) {
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
  const [userNFTs, setUserNFTs] = useState([]);
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
      setSellAmount(newSwapQuote.sellLps.length);
      setBuyAmount(newSwapQuote.buyLps.length);
      console.log("newSwapQuote", newSwapQuote);
    }
  }

  async function getUserNFTs(collection) {
    // Get user NFT assets
    const addressNFTs = await getAddressNFTs(address, collection, chain.id);
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

  const handleTokenApprovalSuccess = async function () {
    setApprovedToken(true);
    dispatch({
      type: "success",
      message: "You just approved your tokens.",
      title: "Approval Successful!",
      position: "topR",
    });
  };

  const handleSellNFTAddressChange = (event) => {
    console.log("handleSellNFTAddressChange", event.target.value);
    setSellNFTAddress(event.target.value);
    try {
      ethers.utils.getAddress(event.target.value);
      getUserNFTs(event.target.value);
      getSellTradingPoolAddress(event.target.value);
    } catch (error) {
      setSellPoolAddress("");
      setSellNFTName("");
      console.log(error);
    }
  };

  const handleBuyNFTAddressChange = (event) => {
    console.log("handleBuyNFTAddressChange", event.target.value);
    setBuyNFTAddress(event.target.value);
    try {
      ethers.utils.getAddress(event.target.value);
      getBuyTradingPoolAddress(event.target.value);
    } catch (error) {
      setBuyPoolAddress("");
      setBuyNFTName("");
      console.log(error);
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
      <div className="flex flex-col m-4">
        <Input
          labelLeft={"From"}
          size="xl"
          placeholder="NFT Address"
          aria-label="NFT Address"
          bordered
          color="default"
          onChange={handleSellNFTAddressChange}
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
      <div className="flex flex-col justify-center mb-8">
        <div className="flex flex-col md:flex-row justify-center items-center">
          <div className="flex flex-col w-[200px] justify-center m-2">
            <Input
              labelLeft={"Sell"}
              bordered
              size="xl"
              aria-label="NFTs"
              labelRight={"NFTs"}
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
      </div>
      <div className="flex flex-col items-center">
        <ArrowDownwardOutlinedIcon />
      </div>
      <div className="flex flex-col mt-8 m-4">
        <Input
          labelLeft={"To"}
          size="xl"
          placeholder="NFT Address"
          aria-label="NFT Address"
          bordered
          color="default"
          onChange={handleBuyNFTAddressChange}
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
      <div className="flex flex-col justify-center mb-14">
        <div className="flex flex-col md:flex-row justify-center items-center">
          <div className="flex flex-col w-[200px] justify-center">
            <Input
              labelLeft={"Buy"}
              bordered
              size="xl"
              aria-label="NFTs"
              labelRight={"NFTs"}
              placeholder="0"
              value={buyAmount}
              onChange={handleBuyAmountInputChange}
              css={{ textAlignLast: "center" }}
            />
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
                {sellNFTName ? sellNFTName : "?"}
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
                {buyNFTName ? buyNFTName : "?"}
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
        <div className="flex flex-row justify-center mt-8 items-center text-center">
          <Box
            sx={{
              fontFamily: "Monospace",
              fontSize: "h6.fontSize",
              fontWeight: "bold",
            }}
          >
            {"Change: " +
              formatUnits(
                BigNumber.from(priceQuote.sellPrice).sub(priceQuote.buyPrice),
                18
              ) +
              " WETH"}
          </Box>
          {BigNumber.from(priceQuote.sellPrice).lt(priceQuote.buyPrice) &&
            !approvedToken && (
              <Button
                primary
                fill="horizontal"
                size="large"
                color="#063970"
                loading={tokenApprovalLoading}
                onClick={async function () {
                  setTokenApprovalLoading(true);
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
                      {"NFT"}
                    </Box>
                  </div>
                }
              />
            )}
        </div>
      )}
      <div className="flex flex-row mt-8 mb-2 w-8/12 md:w-6/12">
        {approvedNFT ? (
          <Button
            primary
            fill="horizontal"
            size="large"
            disabled={nftApprovalLoading}
            color="#063970"
            onClick={async function () {
              setNFTApprovalLoading(true);

              try {
                const tx = await tokenContract.approve(
                  sellPoolAddress,
                  "115792089237316195423570985008687907853269984665640564039457584007913129639935"
                );
                await tx.wait(1);
                handleTokenApprovalSuccess();
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
                  {"NFT"}
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
              try {
                let tx = await swapRouterSigner.swap(
                  buyPoolAddress,
                  sellPoolAddress
                );
                await tx.wait(1);
                handleSwapSuccess();
              } catch (error) {
                console.log(error);
              } finally {
                getPriceQuote(amount);
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

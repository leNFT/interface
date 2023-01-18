import { useNotification } from "@web3uikit/core";
import contractAddresses from "../../contractAddresses.json";
import { Button } from "grommet";
import { Input } from "@nextui-org/react";
import { getAddressNFTs } from "../../helpers/getAddressNFTs.js";
import { getTradingNFTCollections } from "../../helpers/getTradingNFTCollections.js";
import { ethers } from "ethers";
import Chip from "@mui/material/Chip";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Image from "next/image";
import { CardActionArea } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import {
  useAccount,
  useNetwork,
  useContract,
  useSigner,
  useProvider,
} from "wagmi";
import { formatUnits } from "@ethersproject/units";
import { BigNumber } from "@ethersproject/bignumber";
import { getSellQuote } from "../../helpers/getSellQuote.js";
import { useState, useEffect } from "react";
import { Divider } from "@mui/material";
import Box from "@mui/material/Box";
import erc721 from "../../contracts/erc721.json";
import tradingPoolFactoryContract from "../../contracts/TradingPoolFactory.json";
import tradingPoolContract from "../../contracts/TradingPool.json";

export default function Sell() {
  const SELECTED_COLOR = "#d2c6d2";
  const provider = useProvider();
  const [tradingCollections, setTradingCollections] = useState([]);
  const { chain } = useNetwork();
  const { data: signer } = useSigner();
  const { address, isConnected } = useAccount();
  const [approvedNFT, setApprovedNFT] = useState(false);
  const [nftAddress, setNFTAddress] = useState("");
  const [poolAddress, setPoolAddress] = useState("");
  const [amount, setAmount] = useState(0);
  const [selectingNFTs, setSelectingNFTs] = useState(false);
  const [selectedNFTs, setSelectedNFTs] = useState([]);
  const [userNFTs, setUserNFTs] = useState([]);
  const [priceQuote, setPriceQuote] = useState();
  const [sellLoading, setSellLoading] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [nftName, setNFTName] = useState("");

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

  async function getUserNFTs(collection) {
    // Get user NFT assets
    const addressNFTs = await getAddressNFTs(address, collection, chain.id);
    setUserNFTs(addressNFTs);
  }
  async function getTradingCollections() {
    // Get user NFT assets
    const tradingCollections = await getTradingNFTCollections(chain.id);
    setTradingCollections(tradingCollections);
    console.log("tradingCollections", tradingCollections);
  }
  async function getTradingPoolAddress(collection) {
    // Get trading pool for collection
    const updatedPool = (
      await factoryProvider.getTradingPool(collection, addresses.ETH.address)
    ).toString();

    console.log("updatedpool", updatedPool);
    getNFTAllowance(collection, updatedPool);
    getNFTName(collection);
    setPoolAddress(updatedPool);
  }

  async function getPriceQuote(amount) {
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

  // Runs once
  useEffect(() => {
    if (isConnected) {
      getTradingCollections(chain.id);
      console.log("Web3 Enabled, ChainId:", chain.id);
    }
    console.log("useEffect called");
  }, [isConnected, chain]);

  const handleAmountInputChange = (event) => {
    console.log("handleAmountInputChange", event.target.value);
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

  const handleSellSuccess = async function () {
    dispatch({
      type: "success",
      message: "Your just sold.",
      title: "Sell Successful!",
      position: "topR",
    });
  };

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

  const handleNFTAddressChange = (_event, value) => {
    console.log("handleNFTAddressChange", value);
    if (ethers.utils.isAddress(value)) {
      setNFTAddress(value);
      getUserNFTs(value);
      getTradingPoolAddress(value);
    } else if (
      tradingCollections
        .map((collection) => collection.contractMetadata.name)
        .includes(value)
    ) {
      const nftAddress = tradingCollections.find(
        (collection) => collection.contractMetadata.name == value
      ).address;
      setNFTAddress(nftAddress);
      getUserNFTs(nftAddress);
      getTradingPoolAddress(nftAddress);
    } else {
      console.log("Invalid NFT Address");
      if (value == "") {
        setNFTAddress("");
      } else {
        setNFTAddress("0x");
      }
      setPriceQuote();
      setPoolAddress("");
      setNFTName("");
    }
  };

  return (
    <div className="flex flex-col items-center">
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
          sx={{ minWidth: { xs: 240, sm: 300, md: 380 } }}
          onInputChange={handleNFTAddressChange}
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
              label="Token"
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
      <div className="flex flex-row w-9/12 justify-center m-4 items-center">
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
                chain.id == 1
                  ? "https://etherscan.io/address/" + nftAddress
                  : "https://goerli.etherscan.io/address/" + nftAddress
              }
            />
          )}
        </Divider>
      </div>
      {priceQuote && (
        <div className="flex flex-row justify-center items-center text-center">
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
      <div className="flex flex-row m-6 w-8/12 md:w-6/12">
        {!approvedNFT ? (
          <Button
            primary
            fill="horizontal"
            size="large"
            disabled={approvalLoading || !nftAddress}
            color="#063970"
            onClick={async function () {
              setApprovalLoading(true);
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
                  {"Approve " + (nftName ? nftName : "NFT")}
                </Box>
              </div>
            }
          />
        ) : (
          <Button
            primary
            fill="horizontal"
            size="large"
            disabled={sellLoading}
            color="#063970"
            onClick={async function () {
              setSellLoading(true);
              const tradingPool = new ethers.Contract(
                poolAddress,
                tradingPoolContract.abi,
                signer
              );
              try {
                console.log("selectedNFTs", selectedNFTs);
                console.log("priceQuote.lps", priceQuote.lps);
                let tx = await tradingPool.sell(
                  address,
                  selectedNFTs,
                  priceQuote.lps,
                  priceQuote.price
                );
                await tx.wait(1);
                handleSellSuccess();
              } catch (error) {
                console.log(error);
              } finally {
                getPriceQuote(amount);
                setSellLoading(false);
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
                  {"SELL " + amount + " " + (nftName ? nftName : "NFTs")}
                </Box>
              </div>
            }
          />
        )}
      </div>
    </div>
  );
}

import { useNotification } from "@web3uikit/core";
import contractAddresses from "../../contractAddresses.json";
import {
  useAccount,
  useBalance,
  useNetwork,
  useContract,
  useSigner,
  useProvider,
} from "wagmi";
import { parseUnits } from "ethers/lib/utils";
import { ethers } from "ethers";
import Image from "next/image";
import erc20 from "../../contracts/erc20.json";
import erc721 from "../../contracts/erc721.json";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import { Input } from "@nextui-org/react";
import { getTradingNFTCollections } from "../../helpers/getTradingNFTCollections.js";
import { getNFTImage } from "../../helpers/getNFTImage.js";
import { BigNumber } from "@ethersproject/bignumber";
import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import { Button, Spinner } from "grommet";
import tradingPoolFactoryContract from "../../contracts/TradingPoolFactory.json";
import wethGateway from "../../contracts/WETHGateway.json";

export default function LimitBuy(props) {
  const { chain } = useNetwork();
  const { address, isConnected } = useAccount();
  const provider = useProvider();
  const { data: ethBalance } = useBalance({
    addressOrName: address,
  });

  const [tradingCollections, setTradingCollections] = useState([]);
  const { data: signer } = useSigner();
  const [approvedToken, setApprovedToken] = useState(false);
  const [nftAddress, setNFTAddress] = useState("");
  const [poolAddress, setPoolAddress] = useState("");
  const [amount, setAmount] = useState(0);
  const [buyLoading, setBuyLoading] = useState(false);
  const [nftName, setNFTName] = useState("");
  const [nftImages, setNFTImages] = useState([]);
  const [price, setPrice] = useState(0);
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
    props.setBackgroundImage(updatedURL);
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
    props.setPool(updatedPool);

    if (isConnected) {
      getTokenAllowance(updatedPool);
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
    const chain = chain ? chain.id : 1;

    addresses = contractAddresses[chain];
    getTradingCollections(chain);

    console.log("useEffect called");
  }, [isConnected, chain]);

  useEffect(() => {
    if (nftAddress) {
      handleNFTAddressChange(null, nftAddress);
    }
  }, [isConnected]);

  const handleBuySuccess = () => {
    dispatch({
      type: "SUCCESS",
      title: "Success",
      message: "Your buy order has been placed!",
    });
  };

  const handleAmountInputChange = (event) => {
    console.log("handleAmountInputChange", event.target.value);
    setAmount(event.target.value);
  };

  const handleNFTAddressChange = (_event, value) => {
    console.log("handleNFTAddressChange", value);
    setAmount(0);
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
      props.setCollection(nftAddress);
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
      props.setPool("");
      props.setBackgroundImage("");
      setPoolAddress("");
      setNFTName("");
    }
  };

  const handlePriceInputChange = (event) => {
    console.log("handlePriceInputChange", event.target.value);
    setPrice(event.target.value);
  };

  return (
    <div className="flex flex-col items-center text-center w-full md:w-fit justify-center m-4 rounded-3xl">
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
            sx={{ minWidth: { xs: 260, sm: 320, md: 380 } }}
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
                    backdropFilter: "blur(10px)",
                  },
                  "& input": {
                    paddingLeft: (theme) => theme.spacing(3.5),
                    fontFamily: "Monospace",
                    backdropFilter: "blur(10px)",
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
                : isConnected
                ? "No pool found"
                : "Connect Wallet"}
            </Box>
          </div>
        )}
      </div>
      <div className="flex flex-col justify-center m-4">
        <div className="flex flex-col md:flex-row justify-center items-center">
          <div className="flex flex-col w-[200px] justify-center m-2 backdrop-blur-md">
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
              @
            </div>
            <div className="flex flex-col w-[160px] justify-center m-2 backdrop-blur-md">
              <Input
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
                    ETH
                  </Box>
                }
                placeholder="0"
                value={price}
                onChange={handlePriceInputChange}
                css={{ textAlignLast: "center" }}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-row mt-6 w-8/12 md:w-6/12">
        <Button
          primary
          fill="horizontal"
          size="large"
          disabled={buyLoading || !isConnected}
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
            if (
              BigNumber.from(
                BigNumber.from(parseUnits(price, 18)).mul(amount)
              ).gt(ethBalance.value)
            ) {
              dispatch({
                type: "info",
                message: "You don't have enough ETH",
                title: "Insufficient ETH",
                position: "bottomL",
              });
            }
            setBuyLoading(true);
            try {
              const tx = await wethGatewaySigner.depositTradingPool(
                poolAddress,
                3,
                [],
                parseUnits(Number(price).toString(), 18),
                addresses.ExponentialCurve,
                0,
                0,
                {
                  value: parseUnits((price * amount).toString(), 18),
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
                  {isConnected ? "CREATE BUY ORDER" : "Connect Wallet"}
                </Box>
              )}
            </div>
          }
        />
      </div>
    </div>
  );
}

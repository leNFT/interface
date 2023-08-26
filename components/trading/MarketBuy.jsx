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
import { useRouter } from "next/router";
import { Popover } from "@nextui-org/react";
import { Input, Loading } from "@nextui-org/react";
import { getAddressNFTs } from "../../helpers/getAddressNFTs.js";
import { getBuyQuote } from "../../helpers/getBuyQuote.js";
import { getNFTImage } from "../../helpers/getNFTImage.js";
import { getBuyExactQuote } from "../../helpers/getBuyExactQuote.js";
import Chip from "@mui/material/Chip";
import Card from "@mui/material/Card";
import { CardActionArea } from "@mui/material";
import { formatUnits } from "@ethersproject/units";
import { BigNumber } from "@ethersproject/bignumber";
import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import { Button, Spinner } from "grommet";
import { Divider } from "@mui/material";
import Image from "next/image";
import wethGateway from "../../contracts/WETHGateway.json";

export default function MarketBuy(props) {
  const { chain } = useNetwork();
  const { address, isConnected } = useAccount();
  const { data: ethBalance } = useBalance({
    addressOrName: address,
  });
  const [availableNFTs, setAvailableNFTs] = useState([]);
  const [selectingNFTs, setSelectingNFTs] = useState(false);
  const [selectedNFTs, setSelectedNFTs] = useState([]);
  const { data: signer } = useSigner();
  const [amount, setAmount] = useState(0);
  const [priceQuote, setPriceQuote] = useState();
  const [loadingPriceQuote, setLoadingPriceQuote] = useState(false);
  const [buyLoading, setBuyLoading] = useState(false);
  const [nftImages, setNFTImages] = useState([]);

  const dispatch = useNotification();

  var addresses = contractAddresses[1];

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
      chain ? chain.id : 1
    );
    console.log("addressNFTs", addressNFTs);
    setAvailableNFTs(addressNFTs);
  }

  async function getPriceQuote(amount) {
    if (amount > 0) {
      setPriceQuote();
      setLoadingPriceQuote(true);
      var newBuyQuote;
      if (selectingNFTs) {
        newBuyQuote = await getBuyExactQuote(
          isConnected ? chain.id : 1,
          selectedNFTs,
          props.pool
        );
      } else {
        newBuyQuote = await getBuyQuote(
          isConnected ? chain.id : 1,
          amount,
          props.pool
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

      // Get the NFT images
      const images = await Promise.all(
        newSelectedNFTs.map(async (nft) => {
          return await getNFTImage(
            props.nftAddress,
            nft,
            isConnected ? chain.id : 1
          );
        })
      );
      setNFTImages(images);
    }
  }

  // Runs once
  useEffect(() => {
    const chain = chain ? chain.id : 1;
    addresses = contractAddresses[chain];

    console.log("useEffect called");
  }, [isConnected, chain]);

  useEffect(() => {
    if (props.nftAddress && props.pool && selectedNFTs.length > 0) {
      setAmount(selectedNFTs.length);
      getPriceQuote(selectedNFTs.length);
    } else {
      setAmount(0);
      setPriceQuote();
    }
  }, [selectedNFTs]);

  useEffect(() => {
    if (props.nftAddress && props.pool) {
      getAvailableNFTs(props.pool, props.nftAddress);
      setSelectingNFTs(false);
      setSelectedNFTs([]);
    }
  }, [props.nftAddress, props.pool]);

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
          props.nftName +
          " available",
        title: "Amount too high!",
        position: "bottomL",
      });
    } else {
      setAmount(event.target.value);
      try {
        if (event.target.value && props.nftAddress) {
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

  return (
    <div className="flex flex-col items-center text-center w-full md:w-fit justify-center rounded-3xl">
      <div className="flex flex-col justify-center">
        <div className="flex flex-col sm:flex-row justify-center items-center">
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
                disabled={!props.nftAddress}
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
              <div className="flex flex-row items-center text-center justify-center mx-8">
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
              <div className="my-4 grid grid-cols-3 overflow-auto w-full max-h-[24rem]">
                {availableNFTs.map((nft, _) => (
                  <div
                    key={BigNumber.from(nft.tokenId).toNumber()}
                    className="flex m-2 items-center justify-center max-w-[320px]"
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
                              element == BigNumber.from(nft.tokenId).toNumber()
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
                          {nft.media[0] ? (
                            <div style={{ position: "relative" }}>
                              <Image
                                loader={() => nft.media[0].gateway}
                                src={nft.media[0].gateway}
                                height="120"
                                width="120"
                                className="rounded-xl"
                              />
                              <Popover isBordered disableShadow>
                                <Popover.Trigger>
                                  <Button
                                    style={{
                                      position: "absolute",
                                      bottom: "-0.5rem",
                                      left: "0.2rem",
                                    }}
                                    color="#d2c6d2"
                                    primary
                                  >
                                    <Box
                                      sx={{
                                        fontFamily: "Monospace",
                                        fontSize: {
                                          xs: "9px",
                                          sm: "caption.fontSize",
                                        },
                                        fontWeight: {
                                          xs: "normal",
                                          sm: "bold",
                                        },
                                        padding: {
                                          xs: "0.2rem",
                                          sm: "0.3rem",
                                        },
                                      }}
                                    >
                                      Traits
                                    </Box>
                                  </Button>
                                </Popover.Trigger>
                                <Popover.Content>
                                  <Box
                                    sx={{
                                      fontFamily: "Monospace",
                                      fontSize: "subtitle2.fontSize",
                                      fontWeight: "bold",
                                      padding: "0.6rem",
                                    }}
                                  >
                                    {nft.rawMetadata.attributes.map(
                                      (attribute) => (
                                        <div key={attribute.trait_type}>
                                          {attribute.trait_type}:{" "}
                                          {attribute.value}
                                        </div>
                                      )
                                    )}
                                  </Box>
                                </Popover.Content>
                              </Popover>
                            </div>
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
                            className="mr-4 w-full text-end"
                            sx={{
                              fontFamily: "Monospace",
                              fontSize: {
                                xs: "10px",
                                sm: "subitle2.fontSize",
                              },
                              fontWeight: "bold",
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
              {"Pool has no " + props.nftName + "'s left."}
            </Box>
          ))}
      </div>
      {loadingPriceQuote && <Loading className="m-12" size="xl" />}
      {priceQuote && (
        <div className="flex flex-col sm:flex-row items-center justify-center">
          <div className="flex flex-col sm:w-6/12 items-center text-center justify-center p-4 m-4 rounded-3xl bg-black/5 backdrop-blur-md shadow-lg">
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
                {props.nftName && (
                  <Chip
                    label={
                      <Box
                        sx={{
                          fontFamily: "Monospace",
                          fontSize: "subtitle2.fontSize",
                          fontWeight: "bold",
                        }}
                      >
                        {props.nftName ? amount + " " + props.nftName : "?"}
                      </Box>
                    }
                    variant="outlined"
                    component="a"
                    clickable
                    target="_blank"
                    href={
                      isConnected
                        ? chain.id == 1
                          ? "https://etherscan.io/address/" + props.nftAddress
                          : "https://sepolia.etherscan.io/address/" +
                            props.nftAddress
                        : "https://sepolia.etherscan.io/address/" +
                          props.nftAddress
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
              {Number(formatUnits(priceQuote.price, 18)).toPrecision(6)} ETH
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
          <div className="grid sm:w-6/12 grid-cols-2 gap-4 p-4 m-4 rounded-3xl bg-black/5 backdrop-blur-md shadow-lg">
            {nftImages.map((imageUrl, index) => (
              <div key={index} className="flex items-center justify-center">
                <Image
                  loader={() => imageUrl}
                  src={imageUrl}
                  height="140"
                  width="140"
                  unoptimized={true}
                  className="rounded-2xl"
                />
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-row mt-6 mb-2 w-full md:w-8/12">
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
            if (BigNumber.from(priceQuote.price).gt(ethBalance.value)) {
              console.log("Not enough ETH");
              dispatch({
                type: "info",
                message: "You don't have enough ETH",
                title: "Insufficient ETH",
                position: "bottomL",
              });
            }
            setBuyLoading(true);
            try {
              const tx = await wethGatewaySigner.buy(
                props.pool,
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
                  {isConnected
                    ? "BUY " +
                      amount +
                      " " +
                      (props.nftName ? props.nftName : "NFTs")
                    : "Connect Wallet"}
                </Box>
              )}
            </div>
          }
        />
      </div>
    </div>
  );
}

import { useNotification } from "@web3uikit/core";
import contractAddresses from "../../contractAddresses.json";
import { Button, Spinner } from "grommet";
import { Input, Loading } from "@nextui-org/react";
import { getAddressNFTs } from "../../helpers/getAddressNFTs.js";
import { getTradingNFTCollections } from "../../helpers/getTradingNFTCollections.js";
import { getNFTImage } from "../../helpers/getNFTImage.js";
import { ethers } from "ethers";
import { useRouter } from "next/router";
import Chip from "@mui/material/Chip";
import Card from "@mui/material/Card";
import { Popover } from "@nextui-org/react";
import Image from "next/image";
import { CardActionArea } from "@mui/material";
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
import wethGateway from "../../contracts/WETHGateway.json";

export default function MarketSell(props) {
  const router = useRouter();
  const provider = useProvider();
  const { chain } = useNetwork();
  const { data: signer } = useSigner();
  const { address, isConnected } = useAccount();
  const [approvedNFT, setApprovedNFT] = useState(false);
  const [amount, setAmount] = useState(0);
  const [loadingPriceQuote, setLoadingPriceQuote] = useState(false);
  const [selectingNFTs, setSelectingNFTs] = useState(false);
  const [selectedNFTs, setSelectedNFTs] = useState([]);
  const [userNFTs, setUserNFTs] = useState([]);
  const [priceQuote, setPriceQuote] = useState();
  const [sellLoading, setSellLoading] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [nftImages, setNFTImages] = useState([]);

  const dispatch = useNotification();

  var addresses = contractAddresses[1];

  const wethGatewaySigner = useContract({
    contractInterface: wethGateway.abi,
    addressOrName: addresses.WETHGateway,
    signerOrProvider: signer,
  });

  async function getUserNFTs(collection) {
    // Get user NFT assets
    if (isConnected) {
      const addressNFTs = await getAddressNFTs(address, collection, chain.id);
      setUserNFTs(addressNFTs);
    }
  }

  async function getPriceQuote(quotedAmount) {
    if (quotedAmount > 0) {
      setPriceQuote();
      setLoadingPriceQuote(true);
      const newSellQuote = await getSellQuote(
        isConnected ? chain.id : 1,
        quotedAmount,
        props.pool
      );
      setPriceQuote(newSellQuote);
      setLoadingPriceQuote(false);
      if (newSellQuote.lps.length < quotedAmount) {
        dispatch({
          type: "warning",
          message: "Can only sell " + newSellQuote.lps.length + " NFTs",
          title: "Maximum is " + newSellQuote.lps.length,
          position: "bottomL",
        });
        setAmount(newSellQuote.lps.length);
      }
      console.log("newSellQuote", newSellQuote);
      // Fill the selected NFTs array
      if (!isConnected) return;

      var newSelectedNFTs = [];
      if (selectingNFTs) {
        // Remove any NFTs that can't be sold as per the quote
        newSelectedNFTs = selectedNFTs.slice(0, newSellQuote.lps.length);
      } else {
        for (let index = 0; index < newSellQuote.lps.length; index++) {
          if (index > userNFTs.length) {
            break;
          }
          newSelectedNFTs.push(
            BigNumber.from(userNFTs[index].tokenId).toNumber()
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
          return await getNFTImage(props.nftAddress, nft, chain.id);
        })
      );
      setNFTImages(images);
    }
  }

  const handleAmountInputChange = (event) => {
    console.log("handleAmountInputChange", event.target.value);
    setSelectingNFTs(false);
    if (isConnected & (event.target.value > userNFTs.length)) {
      setAmount(userNFTs.length);
      dispatch({
        type: "warning",
        message: "You only own " + userNFTs.length + " " + props.nftName,
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

  const handleNFTApprovalSuccess = async function () {
    setApprovedNFT(true);
    dispatch({
      type: "success",
      message: "You just approved your NFTs.",
      title: "Approval Successful!",
      position: "bottomL",
    });
  };

  const handleSellSuccess = async function () {
    setPriceQuote();
    dispatch({
      type: "success",
      message: "Your just sold.",
      title: "Sell Successful!",
      position: "bottomL",
    });
  };

  async function getNFTAllowance(collection) {
    const nftContract = new ethers.Contract(collection, erc721, provider);
    const allowed = await nftContract.isApprovedForAll(
      address,
      addresses.WETHGateway
    );

    console.log("Got nft allowed:", allowed);

    if (allowed) {
      setApprovedNFT(true);
    } else {
      setApprovedNFT(false);
    }
  }

  useEffect(() => {
    if (props.nftAddress && props.pool) {
      getUserNFTs(props.nftAddress);
      getNFTAllowance(props.nftAddress);
    }
  }, [props.nftAddress, props.pool]);

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
          (userNFTs.length > 0 ? (
            <div className="flex flex-row m-4 grid grid-cols-2 md:grid-cols-3 overflow-auto mx-8 max-h-[24rem]">
              {userNFTs.map((nft, _) => (
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
                              sm: "subtitle2.fontSize",
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
          ) : (
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: "subtitle2.fontSize",
                fontWeight: "bold",
              }}
              className="flex mt-4 justify-center items-center text-center"
            >
              {"Couldn't find any " + props.nftName + "'s in your wallet"}
            </Box>
          ))}
      </div>
      {loadingPriceQuote && <Loading className="m-12" size="xl" />}
      {priceQuote && (
        <div className="flex flex-col sm:flex-row items-center justify-center">
          <div className="flex flex-col sm:w-6/12 items-center text-center justify-center p-4 m-4 rounded-3xl bg-black/5  backdrop-blur-md shadow-lg">
            <Box
              className="mb-4"
              sx={{
                fontFamily: "Monospace",
                fontSize: "subtitle2.fontSize",
                fontWeight: "bold",
              }}
            >
              Your sell quote
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
              {Number(formatUnits(priceQuote.price, 18)).toPrecision(6)} WETH
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
                  height="120"
                  width="120"
                  unoptimized={true}
                  className="rounded-2xl"
                />
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-row mt-6 mb-2 w-full md:w-8/12">
        {!approvedNFT ? (
          <Button
            primary
            fill="horizontal"
            size="large"
            disabled={approvalLoading || !props.nftAddress || !isConnected}
            color="#063970"
            onClick={async function () {
              setApprovalLoading(true);
              const nftContract = new ethers.Contract(
                props.nftAddress,
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
                  {isConnected
                    ? "Approve " + (props.nftName ? props.nftName : "NFT")
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
            disabled={sellLoading || !isConnected}
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
              setSellLoading(true);
              try {
                console.log("selectedNFTs", selectedNFTs);
                console.log("priceQuote.lps", priceQuote.lps);
                let tx = await wethGatewaySigner.sell(
                  poolAddress,
                  selectedNFTs,
                  priceQuote.lps,
                  priceQuote.price
                );
                await tx.wait(1);
                handleSellSuccess();
              } catch (error) {
                console.log(error);
              } finally {
                setSellLoading(false);
              }
            }}
            label={
              <div className="flex justify-center">
                {sellLoading ? (
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
                      ? "SELL " +
                        amount +
                        " " +
                        (props.nftName ? props.nftName : "NFTs")
                      : "Connect Wallet"}
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

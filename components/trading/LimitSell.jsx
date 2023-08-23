import { useNotification } from "@web3uikit/core";
import contractAddresses from "../../contractAddresses.json";
import { Button, Spinner } from "grommet";
import { Input } from "@nextui-org/react";
import { getAddressNFTs } from "../../helpers/getAddressNFTs.js";
import { getTradingNFTCollections } from "../../helpers/getTradingNFTCollections.js";
import { getNFTImage } from "../../helpers/getNFTImage.js";
import { ethers } from "ethers";
import Card from "@mui/material/Card";
import Image from "next/image";
import { CardActionArea } from "@mui/material";
import TextField from "@mui/material/TextField";
import { parseUnits } from "ethers/lib/utils";
import {
  useAccount,
  useNetwork,
  useContract,
  useSigner,
  useProvider,
} from "wagmi";
import { BigNumber } from "@ethersproject/bignumber";
import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import erc721 from "../../contracts/erc721.json";
import tradingPoolFactoryContract from "../../contracts/TradingPoolFactory.json";
import wethGateway from "../../contracts/WETHGateway.json";

export default function LimitSell(props) {
  const provider = useProvider();
  const { chain } = useNetwork();
  const { data: signer } = useSigner();
  const { address, isConnected } = useAccount();
  const [approvedNFT, setApprovedNFT] = useState(false);
  const [amount, setAmount] = useState(0);
  const [selectingNFTs, setSelectingNFTs] = useState(false);
  const [selectedNFTs, setSelectedNFTs] = useState([]);
  const [userNFTs, setUserNFTs] = useState([]);
  const [sellLoading, setSellLoading] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
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

  async function getUserNFTs(collection) {
    // Get user NFT assets
    if (isConnected) {
      const addressNFTs = await getAddressNFTs(address, collection, chain.id);
      setUserNFTs(addressNFTs);
    }
  }

  const handleAmountInputChange = (event) => {
    console.log("handleAmountInputChange", event.target.value);
    setSelectingNFTs(false);
    if (isConnected & (event.target.value > userNFTs.length)) {
      setAmount(userNFTs.length);
      dispatch({
        type: "warning",
        message: "You only own " + userNFTs.length + " " + nftName,
        title: "Amount too high!",
        position: "bottomL",
      });
    } else {
      setAmount(event.target.value);
    }

    // Update the selected NFTs array
    var newSelectedNFTs = [];
    for (var i = 0; i < event.target.value; i++) {
      console.log("userNFTs[i]", userNFTs[i]);
      newSelectedNFTs.push(userNFTs[i].tokenId);
    }

    console.log("newSelectedNFTs", newSelectedNFTs);
    setSelectedNFTs(newSelectedNFTs);
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
    dispatch({
      type: "success",
      message: "Your just create a sell order.",
      title: "Create Successful!",
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

  const handlePriceInputChange = (event) => {
    console.log("handlePriceInputChange", event.target.value);
    setPrice(event.target.value);
  };

  return (
    <div className="flex flex-col items-center text-center w-full md:w-fit justify-center rounded-3xl">
      <div className="flex flex-col justify-center">
        <div className="flex flex-col sm:flex-row justify-center items-center">
          <div className="flex flex-col justify-center items-center">
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
          <div className="flex flex-row justify-center items-center">
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
        {selectingNFTs &&
          (userNFTs.length > 0 ? (
            <div className="flex flex-row m-4 grid grid-cols-2 md:grid-cols-3 overflow-auto max-h-[24rem]">
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
              {"Couldn't find any " + nftName + "'s in your wallet"}
            </Box>
          ))}
      </div>
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
            disabled={
              !isConnected ||
              sellLoading ||
              (selectingNFTs ? selectedNFTs.length == 0 : amount == 0)
            }
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
              console.log("Selling: " + selectedNFTs);
              try {
                const tx = await wethGatewaySigner.depositTradingPool(
                  poolAddress,
                  4,
                  selectedNFTs,
                  parseUnits(price, 18),
                  addresses.ExponentialCurve,
                  0,
                  0
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
                    {isConnected ? "Create Sell Order" : "Connect Wallet"}
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

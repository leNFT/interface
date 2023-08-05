import {
  useAccount,
  useNetwork,
  useContract,
  useProvider,
  useSigner,
} from "wagmi";
import Link from "@mui/material/Link";
import Box from "@mui/material/Box";
import { BigNumber } from "@ethersproject/bignumber";
import Card from "@mui/material/Card";
import { CardActionArea, Typography } from "@mui/material";
import { getAddressNFTs } from "../../helpers/getAddressNFTs.js";
import { formatUnits, parseUnits } from "@ethersproject/units";
import Image from "next/image";
import CurveChart from "../CurveChart.jsx";
import { useNotification, Button, Input } from "@web3uikit/core";
import { Dropdown, Switch } from "@nextui-org/react";
import contractAddresses from "../../contractAddresses.json";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import tradingGaugeContract from "../../contracts/TradingGauge.json";
import wethGatewayContract from "../../contracts/WETHGateway.json";
import erc721 from "../../contracts/erc721.json";

export default function DepositTradingPool(props) {
  const { data: signer } = useSigner();
  const [curve, setCurve] = useState("exponential");
  const [delta, setDelta] = useState("10");
  const [maxDelta, setMaxDelta] = useState("100");
  const [fee, setFee] = useState("20");
  const [initialPrice, setInitialPrice] = useState("");
  const [lpType, setLPType] = useState("trade");
  const [tokenAmount, setTokenAmount] = useState("");
  const [nftAmount, setNFTAmount] = useState(0);
  const [userNFTs, setUserNFTs] = useState([]);
  const [selectedNFTs, setSelectedNFTs] = useState([]);
  const [selectingNFTs, setSelectingNFTs] = useState(false);
  const [approvedToken, setApprovedToken] = useState(false);
  const [approvedNFT, setApprovedNFT] = useState(false);
  const [approvalNFTLoading, setApprovalNFTLoading] = useState(false);
  const [lpGaugeValue, setLPGaugeValue] = useState("0");
  const [advancedMode, setAdvancedMode] = useState(false);
  const { address, isConnected } = useAccount();
  const [depositLoading, setDepositLoading] = useState(false);
  const dispatch = useNotification();
  const { chain } = useNetwork();
  const provider = useProvider();
  var addresses = contractAddresses[1];
  const wethGatewaySigner = useContract({
    contractInterface: wethGatewayContract.abi,
    addressOrName: addresses.WETHGateway,
    signerOrProvider: signer,
  });

  async function getUserNFTs() {
    // Get lp positions
    const addressNFTs = await getAddressNFTs(address, props.nft, chain.id);
    setUserNFTs(addressNFTs);
    console.log(addressNFTs);
  }

  async function getNFTAllowance() {
    const nftContract = new ethers.Contract(props.nft, erc721, provider);
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

  async function getLPGaugeValue() {
    const gauge = new ethers.Contract(
      props.gauge,
      tradingGaugeContract.abi,
      provider
    );
    const value = await gauge.calculateLpValue(
      selectedNFTs.length,
      tokenAmount,
      initialPrice
    );

    console.log("Got lp gauge value:", value);

    setLPGaugeValue(value);
  }

  // Set the rest of the UI when we receive the reserve address
  useEffect(() => {
    if (props.pool && props.token && props.nft && isConnected) {
      console.log("Got trading pool address, setting the rest...", props.pool);
      getNFTAllowance();
      getUserNFTs();
    }
  }, [props.pool, props.token, props.nft, address]);

  // Update the LP gauge value when the token amount, select NFTs or initial price changes
  useEffect(() => {
    if (
      isConnected &&
      initialPrice &&
      tokenAmount &&
      props.gauge != ethers.constants.AddressZero &&
      selectedNFTs.length > 0
    ) {
      getLPGaugeValue();
    }
  }, [tokenAmount, selectedNFTs, initialPrice]);

  const handleDepositSuccess = async function () {
    // Reset the UI
    setSelectedNFTs([]);
    setInitialPrice("");
    setTokenAmount("");
    setDelta("");
    setLPGaugeValue("0");
    setFee("");
    setNFTAmount(0);

    props.updateUI();
    props.setVisibility(false);
    dispatch({
      type: "success",
      message: "Your tokens were deposited in the pool.",
      title: "Deposit Successful!",
      position: "bottomL",
    });
  };

  const handleDepositError = async function (error) {
    dispatch({
      type: "error",
      message: error,
      title: "Deposit Error!",
      position: "bottomL",
    });
  };

  const handleNFTApprovalSuccess = async function () {
    setApprovedNFT(true);
    dispatch({
      type: "success",
      message: "You can now deposit.",
      title: "Approval Successful!",
      position: "bottomL",
    });
  };

  function handleAdvancedModeChange(e) {
    if (e.target.checked == false) {
      setDelta("10");
      setFee("20");
    } else {
      setDelta("");
      setFee("");
    }

    setAdvancedMode(e.target.checked);
  }

  function handleTokenAmountChange(e) {
    if (e.target.value != "") {
      console.log("newTokenAmount", parseUnits(e.target.value, 18));
      setTokenAmount(parseUnits(e.target.value, 18));
    } else {
      setTokenAmount("");
    }
  }

  function handleInitialPriceChange(e) {
    if (e.target.value != "") {
      console.log("newInitialPrice", parseUnits(e.target.value, 18));
      setInitialPrice(parseUnits(e.target.value, 18));
    } else {
      setInitialPrice("");
    }
  }

  function handleDeltaChange(e) {
    if (e.target.value != "") {
      if (Number(e.target.value) > maxDelta) {
        setDelta(maxDelta);
      } else {
        setDelta(e.target.value);
      }
    } else {
      setDelta("");
    }
  }

  function handleFeeChange(e) {
    if (e.target.value != "") {
      // Update the max fee
      if (curve == "exponential") {
        setMaxDelta(
          Number(
            ((1 + Number(e.target.value * 0.9) / 100) /
              (1 - (Number(e.target.value) * 0.9) / 100) -
              1) *
              100
          ).toPrecision(4)
        );
      } else if (curve == "linear") {
        setMaxDelta(
          Number(
            formatUnits(
              initialPrice.sub(
                initialPrice
                  .mul(100 - Number(e.target.value) * 0.9)
                  .div(100 + Number(e.target.value) * 0.9)
              ),
              18
            )
          ).toPrecision(4)
        );
      }
      setFee(e.target.value);
    } else {
      setFee("");
    }
  }

  function handleCurveChange(e) {
    setCurve(e);
  }

  function handleLPTypeChange(e) {
    setLPType(e);
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-row space-x-4 items-center justify-center">
        <Typography variant="h6" className="pt-1">
          Advanced Mode:
        </Typography>
        <Switch size="lg" onChange={handleAdvancedModeChange} />
      </div>
      {advancedMode && (
        <div>
          <div className="flex items-center mt-8 justify-center">
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: "subtitle2.fontSize",
              }}
              className="border-b-2 border-pink-200 text-center"
            >
              <Link
                href="https://lenft.gitbook.io/lenft-docs/fundamentals/trading-lp-parameters"
                underline="none"
                target="_blank"
                color={"blue"}
              >
                {"Need help choosing your LP's parameters?"}
              </Link>
            </Box>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center mt-8 space-x-4">
            <Dropdown>
              <Dropdown.Button flat>
                {lpType &&
                  lpType
                    .replace(/([a-z])([A-Z])/g, "$1 $2")
                    .replace(/^./, lpType[0].toUpperCase())}
              </Dropdown.Button>
              <Dropdown.Menu
                aria-label="Static Actions"
                selectionMode="single"
                onAction={handleLPTypeChange}
                disallowEmptySelection
                selectedKeys={[lpType]}
              >
                <Dropdown.Item key="trade">Trade</Dropdown.Item>
                <Dropdown.Item key="tradeUp">Trade Up</Dropdown.Item>
                <Dropdown.Item key="tradeDown">Trade Down</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
            <Box
              className="fw-10/12 md:w-4/12 text-center p-2 border-2 border-pink-100 rounded-xl"
              sx={{
                fontFamily: "Monospace",
                fontSize: "subtitle2.fontSize",
              }}
            >
              {lpType == "trade"
                ? "Your LP's price will increase and decrease."
                : lpType == "tradeUp"
                ? "Your LP's price will only increase."
                : "Your LP's price will only decrease."}
            </Box>
          </div>
        </div>
      )}
      <div className="flex flex-col-reverse justify-center lg:flex-row">
        <div className="flex flex-col m-4">
          <div className="flex flex-col items-center justify-center mt-8">
            <Input
              label="Initial Price"
              type="number"
              placeholder="0.01 ETH"
              value={initialPrice ? Number(formatUnits(initialPrice, 18)) : ""}
              step="any"
              description="The initial spot price of the LP"
              validation={{
                numberMin: formatUnits("1", 18),
              }}
              onChange={handleInitialPriceChange}
            />
            <div className="flex flex-row items-center justify-center space-x-8 mt-8">
              <Box
                sx={{
                  fontFamily: "Monospace",
                  fontSize: "subtitle2.fontSize",
                }}
              >
                {"Buy: " +
                  (initialPrice && fee
                    ? Number(
                        formatUnits(
                          BigNumber.from(initialPrice)
                            .mul(100 - Number(fee))
                            .div(100),
                          18
                        )
                      ).toPrecision(3)
                    : "—")}
              </Box>
              <Box
                sx={{
                  fontFamily: "Monospace",
                  fontSize: "subtitle2.fontSize",
                }}
              >
                {"Sell: " +
                  (initialPrice && fee
                    ? Number(
                        formatUnits(
                          BigNumber.from(initialPrice)
                            .mul(100 + Number(fee))
                            .div(100),
                          18
                        )
                      ).toPrecision(3)
                    : "—")}
              </Box>
            </div>
          </div>

          {advancedMode && (
            <div>
              <div className="flex flex-row items-center my-8 justify-center">
                <Input
                  label="Fee %"
                  type="number"
                  placeholder="20 %"
                  value={fee}
                  step="any"
                  validation={{
                    numberMin: 0,
                  }}
                  description="Fee charged by your LP"
                  onChange={handleFeeChange}
                />
              </div>
              <div className="flex flex-col items-center mb-4 justify-center">
                <Box
                  className="mb-4"
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "subtitle2.fontSize",
                    fontWeight: "bold",
                  }}
                >
                  {"Max Delta: " +
                    maxDelta +
                    (curve == "exponential" ? " %" : " ETH")}
                </Box>
                <Input
                  label={
                    curve == "exponential"
                      ? "Delta %"
                      : curve == "linear"
                      ? "Delta (Amount)"
                      : "Delta"
                  }
                  value={delta}
                  type="number"
                  step="any"
                  placeholder={
                    curve == "exponential"
                      ? "10 %"
                      : curve == "linear"
                      ? "0.01 ETH"
                      : "0"
                  }
                  description="The price change after each buy or sell"
                  validation={{
                    numberMin: 0,
                    numberMax: maxDelta,
                  }}
                  onChange={handleDeltaChange}
                />
              </div>
            </div>
          )}
          <div className="flex flex-row items-center justify-center mt-8 mb-4">
            <Input
              label="ETH Amount"
              type="number"
              placeholder="2.5 ETH"
              value={tokenAmount ? Number(formatUnits(tokenAmount, 18)) : ""}
              step="any"
              validation={{
                numberMin: 0,
              }}
              description="Amount of ETH to deposit."
              onChange={handleTokenAmountChange}
            />
          </div>
          <div className="flex flex-row items-center justify-center m-8">
            {approvedNFT ? (
              <Button
                text={
                  nftAmount ? "Selected " + nftAmount + " NFTs" : "Select NFTs"
                }
                theme="secondary"
                isFullWidth
                loadingProps={{
                  spinnerColor: "#000000",
                  spinnerType: "loader",
                  direction: "right",
                  size: "24",
                }}
                loadingText=""
                onClick={async function () {
                  setSelectingNFTs(!selectingNFTs);
                }}
              />
            ) : (
              <Button
                text="Approve NFT"
                theme="secondary"
                isFullWidth
                loadingProps={{
                  spinnerColor: "#000000",
                  spinnerType: "loader",
                  direction: "right",
                  size: "24",
                }}
                loadingText=""
                isLoading={approvalNFTLoading}
                onClick={async function () {
                  try {
                    setApprovalNFTLoading(true);
                    console.log("signer.", signer);
                    const nftContract = new ethers.Contract(
                      props.nft,
                      erc721,
                      signer
                    );
                    const tx = await nftContract.setApprovalForAll(
                      addresses.WETHGateway,
                      true
                    );
                    await tx.wait(1);
                    handleNFTApprovalSuccess();
                  } catch (error) {
                    console.log(error);
                  } finally {
                    setApprovalNFTLoading(false);
                  }
                }}
              ></Button>
            )}
          </div>
          {selectingNFTs &&
            (userNFTs.length > 0 ? (
              <div className="flex flex-col items-center justify-center border-zinc-300	 border-4 p-4 border-black rounded-3xl">
                <Box
                  className="flex mb-4 mx-4 justify-center items-center"
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "subtitle2.fontSize",
                    fontWeight: "bold",
                  }}
                >
                  {"Beware: Deposited NFTs may be sold or swapped in the pool."}
                </Box>
                <div className="flex flex-row grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {userNFTs.map((nft, _) => (
                    <div
                      key={BigNumber.from(nft.tokenId).toNumber()}
                      className="flex items-center justify-center max-w-[300px]"
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
                                element ==
                                BigNumber.from(nft.tokenId).toNumber()
                            );
                            if (index == -1) {
                              newSelectedNFTs.push(
                                BigNumber.from(nft.tokenId).toNumber()
                              );
                              setNFTAmount(nftAmount + 1);
                            } else {
                              newSelectedNFTs.splice(index, 1);
                              setNFTAmount(nftAmount - 1);
                            }
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
              </div>
            ) : (
              <Box
                sx={{
                  fontFamily: "Monospace",
                  fontSize: "subtitle2.fontSize",
                  fontWeight: "bold",
                }}
                className="flex m-2 justify-center items-center text-center"
              >
                {"Couldn't find any " + props.nftName + "'s in your wallet"}
              </Box>
            ))}
        </div>
        <div className="flex flex-col items-center justify-center pr-8 mt-8 w-full lg:w-6/12">
          {advancedMode && (
            <div className="flex flex-row items-center justify-center m-4">
              <Box
                className="flex mx-4 justify-center items-center"
                sx={{
                  fontFamily: "Monospace",
                  fontSize: "subtitle2.fontSize",
                  fontWeight: "bold",
                }}
              >
                Price Change:
              </Box>
              <Dropdown>
                <Dropdown.Button flat>
                  {curve && curve.replace(/^./, curve[0].toUpperCase())}
                </Dropdown.Button>
                <Dropdown.Menu
                  aria-label="Static Actions"
                  selectionMode="single"
                  onAction={handleCurveChange}
                  disallowEmptySelection
                  selectedKeys={[curve]}
                >
                  <Dropdown.Item key="exponential">Exponential</Dropdown.Item>
                  <Dropdown.Item key="linear">Linear</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          )}
          <CurveChart
            curveType={curve}
            delta={delta ? delta : "10"}
            fee={fee ? fee : "20"}
            initialPrice={initialPrice ? formatUnits(initialPrice, 18) : "0.1"}
          />
        </div>
      </div>
      <Box
        className="flex flex-col m-4 border-2 border-black rounded-xl self-center py-2 px-3 max-w-fit"
        sx={{
          fontFamily: "Monospace",
          fontSize: "subtitle2.fontSize",
          fontWeight: "bold",
        }}
      >
        <Link
          href="https://lenft.gitbook.io/lenft-docs/fundamentals/trading-lp-parameters"
          target="_blank"
          className="mr-2"
        >
          {"LP Gauge Value "}
        </Link>
        {props.gauge != ethers.constants.AddressZero
          ? Number(formatUnits(lpGaugeValue, 18)).toPrecision(3) + " ETH"
          : "No gauge for pool"}
      </Box>
      <div className="flex flex-row items-center justify-center m-8">
        <Button
          text={
            "Deposit (" +
            (tokenAmount ? formatUnits(tokenAmount, 18) : 0) +
            " tokens, " +
            (nftAmount ? nftAmount : 0) +
            " NFTs)"
          }
          theme="secondary"
          isFullWidth
          loadingProps={{
            spinnerColor: "#000000",
            spinnerType: "loader",
            direction: "right",
            size: "24",
          }}
          disabled={!approvedNFT || (!tokenAmount && !nftAmount)}
          loadingText=""
          isLoading={depositLoading}
          onClick={async function () {
            try {
              if (initialPrice == 0) {
                dispatch({
                  type: "error",
                  message: "Your initial price should be greater than 1e-18",
                  title: "Initial Price",
                  position: "bottomL",
                });
              }
              setDepositLoading(true);
              console.log("Depositing to trading pool", props.pool);
              var curveAddress = "";
              var curveDelta = 0;
              var curveFee = 0;
              var type = 0;
              console.log("delta", delta);
              console.log("fee", fee);
              if (curve == "exponential") {
                curveAddress = addresses.ExponentialCurve;
                curveDelta = delta * 100;
                curveFee = fee * 100;
              } else if (curve == "linear") {
                curveAddress = addresses.LinearCurve;
                curveDelta = parseUnits(delta, 18);
                curveFee = fee * 100;
              }
              console.log("curveAddress", curveAddress);
              console.log("curveDelta", curveDelta);
              console.log("curveFee", curveFee);
              if (lpType == "tradeUp") {
                type = 1;
              } else if (lpType == "tradeDown") {
                type = 2;
              }

              const tx = await wethGatewaySigner.depositTradingPool(
                props.pool,
                type,
                selectedNFTs,
                initialPrice,
                curveAddress,
                curveDelta,
                curveFee,
                {
                  value: tokenAmount,
                }
              );
              await tx.wait(1);
              handleDepositSuccess();
            } catch (error) {
              const prefix = "execution reverted: ";
              const prefixIndex = error.message.indexOf(prefix);
              if (prefixIndex !== -1) {
                const start = prefixIndex + prefix.length;
                // Find the next quotation mark after the prefix
                const end = error.message.indexOf('"', start);
                const revertReason = error.message.slice(start, end);
                handleDepositError(revertReason);
              } else {
                handleDepositError("Deposit failed");
              }
            } finally {
              setDepositLoading(false);
            }
          }}
        ></Button>
      </div>
    </div>
  );
}

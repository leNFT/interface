import { useState, useEffect } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import {
  Button,
  Tooltip,
  Loading,
  useNotification,
  Typography,
} from "@web3uikit/core";
import { HelpCircle } from "@web3uikit/icons";
import { BigNumber } from "@ethersproject/bignumber";
import StyledModal from "../../../components/StyledModal";
import { formatUnits, parseUnits } from "@ethersproject/units";
import { getGaugeHistory } from "../../../helpers/getGaugeHistory.js";
import { getGauges } from "../../../helpers/getGauges.js";
import { getEpoch } from "../../../helpers/getEpoch.js";
import contractAddresses from "../../../contractAddresses.json";
import votingEscrowContract from "../../../contracts/VotingEscrow.json";
import gaugeControllerContract from "../../../contracts/GaugeController.json";
import tradingGaugeContract from "../../../contracts/TradingGauge.json";
import StakeTradingGauge from "../../../components/gauges/StakeTradingGauge";
import UnstakeTradingGauge from "../../../components/gauges/UnstakeTradingGauge";
import Box from "@mui/material/Box";
import { ethers } from "ethers";
import Card from "@mui/material/Card";
import { getNativeTokenPrice } from "../../../helpers/getNativeTokenPrice.js";
import { CardActionArea } from "@mui/material";
import CardContent from "@mui/material/CardContent";
import { Table } from "@nextui-org/react";
import {
  useAccount,
  useNetwork,
  useContract,
  useProvider,
  useSigner,
} from "wagmi";
import Router from "next/router";
import { useRouter } from "next/router";
import { ChevronLeft } from "@web3uikit/icons";
import { ExternalLink } from "@web3uikit/icons";

export default function TradingPoolGauge() {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const router = useRouter();
  const { data: signer } = useSigner();
  const [gaugeInfo, setGaugeInfo] = useState();
  const [gaugeHistory, setGaugeHistory] = useState([]);
  const [boost, setBoost] = useState(0);
  const [maturityMultiplier, setMaturityMultiplier] = useState(0);
  const [claimableRewards, setClaimableRewards] = useState("0");
  const [stakedLPs, setStakedLPs] = useState([]);
  const [selectedLP, setSelectedLP] = useState();
  const [visibleStakeModal, setVisibleStakeModal] = useState(false);
  const [visibleUnstakeModal, setVisibleUnstakeModal] = useState(false);
  const [loadingGauge, setLoadingGauge] = useState(false);
  const [clamingLoading, setClaimingLoading] = useState(false);
  const provider = useProvider();
  loadingGauge;
  const [epoch, setEpoch] = useState(0);
  const [apr, setAPR] = useState("0");
  const [userLockedValue, setUserLockedValue] = useState("0");
  const [loadingHistory, setLoadingHistory] = useState(true);
  const dispatch = useNotification();

  // Update the UI
  async function updateUI() {
    const gauge = new ethers.Contract(
      router.query.address,
      tradingGaugeContract.abi,
      provider
    );

    // Set gauge details
    const gaugeInfoResponse = await getGauges(
      chain ? chain.id : 1,
      router.query.address
    );
    setGaugeInfo(gaugeInfoResponse);
    console.log("gaugeInfoResponse", gaugeInfoResponse);
    const gaugeHistoryResponse = await getGaugeHistory(
      chain ? chain.id : 1,
      router.query.address
    );
    console.log("gaugeHistoryResponse", gaugeHistoryResponse);
    setGaugeHistory(gaugeHistoryResponse);
    setLoadingHistory(false);

    // Only get this part if the user is connected
    if (isConnected) {
      const boostResponse = await gauge.getUserBoost(address);
      console.log("boostResponse", boostResponse.toNumber());
      setBoost(boostResponse.toNumber());

      const maturityMultiplierResponse = await gauge.getUserMaturityMultiplier(
        address
      );

      setMaturityMultiplier(maturityMultiplierResponse.toNumber());

      const newUserLockedValue = await gauge.getUserLPValue(address);
      console.log("newUserLockedValue", newUserLockedValue.toString());
      setUserLockedValue(newUserLockedValue.toString());
      console.log("userLockedValue", userLockedValue);

      const stakedLPsBalanceResponse = await gauge.getBalanceOf(address);
      console.log("stakedLPsBalanceResponse", stakedLPsBalanceResponse);
      const stakedLPsAmount = stakedLPsBalanceResponse.toNumber();

      // Get staked lp positions
      const newStakedLps = [];

      for (let i = 0; i < stakedLPsAmount; i++) {
        const stakedLPResponse = await gauge.getLPOfOwnerByIndex(address, i);
        const stakedLP = stakedLPResponse.toNumber();

        newStakedLps.push(stakedLP);
      }

      setStakedLPs(newStakedLps);

      // Get the claimable rewards
      const updatedClaimableRewards = await gauge.callStatic.claim({
        from: address,
      });
      console.log("updatedClaimableRewards", updatedClaimableRewards);
      setClaimableRewards(updatedClaimableRewards.toString());
    }

    // Get the current epoch
    const updatedEpoch = getEpoch();
    console.log("updatedEpoch", updatedEpoch);
    setEpoch(updatedEpoch);

    const updateNativeTokenPrice = await getNativeTokenPrice(
      chain ? chain.id : 1
    );
    console.log("updateNativeTokenPrice", updateNativeTokenPrice);

    const previousGaugeRewards =
      gaugeHistoryResponse.length > 0 ? gaugeHistoryResponse[0].rewards : "0";

    if (gaugeInfoResponse.tvl == "0") {
      setAPR(0);
    } else {
      setAPR(
        BigNumber.from(previousGaugeRewards)
          .mul(100)
          .mul(52)
          .div(gaugeInfoResponse.tvl)
          .toNumber() * updateNativeTokenPrice
      );
    }
  }

  // Set the rest of the UI when we receive the reserve address
  useEffect(() => {
    updateUI();
  }, [isConnected, router.query.address, address]);

  const handleClaimingSuccess = async function () {
    dispatch({
      type: "success",
      message: "You have claimed your rewards.",
      title: "Claim Successful!",
      position: "bottomL",
    });
  };

  return (
    <div>
      <StyledModal
        hasFooter={false}
        title={"Stake LP"}
        isVisible={visibleStakeModal}
        width="50%"
        onCloseButtonPressed={function () {
          setVisibleStakeModal(false);
        }}
      >
        <StakeTradingGauge
          setVisibility={setVisibleStakeModal}
          gauge={router.query.address}
          lpToken={gaugeInfo?.pool.address}
          updateUI={updateUI}
        />
      </StyledModal>
      <StyledModal
        hasFooter={false}
        title={"Unstake LP"}
        width="50%"
        isVisible={visibleUnstakeModal}
        onCloseButtonPressed={function () {
          setVisibleUnstakeModal(false);
        }}
      >
        <UnstakeTradingGauge
          setVisibility={setVisibleUnstakeModal}
          gauge={router.query.address}
          lpToken={gaugeInfo?.pool.address}
          selectedLP={selectedLP}
          updateUI={updateUI}
        />
      </StyledModal>
      <div className="flex flex-row justify-center">
        <div className="flex flex-col justify-center mr-auto ml-4">
          <Button
            size="small"
            color="#eae5ea"
            iconLayout="icon-only"
            icon={<ChevronLeft fontSize="50px" />}
            onClick={async function () {
              Router.push({
                pathname: "/tradingPools",
              });
            }}
          />
        </div>
        <div className="flex flex-col justify-center break-all ml-4">
          <Box
            sx={{
              fontFamily: "Monospace",
              fontSize: "body2.fontSize",
            }}
          >
            {router.query.address &&
              router.query.address.slice(0, 10) +
                "..." +
                router.query.address.slice(-6)}
          </Box>
        </div>
        <div className="flex flex-col justify-center pb-1 mr-auto">
          <Button
            size="large"
            color="#eae5ea"
            iconLayout="icon-only"
            icon={<ExternalLink fontSize="20px" />}
            onClick={async function (_event) {
              if (chain.id == 1) {
                window.open(
                  "https://etherscan.io/address/" + router.query.address,
                  "_blank"
                );
              } else if (chain.id == 5) {
                window.open(
                  "https://sepolia.etherscan.io/address/" +
                    router.query.address,
                  "_blank"
                );
              }
            }}
          />
        </div>
      </div>
      <div className="flex flex-col items-center">
        <div className="flex flex-col md:flex-row justify-center items-center m-8 mb-2">
          <div className="flex flex-col items-center justify-center">
            <div className="flex flex-col p-4 items-center m-2 justify-center text-center rounded-3xl bg-black/5 shadow-lg w-11/12 space-y-1">
              <Box
                sx={{
                  fontFamily: "Monospace",
                  fontSize: "subtitle2.fontSize",
                }}
              >
                {"Gauge"}
              </Box>
              <Box
                sx={{
                  fontFamily: "Monospace",
                  fontSize: "h5.fontSize",
                  fontWeight: "bold",
                }}
              >
                {gaugeInfo?.pool.name}
              </Box>
            </div>
            <div className="flex flex-col py-4 px-8 items-center m-2 justify-center text-center rounded-3xl bg-black/5 shadow-lg max-w-fit">
              <div className="flex flex-row items-center justify-center">
                <div className="flex flex-col items-center ml-4 mr-8 space-y-6">
                  <Box
                    sx={{
                      fontFamily: "Monospace",
                      fontSize: "subtitle1.fontSize",
                      fontWeight: "bold",
                    }}
                  >
                    Epoch
                  </Box>
                  <Box sx={{ position: "relative" }}>
                    <Box
                      sx={{
                        fontFamily: "Monospace",
                        fontSize: "h4.fontSize",
                      }}
                    >
                      {epoch}
                    </Box>
                    <CircularProgress
                      variant="determinate"
                      thickness={4}
                      value={
                        ((Math.floor(Date.now() / 1000) % 604800) / 604800) *
                        100
                      }
                      size={80}
                      sx={{
                        color: "black",
                        position: "absolute",
                        top: -14,
                        left: -30,
                        zIndex: 1,
                      }}
                    />
                  </Box>
                </div>
                <div className="flex flex-col items-end m-2 border-l-2 border-stone-600 p-6">
                  <div className="flex flex-col items-end text-right mb-2">
                    <Box
                      sx={{
                        fontFamily: "Monospace",
                        fontSize: "subtitle2.fontSize",
                        fontWeight: "bold",
                      }}
                    >
                      APR
                    </Box>
                    <Box
                      sx={{
                        fontFamily: "Monospace",
                        fontSize: "subtitle1.fontSize",
                      }}
                    >
                      {Number(apr).toFixed(1) + "%"}
                    </Box>
                  </div>
                  <div className="flex flex-col items-end text-right mt-2">
                    <Box
                      sx={{
                        fontFamily: "Monospace",
                        fontSize: "subtitle2.fontSize",
                        fontWeight: "bold",
                      }}
                    >
                      TVL
                    </Box>
                    <Box
                      sx={{
                        fontFamily: "Monospace",
                        fontSize: "subtitle1.fontSize",
                      }}
                    >
                      {gaugeInfo
                        ? Number(formatUnits(gaugeInfo.tvl, 18)).toFixed(2) +
                          " ETH"
                        : "-" + " ETH"}
                    </Box>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center m-2 rounded-3xl bg-black/5 shadow-lg">
            {loadingHistory ? (
              <div className="flex flex-col items-center space-y-4 m-28">
                <Typography variant="h5">Loading Gauge History</Typography>
                <Loading size={40} spinnerColor="#000000" />
              </div>
            ) : (
              <Table
                shadow={false}
                bordered={false}
                aria-label="Gauge History"
                css={{
                  height: "auto",
                  minWidth: "30vw",
                  fontFamily: "Monospace",
                  zIndex: 0,
                }}
              >
                <Table.Header>
                  <Table.Column width={100}>Epoch</Table.Column>
                  <Table.Column width={120}>Gauge Stake</Table.Column>
                  <Table.Column width={100}>Rewards</Table.Column>
                </Table.Header>
                <Table.Body>
                  {gaugeHistory.map((data, i) => (
                    <Table.Row key={i}>
                      <Table.Cell>{data.epoch}</Table.Cell>
                      <Table.Cell>{data.stake / 100 + " %"}</Table.Cell>
                      <Table.Cell>
                        {Number(formatUnits(data.rewards, 18)).toFixed(3) +
                          " LE"}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            )}
          </div>
        </div>
        {isConnected ? (
          <div className="flex flex-col md:flex-row items-center justify-center p-4 border-grey m-8 lg:m-16 !mt-8">
            <div className="flex flex-col m-8 lg:mx-16">
              <div className="flex flex-col items-center p-4 rounded-3xl min-w-[280px] m-2 bg-black/5 shadow-lg">
                <div className="flex flex-col m-4 rounded-2xl">
                  <div className="flex flex-row m-2">
                    <div className="flex flex-col">
                      <Box
                        sx={{
                          fontFamily: "Monospace",
                          fontSize: "h6.fontSize",
                          fontWeight: "bold",
                        }}
                      >
                        My Gauge Info
                      </Box>
                    </div>
                    <div className="flex flex-col ml-1">
                      <Tooltip
                        content="The sum of all your LPs in this pool"
                        position="top"
                        minWidth={200}
                      >
                        <HelpCircle fontSize="20px" color="#000000" />
                      </Tooltip>
                    </div>
                  </div>
                  <div className="flex flex-row m-2 mb-0">
                    <div className="flex flex-col">
                      <Box
                        sx={{
                          fontFamily: "Monospace",
                          fontSize: "h5.fontSize",
                          fontWeight: "bold",
                        }}
                      >
                        {stakedLPs.length + " staked LPs"}
                      </Box>
                    </div>
                  </div>
                  <div className="flex flex-row mt-0 m-2">
                    <div className="flex flex-col">
                      <Box
                        sx={{
                          fontFamily: "Monospace",
                          fontSize: "caption.fontSize",
                        }}
                      >
                        {"worth " + formatUnits(userLockedValue, 18) + " ETH"}
                      </Box>
                    </div>
                  </div>
                  <div className="flex flex-col m-2 space-y-1 p-3 border-4 border-slate-400 rounded-lg">
                    <Box
                      sx={{
                        fontFamily: "Monospace",
                        fontSize: "subtitle2.fontSize",
                        fontWeight: "bold",
                      }}
                    >
                      {boost / 10000 + "x Boost"}
                    </Box>
                    <Box
                      sx={{
                        fontFamily: "Monospace",
                        fontSize: "subtitle2.fontSize",
                        fontWeight: "bold",
                      }}
                    >
                      {maturityMultiplier / 10000 + "x 🕚 Multiplier"}
                    </Box>
                  </div>
                </div>
                <div className="flex flex-row items-center ">
                  <div className="m-4">
                    <Button
                      customize={{
                        backgroundColor: "grey",
                        fontSize: 20,
                        textColor: "white",
                      }}
                      text="Stake in Gauge"
                      theme="custom"
                      size="large"
                      radius="12"
                      onClick={async function () {
                        setVisibleStakeModal(true);
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center rounded-3xl m-2 bg-black/5 shadow-lg">
                <div className="flex flex-col m-4 rounded-2xl">
                  <div className="flex flex-row m-2">
                    <div className="flex flex-col">
                      <Box
                        sx={{
                          fontFamily: "Monospace",
                          fontSize: "h6.fontSize",
                          fontWeight: "bold",
                        }}
                      >
                        Claimable:
                      </Box>
                    </div>
                    <div className="flex flex-col ml-1">
                      <Tooltip
                        content="The amount available to claim from this gauge"
                        position="top"
                        minWidth={200}
                      >
                        <HelpCircle fontSize="20px" color="#000000" />
                      </Tooltip>
                    </div>
                  </div>
                  <div className="flex flex-row m-2">
                    <div className="flex flex-col">
                      <Box
                        sx={{
                          fontFamily: "Monospace",
                          fontSize: "h6.fontSize",
                          fontWeight: "bold",
                        }}
                      >
                        {Number(formatUnits(claimableRewards, 18)).toFixed(2) +
                          " LE"}
                      </Box>
                    </div>
                  </div>
                </div>
                <div className="flex flex-row items-center ">
                  <div className="mb-4">
                    <Button
                      customize={{
                        backgroundColor: "grey",
                        fontSize: 20,
                        textColor: "white",
                      }}
                      text="Claim"
                      theme="custom"
                      size="large"
                      radius="12"
                      loadingProps={{
                        spinnerColor: "#000000",
                        spinnerType: "loader",
                        direction: "right",
                        size: "24",
                      }}
                      disabled={BigNumber.from(claimableRewards).eq(0)}
                      loadingText=""
                      isLoading={clamingLoading}
                      onClick={async function () {
                        const gauge = new ethers.Contract(
                          router.query.address,
                          tradingGaugeContract.abi,
                          signer
                        );
                        try {
                          setClaimingLoading(true);
                          console.log("signer.", signer);
                          const tx = await gauge.claim();
                          await tx.wait(1);
                          handleClaimingSuccess();
                        } catch (error) {
                          console.log(error);
                        } finally {
                          setClaimingLoading(false);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col border-4 border-slate-400 rounded-2xl p-8 m-8 lg:py-16 lg:px-16">
              {loadingGauge ? (
                <div className="flex m-4">
                  <Loading size={12} spinnerColor="#000000" />
                </div>
              ) : (
                <div>
                  {stakedLPs.length == 0 ? (
                    <Box
                      sx={{
                        fontFamily: "Monospace",
                        fontSize: "subtitle1.fontSize",
                      }}
                    >
                      <div>{"No LP Positions staked in this gauge."}</div>
                    </Box>
                  ) : (
                    <div className="grid auto-cols-auto gap-2">
                      {stakedLPs.map((data) => (
                        <div
                          key={data}
                          className="flex m-4 items-center justify-center max-w-[300px]"
                        >
                          <Card
                            sx={{
                              borderRadius: 4,
                              background:
                                "linear-gradient(to right bottom, #eff2ff, #f0e5e9)",
                            }}
                          >
                            <CardActionArea
                              onClick={function () {
                                setSelectedLP(data);
                                setVisibleUnstakeModal(true);
                              }}
                            >
                              <Box
                                sx={{
                                  fontFamily: "Monospace",
                                  fontSize: "subtitle1.fontSize",
                                }}
                                className="p-4"
                              >
                                <div className="flex flex-col mt-2 items-center text-center">
                                  <div>{"LP Position"}</div>
                                  <div>{"#" + data}</div>
                                </div>
                              </Box>
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
        ) : (
          <div className="flex justify-center m-8 lg:m-16">
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: "subtitle1.fontSize",
              }}
            >
              {"Please connect your wallet to stake in this gauge."}
            </Box>
          </div>
        )}
      </div>
    </div>
  );
}

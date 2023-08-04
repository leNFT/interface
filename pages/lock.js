import CircularProgress from "@mui/material/CircularProgress";
import { formatUnits, parseUnits } from "@ethersproject/units";
import StyledModal from "../components/StyledModal";
import { Table } from "@nextui-org/react";
import { useState, useEffect } from "react";
import {
  useAccount,
  useProvider,
  useNetwork,
  useContract,
  useSigner,
} from "wagmi";
import { getAddressNFTs } from "../helpers/getAddressNFTs";
import { getLockInfo } from "../helpers/getLockInfo";
import TextField from "@mui/material/TextField";
import Slider from "@mui/material/Slider";
import { Button, Loading, Typography, useNotification } from "@web3uikit/core";
import Autocomplete from "@mui/material/Autocomplete";
import { getLockHistory } from "../helpers/getLockHistory.js";
import { getNativeTokenPrice } from "../helpers/getNativeTokenPrice.js";
import { getGauges } from "../helpers/getGauges";
import { PieChartComponent } from "../components/PieChartComponent";
import { getGaugeBribes } from "../helpers/getGaugeBribes";
import { getGaugeVoteWeights } from "../helpers/getGaugeVoteWeights";
import LockNativeToken from "../components/LockNativeToken";
import Bribe from "../components/Bribe";
import RemoveBribe from "../components/RemoveBribe";
import EditNativeTokenLockAmount from "../components/EditNativeTokenLockAmount";
import EditNativeTokenLocktime from "../components/EditNativeTokenLocktime";
import contractAddresses from "../contractAddresses.json";
import UnlockNativeToken from "../components/UnlockNativeToken";
import votingEscrowContract from "../contracts/VotingEscrow.json";
import nativeTokenContract from "../contracts/NativeToken.json";
import feeDistributorContract from "../contracts/FeeDistributor.json";
import gaugeControllerContract from "../contracts/GaugeController.json";
import bribes from "../contracts/Bribes.json";
import Box from "@mui/material/Box";
import { BigNumber, ethers } from "ethers";

export default function Lock() {
  const dispatch = useNotification();
  const { isConnected, address } = useAccount();
  const { chain } = useNetwork();
  const provider = useProvider();
  const { data: signer } = useSigner();
  const [voteTokenBalance, setVoteTokenBalance] = useState("0");
  const [visibleLockModal, setVisibleLockModal] = useState(false);
  const [visibleUnlockModal, setVisibleUnlockModal] = useState(false);
  const [visibleBribeModal, setVisibleBribeModal] = useState(false);
  const [visibleRemoveBribeModal, setVisibleRemoveBribeModal] = useState(false);
  const [visibleEditLockAmountModal, setVisibleEditLockAmountModal] =
    useState(false);
  const [visibleEditLockTimeModal, setVisibleEditLockTimeModal] =
    useState(false);
  const [unlockTime, setUnlockTime] = useState(0);
  const [claimingLoading, setClaimingLoading] = useState(false);
  const [claimingRebatesLoading, setClaimingRebatesLoading] = useState(false);
  const [votingLoading, setVotingLoading] = useState(false);
  const [claimableFees, setClaimableFees] = useState("0");
  const [claimableRebates, setClaimableRebates] = useState("0");
  const [bribeRewards, setBribeRewards] = useState("0");
  const [claimingBribesLoading, setClaimingBribesLoading] = useState(false);
  const [selectedGauge, setSelectedGauge] = useState();
  const [gaugeVoteRatio, setGaugeVoteRatio] = useState(0);
  const [totalVoteRatio, setTotalVoteRatio] = useState(0);
  const [apr, setAPR] = useState("0");
  const [lockInfo, setLockInfo] = useState();
  const [loadingAPR, setLoadingAPR] = useState(true);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [gaugeVotes, setGaugeVotes] = useState(0);
  const [lockAmount, setLockAmount] = useState("0");
  const [gauges, setGauges] = useState({});
  const [lockedPositions, setLockedPositions] = useState([]);
  const [selectedLock, setSelectedLock] = useState();
  const [userBribes, setUserBribes] = useState("0");
  const [gaugeBribes, setGaugeBribes] = useState("0");
  const [allGaugeBribes, setAllGaugeBribes] = useState({});
  const [allGaugeWeights, setAllGaugeVoteWeights] = useState({});

  var addresses = contractAddresses[1];
  const votingEscrowProvider = useContract({
    contractInterface: votingEscrowContract.abi,
    addressOrName: addresses.VotingEscrow,
    signerOrProvider: provider,
  });

  const votingEscrowSigner = useContract({
    contractInterface: votingEscrowContract.abi,
    addressOrName: addresses.VotingEscrow,
    signerOrProvider: signer,
  });

  const bribesProvider = useContract({
    contractInterface: bribes.abi,
    addressOrName: addresses.Bribes,
    signerOrProvider: provider,
  });

  const bribesSigner = useContract({
    contractInterface: bribes.abi,
    addressOrName: addresses.Bribes,
    signerOrProvider: signer,
  });

  const feeDistributorProvider = useContract({
    contractInterface: feeDistributorContract.abi,
    addressOrName: addresses.FeeDistributor,
    signerOrProvider: provider,
  });

  const feeDistributorSigner = useContract({
    contractInterface: feeDistributorContract.abi,
    addressOrName: addresses.FeeDistributor,
    signerOrProvider: signer,
  });

  const gaugeControllerProvider = useContract({
    contractInterface: gaugeControllerContract.abi,
    addressOrName: addresses.GaugeController,
    signerOrProvider: provider,
  });

  const gaugeControllerSigner = useContract({
    contractInterface: gaugeControllerContract.abi,
    addressOrName: addresses.GaugeController,
    signerOrProvider: signer,
  });

  const nativeTokenProvider = useContract({
    contractInterface: nativeTokenContract.abi,
    addressOrName: addresses.NativeToken,
    signerOrProvider: provider,
  });

  async function updateLockDetails() {
    const updatedLockDetails = await votingEscrowProvider.getLock(selectedLock);
    console.log(
      "updatedUnlockTime:",
      BigNumber.from(updatedLockDetails.end).toNumber()
    );
    setUnlockTime(BigNumber.from(updatedLockDetails.end).toNumber());
    setLockAmount(updatedLockDetails.amount);

    //Get the vote token Balance
    const updatedVoteTokenBalance = await votingEscrowProvider.getLockWeight(
      selectedLock
    );
    setVoteTokenBalance(updatedVoteTokenBalance.toString());

    //Get the vote token Balance
    const updatedVoteRatio = await gaugeControllerProvider.getLockVoteRatio(
      selectedLock
    );
    console.log("address", address);
    console.log("updatedVoteRatio", updatedVoteRatio.toString());
    setTotalVoteRatio(updatedVoteRatio.toString());

    // Get the claimable fees
    const updatedClaimableFees = await feeDistributorProvider.callStatic.claim(
      addresses.ETH.address,
      selectedLock,
      {
        from: address,
      }
    );
    console.log("updatedClaimableFees", updatedClaimableFees);
    setClaimableFees(updatedClaimableFees.toString());

    // Get the claimbable rebates
    const updatedClaimableRebates =
      await votingEscrowProvider.callStatic.claimRebates(selectedLock, {
        from: address,
      });
    console.log("updatedClaimableRebates", updatedClaimableRebates);
    setClaimableRebates(updatedClaimableRebates.toString());
  }

  async function updateUI() {
    // Get the lock info
    const updatedLockInfo = await getLockInfo(chain.id);
    console.log("updatedLockInfo", updatedLockInfo);
    setLockInfo(updatedLockInfo);

    // Get the history
    const historyResponse = await getLockHistory(chain.id);
    setHistory(historyResponse);
    setLoadingHistory(false);

    const nativeTokenPrice = await getNativeTokenPrice(chain.id);

    // Calculate the APR
    if (
      nativeTokenPrice.toString() == "0" ||
      updatedLockInfo.totalWeight.toString() == "0"
    ) {
      setAPR(0);
    } else {
      setAPR(
        BigNumber.from(historyResponse[0].rewards)
          .mul(52)
          .mul(100)
          .div(updatedLockInfo.totalWeight)
          .toNumber()
      );
    }

    setLoadingAPR(false);

    // Get the NFTs that represent the user's locked positions
    const updatedLockedPositions = await getAddressNFTs(
      address,
      addresses.VotingEscrow,
      chain.id
    );
    console.log("updatedLockedPositions", updatedLockedPositions);
    setLockedPositions(updatedLockedPositions);

    // Get the gauges
    const updatedGauges = await getGauges(chain.id);
    console.log("updatedGauges", updatedGauges);
    setGauges(updatedGauges);

    // Get the gauge weights
    const updatedGaugeVoteWeights = await getGaugeVoteWeights(chain.id);
    console.log("updatedGaugeVoteWeights", updatedGaugeVoteWeights);
    setAllGaugeVoteWeights(updatedGaugeVoteWeights);

    // Get the gauge bribes
    const updatedGaugeBribes = await getGaugeBribes(chain.id);
    console.log("updatedGaugeBribes", updatedGaugeBribes);
    setAllGaugeBribes(updatedGaugeBribes);
  }

  async function updateGaugeDetails() {
    // Check if the gauge address is valid
    console.log("Updating Gauge Details");
    console.log("selectedGauge", selectedGauge);
    // Check if the address is a gauge
    const isGauge = await gaugeControllerProvider.isGauge(selectedGauge);
    console.log("isGauge", isGauge);

    if (isGauge) {
      // Get the number of votes for the gauge
      if (selectedLock) {
        const updatedGaugeVoteRatio =
          await gaugeControllerProvider.getLockVoteRatioForGauge(
            selectedLock,
            selectedGauge
          );
        console.log("updatedgaugeVoteRatio", updatedGaugeVoteRatio.toString());
        const updatedBribeRewards = await bribesProvider.callStatic.claim(
          addresses.ETH.address,
          selectedGauge,
          selectedLock,
          {
            from: address,
          }
        );
        console.log("updatedBribeRewards", updatedBribeRewards);
        setBribeRewards(updatedBribeRewards.toString());
        setGaugeVoteRatio(updatedGaugeVoteRatio.toNumber());
        setGaugeVotes(updatedGaugeVoteRatio.toNumber());
      }
      const updatedUserBribes = await bribesProvider.getUserBribes(
        addresses.ETH.address,
        selectedGauge,
        epoch + 1,
        address
      );
      console.log("updatedUserBribes", updatedUserBribes);
      const updatedGaugeBribes = await bribesProvider.getGaugeBribes(
        addresses.ETH.address,
        selectedGauge,
        epoch + 1
      );
      console.log("updatedGaugeBribes", updatedGaugeBribes);
      setGaugeBribes(updatedGaugeBribes.toString());
      setUserBribes(updatedUserBribes.toString());
    } else {
      setGaugeVoteRatio(0);
      setGaugeVotes(0);
      console.log("Gauge not found");
    }
  }

  useEffect(() => {
    if (isConnected) {
      addresses = contractAddresses[chain.id];
      updateUI();
    }
  }, [isConnected]);

  useEffect(() => {
    if (isConnected && selectedGauge) {
      updateGaugeDetails();
    }
  }, [selectedGauge]);

  useEffect(() => {
    if (isConnected && selectedLock) {
      console.log("Updating Lock Details", selectedLock);
      updateLockDetails();
      if (selectedGauge) {
        updateGaugeDetails();
      }
    }
  }, [selectedLock]);

  function handleVoteSliderChange(_, newValue) {
    console.log("gauge votes: ", newValue);
    setGaugeVotes(newValue * 100);
  }

  function handleGaugeChange(_event, value) {
    console.log("newGauge", value);
    if (ethers.utils.isAddress(value)) {
      setSelectedGauge(value);
    } else if (
      Object.values(gauges)
        .map((gauge) => gauge.pool.name)
        .includes(value)
    ) {
      console.log("FOund Gauge Name");
      const gaugeAddress = Object.keys(gauges).find(
        (gauge) => gauges[gauge].pool.name == value
      );
      setSelectedGauge(gaugeAddress);
    } else {
      setSelectedGauge();
    }
  }

  function handleLockChange(_event, value) {
    console.log("newLock", value);
    setSelectedLock(value);
  }

  const handleClaimSuccess = async function () {
    updateUI();
    dispatch({
      type: "success",
      message: "You claimed your rewards",
      title: "Claim Successful!",
      position: "bottomL",
    });
  };

  const handleClaimRebatesSuccess = async function () {
    updateUI();
    dispatch({
      type: "success",
      message: "You claimed your rebates",
      title: "Claim Successful!",
      position: "bottomL",
    });
  };

  const handleVoteSuccess = async function () {
    console.log("Voted");
    updateUI();
    dispatch({
      type: "success",
      message: "You have voted",
      title: "Vote Successful!",
      position: "bottomL",
    });
  };

  const handleClaimingBribesSuccess = async function () {
    dispatch({
      type: "success",
      message: "You claimed your bribes",
      title: "Claim Successful!",
      position: "bottomL",
    });
  };

  return (
    <div>
      <StyledModal
        hasFooter={false}
        title="Bribe Pool"
        isVisible={visibleBribeModal}
        onCloseButtonPressed={function () {
          setVisibleBribeModal(false);
        }}
      >
        <Bribe setVisibility={setVisibleBribeModal} gauge={selectedGauge} />
      </StyledModal>
      <StyledModal
        hasFooter={false}
        title="Remove Bribe"
        gaugeBribes={userBribes}
        isVisible={visibleRemoveBribeModal}
        onCloseButtonPressed={function () {
          setVisibleRemoveBribeModal(false);
        }}
      >
        <RemoveBribe
          setVisibility={setVisibleRemoveBribeModal}
          gauge={selectedGauge}
          userBribes={userBribes}
        />
      </StyledModal>
      <StyledModal
        hasFooter={false}
        title="Lock LE"
        isVisible={visibleLockModal}
        onCloseButtonPressed={function () {
          setVisibleLockModal(false);
        }}
      >
        <LockNativeToken
          setVisibility={setVisibleLockModal}
          updateUI={updateUI}
        />
      </StyledModal>
      <StyledModal
        hasFooter={false}
        title="Unlock LE"
        isVisible={visibleUnlockModal}
        onCloseButtonPressed={function () {
          setVisibleUnlockModal(false);
        }}
      >
        <UnlockNativeToken
          setVisibility={setVisibleUnlockModal}
          voteTokenBalance={voteTokenBalance}
          updateUI={updateUI}
          lockId={selectedLock ? selectedLock : 0}
        />
      </StyledModal>
      <StyledModal
        hasFooter={false}
        title="Edit Lock Amount"
        isVisible={visibleEditLockAmountModal}
        onCloseButtonPressed={function () {
          setVisibleEditLockAmountModal(false);
        }}
      >
        <EditNativeTokenLockAmount
          setVisibility={setVisibleEditLockAmountModal}
          updateUI={updateUI}
          lockId={selectedLock ? selectedLock : 0}
        />
      </StyledModal>
      <StyledModal
        hasFooter={false}
        title="Edit Lock Time"
        isVisible={visibleEditLockTimeModal}
        onCloseButtonPressed={function () {
          setVisibleEditLockTimeModal(false);
        }}
      >
        <EditNativeTokenLocktime
          setVisibility={setVisibleEditLockTimeModal}
          updateUI={updateUI}
          lockId={selectedLock ? selectedLock : 0}
        />
      </StyledModal>
      {!isConnected ? (
        <Box
          sx={{
            fontFamily: "Monospace",
            fontSize: "h6.fontSize",
            fontWeight: "bold",
          }}
          className="flex mt-8 justify-center"
        >
          Connect Your Wallet to View Your Locks
        </Box>
      ) : (
        <div className="flex flex-col items-center">
          <div className="flex flex-col w-full md:flex-row max-w-[100%] justify-center items-center m-4 md:m-8">
            <div className="flex flex-col py-4 px-8 md:mx-8 items-center justify-center text-center rounded-3xl bg-black/5 shadow-lg max-w-fit">
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
                      {lockInfo?.epoch}
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
                  <div className="flex flex-col items-end text-right mb-4">
                    <Box
                      sx={{
                        fontFamily: "Monospace",
                        fontSize: "subtitle2.fontSize",
                        fontWeight: "bold",
                      }}
                    >
                      Fees APR
                    </Box>
                    {loadingAPR ? (
                      <Loading
                        className="m-1"
                        size={16}
                        spinnerColor="#000000"
                      />
                    ) : (
                      <Box
                        sx={{
                          fontFamily: "Monospace",
                          fontSize: "subtitle1.fontSize",
                        }}
                      >
                        {(apr == 0 ? "—" : apr) + " %"}
                      </Box>
                    )}
                  </div>
                  <div className="flex flex-col items-end text-right my-4">
                    <Box
                      sx={{
                        fontFamily: "Monospace",
                        fontSize: "subtitle2.fontSize",
                        fontWeight: "bold",
                      }}
                    >
                      Locked Weight
                    </Box>
                    <Box
                      sx={{
                        fontFamily: "Monospace",
                        fontSize: "subtitle1.fontSize",
                      }}
                    >
                      {lockInfo &&
                        Math.floor(
                          Number(formatUnits(lockInfo.totalWeight, 18))
                        ) + " veLE"}
                    </Box>
                  </div>
                  <div className="flex flex-col items-end text-right my-4">
                    <Box
                      sx={{
                        fontFamily: "Monospace",
                        fontSize: "subtitle2.fontSize",
                        fontWeight: "bold",
                      }}
                    >
                      Total Locked
                    </Box>
                    <Box
                      sx={{
                        fontFamily: "Monospace",
                        fontSize: "subtitle1.fontSize",
                      }}
                    >
                      {lockInfo &&
                        Math.floor(
                          Number(formatUnits(lockInfo.totalLocked, 18))
                        ) + " LE"}
                    </Box>
                    <Box
                      sx={{
                        fontFamily: "Monospace",
                        fontSize: "subtitle2.fontSize",
                      }}
                    >
                      {lockInfo?.lockedRatio / 100 + "%"}
                    </Box>
                  </div>
                  <div className="flex flex-col items-end text-right mt-4">
                    <Box
                      sx={{
                        fontFamily: "Monospace",
                        fontSize: "subtitle2.fontSize",
                        fontWeight: "bold",
                      }}
                    >
                      LP Rewards
                    </Box>
                    <Box
                      sx={{
                        fontFamily: "Monospace",
                        fontSize: "subtitle1.fontSize",
                      }}
                    >
                      {lockInfo &&
                        Math.floor(formatUnits(lockInfo.epochRewards, 18)) +
                          " LE"}
                    </Box>
                    <Box
                      sx={{
                        fontFamily: "Monospace",
                        fontSize: "subtitle2.fontSize",
                      }}
                    >
                      {lockInfo &&
                        (BigNumber.from(lockInfo.rewardsCeiling).eq(0)
                          ? "0"
                          : BigNumber.from(lockInfo.epochRewards)
                              .mul(100)
                              .div(lockInfo.rewardsCeiling)
                              .toString()) + " %"}
                    </Box>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col m-2 rounded-3xl bg-black/5 shadow-lg">
              {loadingHistory ? (
                <div className="flex flex-col items-center justify-center text-center m-20 space-y-4">
                  <Box
                    sx={{
                      fontFamily: "Monospace",
                      fontSize: "subtitle2.fontSize",
                    }}
                  >
                    Loading Lock History
                  </Box>
                  <Loading size={30} spinnerColor="#000000" />
                </div>
              ) : (
                <Table
                  shadow={false}
                  bordered={false}
                  aria-label="Gauge History"
                  css={{
                    height: "auto",
                    zIndex: 0,
                    minWidth: "35vw",
                    fontFamily: "Monospace",
                  }}
                >
                  <Table.Header>
                    <Table.Column width={100}>Epoch</Table.Column>
                    <Table.Column width={120}>Locked Supply</Table.Column>
                    <Table.Column width={100}>Rewards</Table.Column>
                  </Table.Header>
                  <Table.Body>
                    {history.map((data, i) => (
                      <Table.Row key={i}>
                        <Table.Cell>{data.epoch}</Table.Cell>
                        <Table.Cell>
                          {data.supply_locked / 100 + " %"}
                        </Table.Cell>
                        <Table.Cell>
                          {Number(formatUnits(data.rewards, 18)).toPrecision(
                            3
                          ) + " ETH"}
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              )}
            </div>
          </div>
          <div className="flex flex-col 4 p-4 m-4 md:m-8 rounded-3xl bg-black/5 items-center shadow-lg">
            <div className="flex flex-col lg:flex-row max-w-[100%] justify-center items-center">
              <div className="flex flex-col p-4 m-4 md:m-8 rounded-3xl bg-black/5 items-center shadow-lg">
                <div className="flex p-4">
                  <Autocomplete
                    disablePortal
                    ListboxProps={{
                      style: {
                        backgroundColor: "rgb(253, 241, 244)",
                        fontFamily: "Monospace",
                      },
                    }}
                    options={lockedPositions.map((option) => option.tokenId)}
                    sx={{
                      minWidth: { xs: 215, sm: 300, md: 380 },
                    }}
                    onInputChange={handleLockChange}
                    renderOption={(props, option, state) => (
                      <div className="flex flex-row m-2" {...props}>
                        {"veLE #" + option}
                      </div>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Lock ID"
                        sx={{
                          "& label": {
                            paddingLeft: (theme) => theme.spacing(2),
                            fontFamily: "Monospace",
                            fontSize: "subtitle1.fontSize",
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
                </div>
                <div className="flex flex-col-reverse md:flex-row items-center justify-center">
                  <div className="flex flex-row md:flex-col items-center m-4 lg:ml-8">
                    <div className="flex flex-row m-2">
                      <Button
                        customize={{
                          backgroundColor: "grey",
                          fontSize: 16,
                          textColor: "white",
                        }}
                        text="New Lock"
                        theme="custom"
                        size="large"
                        radius="12"
                        onClick={async function () {
                          setVisibleLockModal(true);
                        }}
                      />
                    </div>
                    {unlockTime < Date.now() / 1000 ? (
                      <div className="flex flex-row m-2">
                        <Button
                          customize={{
                            backgroundColor: "grey",
                            fontSize: 16,
                            textColor: "white",
                          }}
                          disabled={!selectedLock}
                          text="Unlock"
                          theme="custom"
                          size="large"
                          radius="12"
                          onClick={async function () {
                            setVisibleUnlockModal(true);
                          }}
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="flex flex-row m-2">
                          <Button
                            customize={{
                              backgroundColor: "grey",
                              fontSize: 16,
                              textColor: "white",
                            }}
                            text="Edit Amount"
                            theme="custom"
                            size="large"
                            radius="12"
                            onClick={async function () {
                              setVisibleEditLockAmountModal(true);
                            }}
                          />
                        </div>
                        <div className="flex flex-row m-2">
                          <Button
                            customize={{
                              backgroundColor: "grey",
                              fontSize: 16,
                              textColor: "white",
                            }}
                            text="Edit Unlock Time"
                            theme="custom"
                            size="large"
                            radius="12"
                            onClick={async function () {
                              setVisibleEditLockTimeModal(true);
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col m-4 lg:m-8">
                    <div className="flex flex-col m-2">
                      <div className="flex flex-row">
                        <Box
                          sx={{
                            fontFamily: "Monospace",
                            fontSize: "h5.fontSize",
                            fontWeight: "bold",
                          }}
                        >
                          Locked Balance
                        </Box>
                      </div>
                      {selectedLock ? (
                        <div className="flex flex-col my-2 space-y-1">
                          <Box
                            sx={{
                              fontFamily: "Monospace",
                              fontSize: "subtitle1.fontSize",
                            }}
                          >
                            {Number(formatUnits(voteTokenBalance, 18)).toFixed(
                              2
                            ) +
                              " veLE (" +
                              Number(formatUnits(lockAmount, 18)).toFixed(2) +
                              " LE)"}
                          </Box>
                          <Box
                            sx={{
                              fontFamily: "Monospace",
                              fontSize: "subtitle1.fontSize",
                            }}
                          >
                            {"Locked until " +
                              (unlockTime > 0
                                ? new Date(
                                    unlockTime * 1000
                                  ).toLocaleDateString()
                                : "-")}
                          </Box>
                        </div>
                      ) : (
                        <div className="flex flex-col my-2 space-y-1">
                          <Box
                            sx={{
                              fontFamily: "Monospace",
                              fontSize: "subtitle1.fontSize",
                            }}
                          >
                            {"No Lock Selected"}
                          </Box>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col m-2">
                      <div className="flex flex-row">
                        <Box
                          sx={{
                            fontFamily: "Monospace",
                            fontSize: "h5.fontSize",
                            fontWeight: "bold",
                          }}
                        >
                          Claimable Rewards
                        </Box>
                      </div>
                      {selectedLock ? (
                        <div>
                          <div className="flex flex-row my-2 items-center">
                            <Box
                              sx={{
                                fontFamily: "Monospace",
                                fontSize: "subtitle1.fontSize",
                              }}
                            >
                              {Number(
                                formatUnits(claimableFees, 18)
                              ).toPrecision(3) + " wETH"}
                            </Box>
                            <div className="ml-4">
                              <Button
                                customize={{
                                  backgroundColor: "grey",
                                  fontSize: 16,
                                  textColor: "white",
                                }}
                                disabled={BigNumber.from(claimableFees).eq(0)}
                                text="Claim wETH"
                                theme="custom"
                                size="small"
                                Loading={claimingLoading}
                                onClick={async function () {
                                  try {
                                    setClaimingLoading(true);
                                    const tx = await feeDistributorSigner.claim(
                                      addresses.ETH.address
                                    );
                                    await tx.wait(1);
                                    await handleClaimSuccess();
                                  } catch (error) {
                                    console.log(error);
                                  } finally {
                                    setClaimingLoading(false);
                                  }
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex flex-row my-2 items-center">
                            <Box
                              sx={{
                                fontFamily: "Monospace",
                                fontSize: "subtitle1.fontSize",
                              }}
                            >
                              {Number(
                                formatUnits(claimableRebates, 18)
                              ).toFixed(2) + " LE"}
                            </Box>
                            <div className="ml-4">
                              <Button
                                customize={{
                                  backgroundColor: "grey",
                                  fontSize: 16,
                                  textColor: "white",
                                }}
                                disabled={BigNumber.from(claimableRebates).eq(
                                  0
                                )}
                                text="Claim LE"
                                theme="custom"
                                size="small"
                                Loading={claimingRebatesLoading}
                                onClick={async function () {
                                  try {
                                    setClaimingLoading(true);
                                    const tx =
                                      await votingEscrowSigner.claimRebates(
                                        selectedLock
                                      );
                                    await tx.wait(1);
                                    await handleClaimRebatesSuccess();
                                  } catch (error) {
                                    console.log(error);
                                  } finally {
                                    setClaimingRebatesLoading(false);
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col my-2 space-y-1">
                          <Box
                            sx={{
                              fontFamily: "Monospace",
                              fontSize: "subtitle1.fontSize",
                            }}
                          >
                            {"No Lock Selected"}
                          </Box>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col md:flex-row items-center justify-center m-4 md:m-8 rounded-3xl bg-black/5 shadow-lg">
                {selectedLock && (
                  <div className="flex flex-col m-4">
                    <div className="flex flex-col m-4">
                      <div className="flex flex-row">
                        <Box
                          sx={{
                            fontFamily: "Monospace",
                            fontSize: "subtitle1.fontSize",
                            fontWeight: "bold",
                          }}
                        >
                          Used Voting Power
                        </Box>
                      </div>
                      <div className="flex flex-row">
                        <Box
                          sx={{
                            fontFamily: "Monospace",
                            fontSize: "subtitle1.fontSize",
                          }}
                        >
                          {totalVoteRatio / 100 + " %"}
                        </Box>
                      </div>
                    </div>

                    <div className="flex flex-col m-4">
                      <div className="flex flex-row">
                        <Box
                          sx={{
                            fontFamily: "Monospace",
                            fontSize: "subtitle1.fontSize",
                            fontWeight: "bold",
                          }}
                        >
                          Selected Gauge
                        </Box>
                      </div>
                      <div className="flex flex-row">
                        <Box
                          sx={{
                            fontFamily: "Monospace",
                            fontSize: "subtitle1.fontSize",
                          }}
                        >
                          {(selectedGauge ? gaugeVoteRatio / 100 : "─") + " %"}
                        </Box>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex flex-col justify-center items-center m-8 p-6 rounded-3xl bg-black/5 shadow-lg">
                  <div className="flex flex-col items-center m-4">
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
                      options={Object.values(gauges).map(
                        (option) => option.pool.name
                      )}
                      sx={{ minWidth: { xs: 260, sm: 320, md: 380 } }}
                      onInputChange={handleGaugeChange}
                      renderOption={(props, option, state) => (
                        <div className="flex flex-row m-4" {...props}>
                          {option}
                        </div>
                      )}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Gauge"
                          sx={{
                            "& label": {
                              paddingLeft: (theme) => theme.spacing(2),
                              fontFamily: "Monospace",
                              fontSize: "subtitle1.fontSize",
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
                    <div className="flex flex-row mt-1">
                      <Box
                        sx={{
                          fontFamily: "Monospace",
                          fontSize: "caption.fontSize",
                        }}
                      >
                        {selectedGauge !== undefined
                          ? selectedGauge == ""
                            ? "Gauge not found"
                            : "Gauge found"
                          : "Enter a gauge address"}
                      </Box>
                    </div>
                  </div>
                  {selectedGauge && (
                    <div className="flex flex-col justify-center items-center">
                      <div className="flex flex-row justify-center space-y-2 items-center m-2 w-full">
                        <div className="flex flex-col m-4 p-2 w-5/12">
                          <div className="flex flex-col justify-center space-y-2 m-2 border-4 rounded-xl px-6 py-4 border-slate-500 w-full">
                            <div className="flex flex-row">
                              <Box
                                sx={{
                                  fontFamily: "Monospace",
                                  fontSize: "subtitle2.fontSize",
                                  fontWeight: "bold",
                                }}
                              >
                                Rewards next epoch
                              </Box>
                            </div>
                            <div className="flex flex-row my-2 items-center">
                              <Box
                                sx={{
                                  fontFamily: "Monospace",
                                  fontSize: "subtitle1.fontSize",
                                }}
                              >
                                {Number(
                                  formatUnits(gaugeBribes, 18)
                                ).toPrecision(3) + " wETH"}
                              </Box>
                            </div>
                          </div>
                          {selectedLock ? (
                            <div className="flex flex-col justify-center space-y-2 m-2 border-4 rounded-xl p-6 border-slate-500 w-full">
                              <div className="flex flex-row">
                                <Box
                                  sx={{
                                    fontFamily: "Monospace",
                                    fontSize: "subtitle2.fontSize",
                                    fontWeight: "bold",
                                  }}
                                >
                                  Vote
                                </Box>
                              </div>
                              <Slider
                                defaultValue={gaugeVoteRatio / 100}
                                value={gaugeVotes / 100}
                                valueLabelDisplay="auto"
                                valueLabelFormat={(value) => value + "%"}
                                onChange={handleVoteSliderChange}
                                min={0}
                                step={1}
                                max={
                                  (10000 - totalVoteRatio + gaugeVoteRatio) /
                                  100
                                }
                              />
                              <div className="flex flex-row justify-center">
                                <Button
                                  customize={{
                                    backgroundColor: "grey",
                                    fontSize: 16,
                                    textColor: "white",
                                  }}
                                  text={
                                    (gaugeVoteRatio == 0
                                      ? "Vote with "
                                      : "Update to ") +
                                    gaugeVotes / 100 +
                                    " %"
                                  }
                                  disabled={!selectedGauge}
                                  isLoading={votingLoading}
                                  loadingText=""
                                  theme="custom"
                                  size="large"
                                  radius="12"
                                  onClick={async function () {
                                    try {
                                      setVotingLoading(true);
                                      const tx =
                                        await gaugeControllerSigner.vote(
                                          selectedLock,
                                          selectedGauge,
                                          gaugeVotes
                                        );
                                      await tx.wait(1);
                                      await handleVoteSuccess(gaugeVotes);
                                    } catch (error) {
                                      console.log(error);
                                    } finally {
                                      setVotingLoading(false);
                                    }
                                  }}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="flex p-8 text-center justify-center">
                              <Box
                                sx={{
                                  fontFamily: "Monospace",
                                  fontSize: "subtitle1.fontSize",
                                }}
                              >
                                Select a lock to vote
                              </Box>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col justify-center border-4 rounded-xl m-4 p-4 border-slate-500 w-5/12">
                          <div className="flex flex-col mx-2 mb-6">
                            <div className="flex flex-row">
                              <Box
                                sx={{
                                  fontFamily: "Monospace",
                                  fontSize: "subtitle2.fontSize",
                                  fontWeight: "bold",
                                }}
                              >
                                Bribe Rewards
                              </Box>
                            </div>
                            <div className="flex flex-row my-2 items-center">
                              <Box
                                sx={{
                                  fontFamily: "Monospace",
                                  fontSize: "subtitle1.fontSize",
                                }}
                              >
                                {Number(
                                  formatUnits(bribeRewards, 18)
                                ).toPrecision(3) + " wETH"}
                              </Box>
                              <div className="ml-4">
                                <Button
                                  customize={{
                                    backgroundColor: "grey",
                                    fontSize: 16,
                                    textColor: "white",
                                  }}
                                  disabled={BigNumber.from(bribeRewards).eq(0)}
                                  text="Claim"
                                  theme="custom"
                                  size="small"
                                  Loading={claimingBribesLoading}
                                  onClick={async function () {
                                    try {
                                      setClaimingLoading(true);
                                      const tx = await bribesSigner.claim(
                                        addresses.ETH.address,
                                        selectedGauge,
                                        selectedLock
                                      );
                                      await tx.wait(1);
                                      await handleClaimingBribesSuccess();
                                    } catch (error) {
                                      console.log(error);
                                    } finally {
                                      setClaimingBribesLoading(false);
                                    }
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col mx-2">
                            <div className="flex flex-row">
                              <Box
                                sx={{
                                  fontFamily: "Monospace",
                                  fontSize: "subtitle2.fontSize",
                                  fontWeight: "bold",
                                }}
                              >
                                Bribes Deposited
                              </Box>
                            </div>
                            <div className="flex flex-col space-y-2 md:flex-row my-2 items-center">
                              <Box
                                sx={{
                                  fontFamily: "Monospace",
                                  fontSize: "subtitle1.fontSize",
                                }}
                              >
                                {Number(
                                  formatUnits(userBribes, 18)
                                ).toPrecision(3) + " wETH"}
                              </Box>
                              <div className="flex flex-row justify-center space-x-1 items-center ml-1">
                                <Button
                                  customize={{
                                    backgroundColor: "grey",
                                    fontSize: 16,
                                    textColor: "white",
                                  }}
                                  text="+"
                                  disabled={!selectedGauge}
                                  loadingText=""
                                  theme="custom"
                                  size="small"
                                  radius="12"
                                  onClick={async function () {
                                    setVisibleBribeModal(true);
                                  }}
                                />
                                <Button
                                  customize={{
                                    backgroundColor: "grey",
                                    fontSize: 16,
                                    textColor: "white",
                                  }}
                                  text="-"
                                  disabled={!selectedGauge || userBribes == 0}
                                  loadingText=""
                                  theme="custom"
                                  size="small"
                                  radius="12"
                                  onClick={async function () {
                                    setVisibleRemoveBribeModal(true);
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {gaugeVoteRatio != 0 && (
                        <div className="flex flex-row justify-center w-8/12 text-center">
                          <Typography
                            variant="subtitle2"
                            color="#BF6958"
                            sx={{ fontFamily: "Monospace" }}
                          >
                            ⚠️ Claim your bribe rewards BEFORE updating your
                            vote. If you don&apos;t, you will lose your bribes.
                            ⚠️
                          </Typography>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col w-full xl:w-[80%] 4 p-4 m-4 md:m-8 rounded-3xl bg-black/5 items-center shadow-lg">
            <div className="flex flex-col lg:flex-row items-center justify-center w-full">
              <div className="flex flex-col w-full lg:w-8/12 justify-center items-center p-8 border-b-2 lg:border-b-0 lg:border-r-2 border-black">
                {lockInfo?.epoch > 0 ? (
                  <PieChartComponent
                    title={"Gauge Vote Weights"}
                    data={allGaugeWeights}
                  />
                ) : (
                  "Gauge weights will be available after the first epoch."
                )}
              </div>
              <div className="flex flex-col w-full lg:w-6/12 justify-center items-center p-8">
                {Object.values(allGaugeBribes).every(
                  (value) => value == "0"
                ) ? (
                  "No bribes for next epoch."
                ) : (
                  <PieChartComponent
                    title={"Next Epoch Bribes"}
                    data={allGaugeBribes}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

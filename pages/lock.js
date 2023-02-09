import styles from "../styles/Home.module.css";
import { formatUnits, parseUnits } from "@ethersproject/units";
import StyledModal from "../components/StyledModal";
import { useState, useEffect } from "react";
import {
  useAccount,
  useProvider,
  useNetwork,
  useContract,
  useSigner,
} from "wagmi";
import Vote from "../components/gauges/Vote";
import { Input } from "@nextui-org/react";
import { Button } from "@web3uikit/core";
import LockNativeToken from "../components/LockNativeToken";
import EditNativeTokenLock from "../components/EditNativeTokenLock";
import contractAddresses from "../contractAddresses.json";
import UnlockNativeToken from "../components/UnlockNativeToken";
import votingEscrowContract from "../contracts/VotingEscrow.json";
import feeDistributorContract from "../contracts/FeeDistributor.json";
import gaugeControllerContract from "../contracts/GaugeController.json";
import curvePoolContract from "../contracts/CurvePool.json";
import Box from "@mui/material/Box";
import { BigNumber, ethers } from "ethers";

export default function Lock() {
  const { isConnected, address } = useAccount();
  const { chain } = useNetwork();
  const provider = useProvider();
  const { data: signer } = useSigner();
  const [voteTokenBalance, setVoteTokenBalance] = useState("0");
  const [visibleLockModal, setVisibleLockModal] = useState(false);
  const [visibleUnlockModal, setVisibleUnlockModal] = useState(false);
  const [visibleVoteModal, setVisibleVoteModal] = useState(false);
  const [visibleEditLockModal, setVisibleEditLockModal] = useState(false);
  const [apr, setAPR] = useState("0");
  const [unlockTime, setUnlockTime] = useState(0);
  const [claimingLoading, setClaimingLoading] = useState(false);
  const [claimableRewards, setClaimableRewards] = useState("0");
  const [selectedGauge, setSelectedGauge] = useState();
  const [gaugeVoteRatio, setGaugeVoteRatio] = useState(0);
  const [totalVoteRatio, setTotalVoteRatio] = useState(0);
  const [epoch, setEpoch] = useState(0);
  const [totalLocked, setTotalLocked] = useState("0");
  const [tokenPrice, setTokenPrice] = useState("0");

  const addresses =
    isConnected && chain.id in contractAddresses
      ? contractAddresses[chain.id]
      : contractAddresses["5"];

  const votingEscrowProvider = useContract({
    contractInterface: votingEscrowContract.abi,
    addressOrName: addresses.VotingEscrow,
    signerOrProvider: provider,
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

  const curvePoolProvider = useContract({
    contractInterface: curvePoolContract.abi,
    addressOrName: addresses.CurvePool,
    signerOrProvider: provider,
  });

  async function updateUI() {
    const updatedUnlockTime = await votingEscrowProvider.locked(address);
    console.log(
      "updatedUnlockTime:",
      BigNumber.from(updatedUnlockTime.end).toNumber()
    );
    setUnlockTime(BigNumber.from(updatedUnlockTime.end).toNumber());

    //Get the vote token Balance
    const updatedVoteTokenBalance = await votingEscrowProvider.balanceOf(
      address
    );
    setVoteTokenBalance(updatedVoteTokenBalance.toString());

    //Get the vote token Balance
    const updatedVoteRatio = await gaugeControllerProvider.userVoteRatio(
      address
    );
    console.log("address", address);
    console.log("updatedVoteRatio", updatedVoteRatio.toString());
    setTotalVoteRatio(updatedVoteRatio.toString());

    // Get the current epoch
    const updatedEpoch = await votingEscrowProvider.epoch(
      Math.floor(Date.now() / 1000)
    );
    console.log("updatedEpoch", updatedEpoch.toNumber());
    setEpoch(updatedEpoch.toNumber());

    // Get the total locked amount
    const updatedTotalLocked =
      await votingEscrowProvider.callStatic.totalSupply();
    console.log("updatedTotalLocked", updatedTotalLocked.toString());
    setTotalLocked(updatedTotalLocked.toString());

    // Get the claimable rewards
    const updatedClaimableRewards =
      await feeDistributorProvider.callStatic.claim(addresses.ETH.address, {
        from: address,
      });
    console.log("updatedClaimableRewards", updatedClaimableRewards);
    setClaimableRewards(updatedClaimableRewards.toString());

    // Get the APR
    const updatedTotalFees = await feeDistributorProvider.totalFeesAt(
      addresses.ETH.address,
      updatedEpoch.toNumber() == 0 ? 0 : updatedEpoch.toNumber() - 1
    );
    const updateNativeTokenPrice = await curvePoolProvider.callStatic.get_dy(
      1,
      0,
      parseUnits("1", 18).toString()
    );
    setTokenPrice(updateNativeTokenPrice.toString());

    if (
      updateNativeTokenPrice.toString() == "0" ||
      updatedTotalLocked.toString() == "0"
    ) {
      setAPR(0);
    } else {
      setAPR(
        BigNumber.from(updatedTotalFees)
          .mul(100)
          .div(updatedTotalLocked)
          .div(updateNativeTokenPrice)
          .toNumber()
      );
    }
  }

  async function updateGaugeDetails(gauge) {
    // Check if the gauge address is valid
    if (!ethers.utils.isAddress(gauge)) {
      console.log("Invalid Gauge Address");
      setSelectedGauge("");
      setGaugeVoteRatio(0);
      return;
    }

    console.log("Updating Gauge Details");
    // Check if the address is a gauge
    const isGauge = await gaugeControllerProvider.isGauge(gauge);

    if (isGauge) {
      setSelectedGauge(gauge);
      // Get the number of votes for the gauge
      const updatedGaugeVoteRatio =
        await gaugeControllerProvider.userVoteRatioForGauge(address, gauge);
      console.log("updatedgaugeVoteRatio", updatedGaugeVoteRatio.toString());
      setGaugeVoteRatio(updatedGaugeVoteRatio.toNumber());
    } else {
      setSelectedGauge("");
      setGaugeVoteRatio(0);
      console.log("Gauge not found");
    }
  }

  useEffect(() => {
    if (isConnected) {
      updateUI();
    }
  }, [isConnected]);

  const handleGaugeChange = (event) => {
    const newGauge = event.target.value;
    console.log("newGauge", newGauge);
    if (newGauge) {
      updateGaugeDetails(newGauge);
    } else {
      setSelectedGauge();
    }
  };

  const handleClaimSuccess = async function () {
    dispatch({
      type: "success",
      message: "You claimed your rewards",
      title: "Claim Successful!",
      position: "bottomL",
    });
  };

  return (
    <div>
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
        />
      </StyledModal>
      <StyledModal
        hasFooter={false}
        title="Edit Lock"
        isVisible={visibleEditLockModal}
        onCloseButtonPressed={function () {
          setVisibleEditLockModal(false);
        }}
      >
        <EditNativeTokenLock
          setVisibility={setVisibleEditLockModal}
          updateUI={updateUI}
        />
      </StyledModal>
      <StyledModal
        hasFooter={false}
        title={"Vote for Gauge"}
        isVisible={visibleVoteModal}
        onCloseButtonPressed={function () {
          setVisibleVoteModal(false);
        }}
      >
        <Vote
          setVisibility={setVisibleVoteModal}
          gauge={selectedGauge}
          updateUI={updateUI}
          updateGaugeDetails={updateGaugeDetails}
        />
      </StyledModal>
      <div className="flex flex-col items-center">
        <div className="flex flex-col py-4 px-8 m-8 mb-4 items-center justify-center text-center rounded-3xl bg-black/5 shadow-lg max-w-fit">
          <Box
            sx={{
              fontFamily: "Monospace",
              fontSize: "subtitle2.fontSize",
              fontWeight: "bold",
            }}
            className="mb-2 border-2 border-stone-600 rounded-2xl p-2 px-4 w-fit"
          >
            {Number(formatUnits(tokenPrice, 18)).toFixed(5) + " LE / ETH"}
          </Box>
          <div className="flex flex-row items-center justify-center">
            <div className="flex flex-col items-start m-2 mx-4">
              <Box
                sx={{
                  fontFamily: "Monospace",
                  fontSize: "subtitle1.fontSize",
                }}
              >
                Epoch
              </Box>
              <Box
                sx={{
                  fontFamily: "Monospace",
                  fontSize: "h4.fontSize",
                }}
              >
                {epoch}
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
                  APR
                </Box>
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "subtitle1.fontSize",
                  }}
                >
                  {apr + " %"}
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
                  Total Locked
                </Box>
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "subtitle1.fontSize",
                  }}
                >
                  {Number(formatUnits(totalLocked, 18)).toFixed() + " veLE"}
                </Box>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row max-w-[100%] justify-center items-center">
          <div className="flex flex-col border-4 p-4 m-4 md:m-8 rounded-3xl bg-black/5 items-center shadow-lg">
            <div className="flex flex-col-reverse md:flex-row items-center justify-center">
              {unlockTime < Date.now() / 1000 ? (
                <div className="flex flex-row md:flex-col items-center m-4 lg:ml-8">
                  <div className="flex flex-row m-2">
                    <Button
                      customize={{
                        backgroundColor: "grey",
                        fontSize: 16,
                        textColor: "white",
                      }}
                      text="Lock"
                      theme="custom"
                      size="large"
                      radius="12"
                      onClick={async function () {
                        setVisibleLockModal(true);
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
                      text="Unlock"
                      theme="custom"
                      size="large"
                      radius="12"
                      onClick={async function () {
                        setVisibleUnlockModal(true);
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-row md:flex-col items-center m-4 lg:ml-8">
                  <div className="flex flex-row m-2">
                    <Button
                      customize={{
                        backgroundColor: "grey",
                        fontSize: 16,
                        textColor: "white",
                      }}
                      text="Edit Lock"
                      theme="custom"
                      size="large"
                      radius="12"
                      onClick={async function () {
                        setVisibleEditLockModal(true);
                      }}
                    />
                  </div>
                </div>
              )}
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
                  <div className="flex flex-row my-2">
                    <Box
                      sx={{
                        fontFamily: "Monospace",
                        fontSize: "subtitle1.fontSize",
                      }}
                    >
                      {Number(formatUnits(voteTokenBalance, 18)).toFixed(2) +
                        " veLE"}
                    </Box>
                  </div>
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
                  <div className="flex flex-row my-2 items-center">
                    <Box
                      sx={{
                        fontFamily: "Monospace",
                        fontSize: "subtitle1.fontSize",
                      }}
                    >
                      {formatUnits(claimableRewards, 18) + " wETH"}
                    </Box>
                    <div className="ml-4">
                      <Button
                        customize={{
                          backgroundColor: "grey",
                          fontSize: 16,
                          textColor: "white",
                        }}
                        disabled={BigNumber.from(claimableRewards).eq(0)}
                        text="Claim"
                        theme="custom"
                        size="small"
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
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center border-4 m-4 md:m-8 rounded-3xl bg-black/5 shadow-lg">
            <div className="flex flex-col md:flex-row items-center mb:m-4 justify-center">
              <div className="flex flex-row m-4">
                <div className="flex flex-col m-4">
                  <div className="flex flex-row">
                    <Box
                      sx={{
                        fontFamily: "Monospace",
                        fontSize: "h6.fontSize",
                        fontWeight: "bold",
                      }}
                    >
                      Used Votes
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
              </div>
            </div>
            <div className="flex flex-col justify-center items-center m-8 p-4 rounded-3xl bg-black/5 shadow-lg">
              <div className="flex flex-col items-center m-4 mb-8">
                <Input
                  bordered
                  aria-label="Gauge Address"
                  size="xl"
                  placeholder="Gauge Address"
                  onChange={handleGaugeChange}
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
                      : "Select a gauge"}
                  </Box>
                </div>
              </div>
              <div className="flex flex-col-reverse md:flex-row">
                <div className="flex flex-col justify-center m-4">
                  <div className="flex flex-row justify-center items-center m-2">
                    <Button
                      customize={{
                        backgroundColor: "grey",
                        fontSize: 16,
                        textColor: "white",
                      }}
                      text="Vote"
                      disabled={!selectedGauge}
                      theme="custom"
                      size="large"
                      radius="12"
                      onClick={async function () {
                        setVisibleVoteModal(true);
                      }}
                    />
                  </div>
                </div>
                <div className="flex flex-col justify-center">
                  <div className="flex flex-row m-2">
                    <div className="flex flex-col">
                      <div className="flex flex-row">
                        <Box
                          sx={{
                            fontFamily: "Monospace",
                            fontSize: "subtitle1.fontSize",
                            fontWeight: "bold",
                          }}
                        >
                          My Gauge Votes
                        </Box>
                      </div>
                      <div className="flex flex-row">
                        <Box
                          sx={{
                            fontFamily: "Monospace",
                            fontSize: "subtitle1.fontSize",
                          }}
                        >
                          {gaugeVoteRatio / 100 + " %"}
                        </Box>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

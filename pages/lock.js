import styles from "../styles/Home.module.css";
import { formatUnits } from "@ethersproject/units";
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
  const [selectedGauge, setSelectedGauge] = useState("");
  const [gaugeVotingPower, setGaugeVotingPower] = useState(0);

  const [votePower, setVotePower] = useState("0");

  const addresses =
    chain && chain.id in contractAddresses
      ? contractAddresses[chain.id]
      : contractAddresses["1"];

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
    const updatedVotePower = await gaugeControllerProvider.voteUserPower(
      address
    );
    setVotePower(updatedVotePower.toString());

    // Get the claimable rewards
    const updatedClaimableRewards =
      await feeDistributorProvider.callStatic.claim(addresses.ETH.address, {
        from: address,
      });
    console.log("updatedClaimableRewards", updatedClaimableRewards);
    setClaimableRewards(updatedClaimableRewards.toString());
  }

  async function updateGaugeDetails(gauge) {
    // Check if the gauge address is valid
    if (!ethers.utils.isAddress(gauge)) {
      console.log("Invalid Gauge Address");
      setSelectedGauge("");
      return;
    }

    console.log("Updating Gauge Details");
    // Get the voting power details for the pool
    const gaugeWeight = await gaugeControllerProvider.getGaugeWeight(gauge);
    const totalWeight = await gaugeControllerProvider.getTotalWeight();
    const isGauge = await gaugeControllerProvider.isGauge(gauge);

    if (isGauge) {
      setSelectedGauge(gauge);
      if (!totalWeight.eq(0)) {
        setGaugeVotingPower(
          BigNumber.from(gaugeWeight).mul(10000).div(totalWeight)
        );
      } else {
        setGaugeVotingPower(0);
        console.log("totalWeight is 0");
      }
    } else {
      setSelectedGauge("");
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
    }
  };

  const handleClaimSuccess = async function () {
    dispatch({
      type: "success",
      message: "You claimed your rewards",
      title: "Claim Successful!",
      position: "topR",
    });
  };

  return (
    <div className={styles.container}>
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
        title="Unlock LE"
        isVisible={visibleEditLockModal}
        onCloseButtonPressed={function () {
          setVisibleUnlockModal(false);
        }}
      >
        <EditNativeTokenLock
          setVisibility={setVisibleEditLockModal}
          updateUI={updateUI}
        />
      </StyledModal>
      <StyledModal
        hasFooter={false}
        title={"Vote for "}
        isVisible={visibleVoteModal}
        onCloseButtonPressed={function () {
          setVisibleVoteModal(false);
        }}
      >
        <Vote
          setVisibility={setVisibleVoteModal}
          gauge={selectedGauge}
          updateGaugeDetails={updateGaugeDetails}
        />
      </StyledModal>
      <div className="flex flex-col items-center">
        <div className="flex flex-col max-w-[100%] lg:flex-row justify-center items-center">
          <div className="flex flex-col border-4 m-4 md:m-8 rounded-3xl bg-black/5 items-center shadow-lg">
            <div className="flex flex-row items-center justify-center py-4 px-8 m-8 mb-4 text-center rounded-3xl bg-black/5 shadow-lg max-w-fit">
              <Box
                sx={{
                  fontFamily: "Monospace",
                  fontSize: "h6.fontSize",
                  fontWeight: "bold",
                }}
              >
                {"Vault APR = " + apr + "%"}
              </Box>
            </div>
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
          <div className="flex flex-col items-center justify-center border-4 m-4 md:m-8 rounded-3xl bg-black/5 shadow-lg">
            <div className="flex flex-col md:flex-row min-w-[85%] items-center mx-4 my-2 justify-center">
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
                      My Used Voting Power
                    </Box>
                  </div>
                  <div className="flex flex-row">
                    <Box
                      sx={{
                        fontFamily: "Monospace",
                        fontSize: "subtitle1.fontSize",
                      }}
                    >
                      {votePower / 100 + " %"}
                    </Box>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-center items-center m-8 mt-0 p-4 rounded-3xl bg-black/5 shadow-lg">
              <div className="flex flex-row m-8">
                <Input
                  bordered
                  aria-label="Gauge Address"
                  size="xl"
                  placeholder="Gauge Address"
                  onChange={handleGaugeChange}
                />
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
                            fontSize: "h6.fontSize",
                            fontWeight: "bold",
                          }}
                        >
                          Voting Power
                        </Box>
                      </div>
                      <div className="flex flex-row">
                        <Box
                          sx={{
                            fontFamily: "Monospace",
                            fontSize: "subtitle1.fontSize",
                          }}
                        >
                          {gaugeVotingPower / 1000 + " %"}
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

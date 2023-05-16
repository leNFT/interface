import { BigNumber } from "@ethersproject/bignumber";
import {
  useAccount,
  useNetwork,
  useContract,
  useProvider,
  useSigner,
} from "wagmi";
import { formatUnits, parseUnits } from "@ethersproject/units";
import {
  useNotification,
  Button,
  Input,
  Typography,
  DatePicker,
} from "@web3uikit/core";
import { ethers } from "ethers";
import contractAddresses from "../contractAddresses.json";
import { useState, useEffect } from "react";
import votingEscrowContract from "../contracts/VotingEscrow.json";
import Slider from "@mui/material/Slider";

export default function EditNativeTokenLock(props) {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const provider = useProvider();
  const { data: signer } = useSigner();

  const [increaseUnlocktimeLoading, setIncreaseUnlocktimeLoading] =
    useState(false);
  const [unlockTime, setUnlockTime] = useState(0);
  const [lockWeight, setLockWeight] = useState("0");
  const [addWeeksToLock, setAddWeeksToLock] = useState(0);
  const [newLockWeight, setNewLockWeight] = useState("0");
  const [amount, setAmount] = useState("0");

  const dispatch = useNotification();
  var addresses = contractAddresses["11155111"];

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

  async function getLockWeight() {
    const updatedLockWeight = await votingEscrowProvider.balanceOf(address);
    console.log("Updated Lock Weight:", updatedLockWeight);
    setLockWeight(updatedLockWeight.toString());
  }

  async function getUnlockTime() {
    const updatedLockedDetails = await votingEscrowProvider.getLock(address);
    console.log(
      "updatedUnlockTime:",
      BigNumber.from(updatedLockedDetails.end).toNumber()
    );
    setAmount(updatedLockedDetails.amount.toString());
    setUnlockTime(BigNumber.from(updatedLockedDetails.end).toNumber());
  }

  useEffect(() => {
    if (isConnected) {
      addresses = contractAddresses[chain.id];
      getLockWeight();
      getUnlockTime();
    }
  }, [isConnected]);

  async function handleSliderChange(_, newValue) {
    if (newValue != "") {
      setAddWeeksToLock(newValue);
      const simulatedLockWeight = await votingEscrowProvider.simulateLock(
        amount,
        unlockTime + newValue * 604800
      );
      console.log("amount:", amount);
      console.log("simulatedLockWeight:", unlockTime + newValue * 604800);

      setNewLockWeight(
        BigNumber.from(simulatedLockWeight).add(lockWeight).toString()
      );
    } else {
      setNewLockWeight(0);
      setAddWeeksToLock(0);
    }
  }

  const handleIncreseUnlocktimeSuccess = async function () {
    props.updateUI();
    props.setVisibility(false);
    dispatch({
      type: "success",
      message: "You increased your unlock time.",
      title: "Increase Unlock Time Successful!",
      position: "bottomL",
    });
  };

  return (
    <div>
      <div className="flex flex-row items-center justify-center mt-8">
        <div className="flex flex-row items-center space-x-8 md:space-x-16 p-4 text-center justify-center">
          <div className="flex flex-col space-y-2">
            <Typography variant="subtitle2">Lock Weight</Typography>
            <Typography variant="body16">
              {Number(formatUnits(lockWeight, 18)).toPrecision(5) + " veLE"}
            </Typography>
          </div>
          <div className="flex flex-col space-y-2">
            <Typography variant="subtitle2">New Lock Weight</Typography>
            <Typography variant="body16">
              {newLockWeight == 0
                ? "−"
                : Number(formatUnits(newLockWeight, 18)).toPrecision(5) +
                  " veLE"}
            </Typography>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center mt-16 m-8 space-y-8">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col items-center text-center justify-center md:flex-row space-x-4">
            <Typography variant="subtitle2">Unlock Time:</Typography>
            <Typography variant="body16">
              {new Date(
                (unlockTime + addWeeksToLock * 604800) * 1000
              ).toUTCString()}
            </Typography>
          </div>
          <div className="flex flex-row items-center justify-center p-4">
            <Slider
              valueLabelDisplay="auto"
              onChange={handleSliderChange}
              min={1}
              step={1}
              max={
                52 * 4 - Math.floor((unlockTime - Date.now() / 1000) / 86400)
              }
            />
          </div>
        </div>
        <div className="mx-4 w-full">
          <Button
            text={
              "Increase unlock time by " +
              (addWeeksToLock > 52
                ? Math.floor(addWeeksToLock / 52) +
                  " years and " +
                  (addWeeksToLock % 52) +
                  " weeks"
                : addWeeksToLock + " weeks")
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
            isLoading={increaseUnlocktimeLoading}
            onClick={async function () {
              try {
                setIncreaseUnlocktimeLoading(true);
                const tx = await votingEscrowSigner.increaseUnlockTime(
                  unlockTime + addWeeksToLock * 604800
                );
                await tx.wait(1);
                handleIncreseUnlocktimeSuccess();
              } catch (error) {
                console.log(error);
              } finally {
                setIncreaseUnlocktimeLoading(false);
              }
            }}
          ></Button>
        </div>
      </div>
    </div>
  );
}

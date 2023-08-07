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
import Slider from "@mui/material/Slider";
import { ethers } from "ethers";
import contractAddresses from "../contractAddresses.json";
import { useState, useEffect } from "react";
import votingEscrowContract from "../contracts/VotingEscrow.json";
import nativeTokenContract from "../contracts/NativeToken.json";
import Box from "@mui/material/Box";

export default function LockNativeToken(props) {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const provider = useProvider();
  const { data: signer } = useSigner();
  const [amount, setAmount] = useState("1");
  const [balance, setBalance] = useState("0");
  const [lockedLoading, setLockedLoading] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [unlockTime, setUnlockTime] = useState(
    Math.floor(Date.now() / 1000) + 86400 * 21
  );
  const [lockWeight, setLockWeight] = useState("0");
  const [lockDuration, setLockDuration] = useState(3);
  const [allowance, setAllowance] = useState("0");

  const dispatch = useNotification();
  var addresses = contractAddresses[1];
  const nativeTokenProvider = useContract({
    contractInterface: nativeTokenContract.abi,
    addressOrName: addresses.NativeToken,
    signerOrProvider: provider,
  });

  const nativeTokenSigner = useContract({
    contractInterface: nativeTokenContract.abi,
    addressOrName: addresses.NativeToken,
    signerOrProvider: signer,
  });

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

  async function getTokenBalance() {
    const updatedBalance = await nativeTokenProvider.balanceOf(address);

    console.log("Updated Balance:", updatedBalance);
    setBalance(updatedBalance.toString());
  }

  async function getTokenAllowance() {
    const allowance = await nativeTokenProvider.allowance(
      address,
      addresses.VotingEscrow
    );
    setAllowance(allowance.toString());
    console.log("Got allowance:", BigNumber.from(allowance).toString());
  }

  useEffect(() => {
    if (isConnected) {
      addresses = contractAddresses[chain.id];
      getTokenAllowance();
      getTokenBalance();
    }
  }, [isConnected]);

  useEffect(() => {
    if (isConnected && amount && unlockTime) {
      console.log("Simulating lock weight");
      console.log("Amount:", amount);
      console.log("Unlock Time:", unlockTime);
      const simulateBlockWeight = async () => {
        const simulatedLockWeight = await votingEscrowProvider.simulateLock(
          amount,
          unlockTime
        );
        console.log("Simulated Lock Weight:", simulatedLockWeight.toString());
        setLockWeight(BigNumber.from(simulatedLockWeight).toString());
      };

      simulateBlockWeight();
    }
  }, [amount, lockDuration]);

  const handleLockedSuccess = async function () {
    console.log("Locked", amount);
    props.updateUI();
    props.setVisibility(false);
    dispatch({
      type: "success",
      message: "Your LE tokens were locked in the escrow contract.",
      title: "Lock Successful!",
      position: "bottomL",
    });
  };

  const handleApprovalSuccess = async function () {
    getTokenAllowance();
    dispatch({
      type: "success",
      message: "You can now lock tokens in the escrow contract.",
      title: "Approval Successful!",
      position: "bottomL",
    });
  };

  function handleAmountChange(e) {
    if (e.target.value != "") {
      console.log("Amount changed to:", e.target.value);
      setAmount(parseUnits(e.target.value, 18).toString());
    } else {
      setAmount("0");
    }
  }

  function handleSliderChange(_, newValue) {
    if (newValue != "") {
      setLockDuration(newValue);
      setUnlockTime(Math.floor(Date.now() / 1000 + newValue * 604800));
      console.log("Slider changed to:");
      console.log(Math.floor(Date.now() / 1000 + newValue * 604800));
    } else {
      setLockDuration(3);
      setUnlockTime(Date.now() / 1000 + 86400 * 21);
    }
  }

  return (
    <div>
      <div className="flex flex-row items-center justify-center mt-8">
        <div className="flex flex-row items-center space-x-16 justify-center">
          <div className="flex flex-col">
            <Typography variant="subtitle2">Lock Weight</Typography>
            <Typography variant="body16">
              {lockWeight == 0
                ? "−"
                : Number(formatUnits(lockWeight, 18)).toPrecision(5) + " veLE"}
            </Typography>
          </div>
        </div>
      </div>
      <div className="flex flex-row items-center justify-center m-8">
        <div className="flex flex-col items-center justify-center">
          <div className="flex flex-row items-left w-full p-2 space-x-4">
            <Typography variant="subtitle2">My Balance:</Typography>
            <Typography variant="body16">
              {Number(formatUnits(balance, 18)).toPrecision(6) + " LE"}
            </Typography>
          </div>
          <Input
            label="Amount"
            type="number"
            step="any"
            validation={{
              numberMax: Number(formatUnits(0, 18)),
              numberMin: 0,
            }}
            disabled={BigNumber.from(allowance).lte(amount)}
            onChange={handleAmountChange}
          />
        </div>
      </div>
      <div className="flex flex-col items-center justify-center m-8">
        <div className="flex flex-col m-4 items-center">
          <Box
            sx={{
              fontFamily: "Monospace",
              fontSize: "subtitle1.fontSize",
              fontWeight: "bold",
            }}
          >
            Unlock Time (weeks):
          </Box>
          <Box
            sx={{
              fontFamily: "Monospace",
              fontSize: "caption.fontSize",
            }}
          >
            (3 weeks to 4 years from today)
          </Box>
        </div>
        <div className="flex flex-row items-center w-full justify-center md:px-8">
          <Slider
            valueLabelDisplay="auto"
            disabled={BigNumber.from(allowance).lte(amount)}
            onChangeCommitted={handleSliderChange}
            min={3}
            step={1}
            max={52 * 4}
          />
        </div>
      </div>
      {BigNumber.from(allowance).gte(amount) ? (
        <div className="my-4 md:m-8">
          <Button
            text={
              "Lock for " +
              (lockDuration > 52
                ? Math.floor(lockDuration / 52) +
                  " years and " +
                  (lockDuration % 52) +
                  " weeks"
                : lockDuration + " weeks")
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
            isLoading={lockedLoading}
            onClick={async function () {
              try {
                setLockedLoading(true);
                console.log("amount", amount);
                console.log("unlockTime", unlockTime);
                console.log("addresses.VotingEscrow", addresses.VotingEscrow);
                const tx = await votingEscrowSigner.createLock(
                  address,
                  amount,
                  unlockTime
                );
                await tx.wait(1);
                handleLockedSuccess();
              } catch (error) {
                console.log(error);
              } finally {
                setLockedLoading(false);
              }
            }}
          ></Button>
        </div>
      ) : (
        <div className="m-8 mt-2">
          <Button
            text="Approve"
            theme="secondary"
            isFullWidth
            loadingProps={{
              spinnerColor: "#000000",
              spinnerType: "loader",
              direction: "right",
              size: "24",
            }}
            loadingText=""
            isLoading={approvalLoading}
            onClick={async function () {
              try {
                setApprovalLoading(true);
                const tx = await nativeTokenSigner.approve(
                  addresses.VotingEscrow,
                  ethers.constants.MaxUint256
                );
                await tx.wait(1);
                handleApprovalSuccess();
              } catch (error) {
                console.log(error);
              } finally {
                setApprovalLoading(false);
              }
            }}
          ></Button>
        </div>
      )}
    </div>
  );
}

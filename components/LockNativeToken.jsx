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
  const [amount, setAmount] = useState("0");
  const [balance, setBalance] = useState("0");
  const [approved, setApproved] = useState(false);
  const [lockedLoading, setLockedLoading] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [unlockTime, setUnlockTime] = useState(0);
  const [lockDuration, setLockDuration] = useState(1);

  const dispatch = useNotification();
  const addresses =
    isConnected && chain.id in contractAddresses
      ? contractAddresses[chain.id]
      : contractAddresses["5"];

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

  async function getUnlockTime() {
    const updatedUnlockTime = await votingEscrowProvider.locked(address);
    console.log(
      "updatedUnlockTime:",
      BigNumber.from(updatedUnlockTime.end).toNumber()
    );
    setUnlockTime(BigNumber.from(updatedUnlockTime.end).toNumber());
  }

  async function getTokenAllowance() {
    const allowance = await nativeTokenProvider.allowance(
      address,
      addresses.VotingEscrow
    );
    console.log("Got allowance:", allowance);

    if (!allowance.eq(BigNumber.from(0))) {
      setApproved(true);
    }
  }

  useEffect(() => {
    if (isConnected) {
      getTokenAllowance();
      getTokenBalance();
      getUnlockTime();
    }
  }, [isConnected]);

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
    setApproved(true);
    dispatch({
      type: "success",
      message: "You can now lock tokens in the escrow contract.",
      title: "Approval Successful!",
      position: "bottomL",
    });
  };

  function handleAmountChange(e) {
    if (e.target.value != "") {
      setAmount(parseUnits(e.target.value, 18).toString());
    } else {
      setAmount("0");
    }
  }

  function handleSliderChange(_, newValue) {
    if (newValue != "") {
      setLockDuration(newValue);
      setUnlockTime(Math.floor(Date.now() / 1000 + newValue * 604800));
      console.log(Date.now() / 1000 + newValue * 604800);
    } else {
      setLockDuration(1);
      setUnlockTime(0);
    }
  }

  return (
    <div>
      <div className="flex flex-row items-center justify-center">
        <div className="flex flex-col">
          <Typography variant="subtitle2">My Balance</Typography>
          <Typography variant="body16">
            {formatUnits(balance, 18) + " LE"}
          </Typography>
        </div>
      </div>
      <div className="flex flex-row items-center justify-center m-8">
        <Input
          label="Amount"
          type="number"
          step="any"
          validation={{
            numberMax: Number(formatUnits(0, 18)),
            numberMin: 0,
          }}
          disabled={!approved}
          onChange={handleAmountChange}
        />
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
            (1 week to 4 years from today)
          </Box>
        </div>
        <div className="flex flex-row items-center w-full justify-center md:px-8">
          <Slider
            valueLabelDisplay="auto"
            onChangeCommitted={handleSliderChange}
            min={1}
            step={1}
            max={52 * 4}
          />
        </div>
      </div>
      {approved ? (
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

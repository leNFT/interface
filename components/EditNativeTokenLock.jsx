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
import nativeTokenContract from "../contracts/NativeToken.json";
import Box from "@mui/material/Box";

export default function EditNativeTokenLock(props) {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const provider = useProvider();
  const { data: signer } = useSigner();
  const [amount, setAmount] = useState("0");
  const [balance, setBalance] = useState("0");
  const [approved, setApproved] = useState(false);
  const [increaseUnlocktimeLoading, setIncreaseUnlocktimeLoading] =
    useState(false);
  const [increaseLockAmountLoading, setIncreaseLockAmountLoading] =
    useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [unlockTime, setUnlockTime] = useState(0);

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

  const handleIncreseLockAmountSuccess = async function () {
    props.updateUI();
    props.setVisibility(false);
    dispatch({
      type: "success",
      message: "You increased your lock amount.",
      title: "Increase Lock Amount Successful!",
      position: "bottomL",
    });
  };

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

  function handleUnlockTimeChange(e) {
    if (e.date != "") {
      setUnlockTime(Date.parse(e.date) / 1000);
      console.log(Date.parse(e.date) / 1000);
    } else {
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
      <div className="flex flex-row items-center justify-center m-8 md:m-16">
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
        {approved ? (
          <div className="mx-4">
            <Button
              text="Increase Lock Amount"
              theme="secondary"
              isFullWidth
              loadingProps={{
                spinnerColor: "#000000",
                spinnerType: "loader",
                direction: "right",
                size: "24",
              }}
              loadingText=""
              isLoading={increaseLockAmountLoading}
              onClick={async function () {
                try {
                  setIncreaseLockAmountLoading(true);
                  console.log("amount", amount);
                  console.log("addresses.VotingEscrow", addresses.VotingEscrow);
                  const tx = await votingEscrowSigner.increaseAmount(amount);
                  await tx.wait(1);
                  handleIncreseLockAmountSuccess();
                } catch (error) {
                  console.log(error);
                } finally {
                  setIncreaseLockAmountLoading(false);
                }
              }}
            ></Button>
          </div>
        ) : (
          <div className="mx-4">
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
      <div className="flex flex-col md:flex-row items-center justify-center m-8 md:m-16">
        <DatePicker id="date-picker" onChange={handleUnlockTimeChange} />
        <div className="mx-4">
          <Button
            text="Increase Unlock Time"
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
                console.log("unlockTime", unlockTime);
                const tx = await votingEscrowSigner.increaseUnlockTime(
                  unlockTime
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

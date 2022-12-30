import { BigNumber } from "@ethersproject/bignumber";
import styles from "../styles/Home.module.css";
import { useNotification, Button, Input, Typography } from "@web3uikit/core";
import { formatUnits, parseUnits } from "@ethersproject/units";
import contractAddresses from "../contractAddresses.json";
import {
  useAccount,
  useNetwork,
  useContract,
  useProvider,
  useSigner,
} from "wagmi";
import { useState, useEffect } from "react";
import votingEscrowContract from "../contracts/VotingEscrow.json";

export default function WithdrawNativeToken(props) {
  const ONE_DAY = 86400;
  const ONE_WEEK = ONE_DAY * 7;
  const UNVOTE_WINDOW = ONE_DAY * 2;
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const [unlockTime, setUnlockTime] = useState(0);
  const provider = useProvider();
  const { data: signer } = useSigner();
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [amount, setAmount] = useState("0");
  const [lastWithdrawalRequest, setLastWithdrawalRequest] = useState({
    amount: "0",
    timestamp: 0,
  });
  const addresses =
    chain && chain.id in contractAddresses
      ? contractAddresses[chain.id]
      : contractAddresses["1"];
  const dispatch = useNotification();

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

  async function getUnlockTime() {
    const updatedUnlockTime = await votingEscrowProvider.locked(address);
    console.log(
      "updatedUnlockTime:",
      BigNumber.from(updatedUnlockTime.end).toNumber()
    );
    setUnlockTime(BigNumber.from(updatedUnlockTime.end).toNumber());
  }

  useEffect(() => {
    if (isConnected) {
      getUnlockTime();
    }
  }, [isConnected]);

  const handleUnlockNativeTokenSuccess = async function () {
    props.updateUI();
    props.setVisibility(false);
    dispatch({
      type: "success",
      message: "Please wait for transaction confirmation.",
      title: "Withdrawal Successful!",
      position: "topR",
    });
  };

  function handleInputChange(e) {
    if (e.target.value != "") {
      setAmount(parseUnits(e.target.value, 18).toString());
    } else {
      setAmount("0");
    }
  }

  return (
    <div>
      {unlockTime < Date.now() / 1000 ? (
        <div className="flex flex-col items-center m-8">
          <Typography variant="subtitle2">
            Locked until {Date(unlockTime)}
          </Typography>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="flex flex-col">
            <Typography variant="subtitle2">
              Maximum withdrawal amount
            </Typography>
            <Typography variant="body16"></Typography>
          </div>
          <Input
            label="Amount"
            type="number"
            step="any"
            onChange={handleInputChange}
          />
          <div className="m-8 mt-2">
            <Button
              text="Withdraw"
              theme="secondary"
              isFullWidth
              loadingProps={{
                spinnerColor: "#000000",
                spinnerType: "loader",
                direction: "right",
                size: "24",
              }}
              loadingText=""
              isLoading={withdrawalLoading}
              onClick={async function () {
                if (
                  BigNumber.from(amount).lte(BigNumber.from(props.maxAmount))
                ) {
                  try {
                    setWithdrawalLoading(true);
                    const tx = await nativeTokenVaultSigner.withdraw(amount);
                    await tx.wait(1);
                    handleWithdrawalSuccess();
                  } catch (error) {
                    console.log(error);
                  } finally {
                    setWithdrawalLoading(false);
                  }
                } else {
                  dispatch({
                    type: "error",
                    message: "Amount is bigger than max permited withdrawal",
                    title: "Error",
                    position: "topR",
                  });
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

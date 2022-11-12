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
import nativeTokenVaultContract from "../contracts/NativeTokenVault.json";

export default function WithdrawNativeToken(props) {
  const ONE_DAY = 86400;
  const ONE_WEEK = ONE_DAY * 7;
  const UNVOTE_WINDOW = ONE_DAY * 2;
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
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

  const nativeTokenVaultSigner = useContract({
    contractInterface: nativeTokenVaultContract.abi,
    addressOrName: addresses.NativeTokenVault,
    signerOrProvider: signer,
  });

  const nativeTokenVaultProvider = useContract({
    contractInterface: nativeTokenVaultContract.abi,
    addressOrName: addresses.NativeTokenVault,
    signerOrProvider: provider,
  });

  async function getLastWithdrawRequest() {
    var withdrawRequest;
    try {
      withdrawRequest = await nativeTokenVaultProvider.getWithdrawalRequest(
        address
      );
    } catch (error) {
      console.log(error);
    }

    console.log("withdrawRequest", withdrawRequest);

    // Withdraw might be undefined if no request was made before
    if (withdrawRequest) {
      setLastWithdrawalRequest({
        amount: withdrawRequest.amount.toString(),
        timestamp: withdrawRequest.timestamp.toNumber(),
      });
    }
  }

  //Run once
  useEffect(() => {
    if (isConnected) {
      getLastWithdrawRequest();
    }
  }, [isConnected]);

  function canWithdraw(requestTimestamp) {
    let now = Date.now() / 1000; // Date in seconds

    if (
      now > requestTimestamp + ONE_WEEK &&
      now < requestTimestamp + ONE_WEEK + UNVOTE_WINDOW
    ) {
      return true;
    }

    return false;
  }

  function getWithdrawalMessage(requestTimestamp) {
    let now = Date.now() / 1000; // Unix timestamp in seconds
    console.log("requestTimestamp", requestTimestamp);

    if (now < requestTimestamp + ONE_WEEK) {
      let hoursToWithdraw = (requestTimestamp + ONE_WEEK - now) / 3600;
      return (
        "Please wait until the withdrawal cooling down period is over, " +
        hoursToWithdraw.toString() +
        " hours."
      );
    }

    if (
      now > requestTimestamp + ONE_WEEK &&
      now < requestTimestamp + ONE_WEEK + UNVOTE_WINDOW
    ) {
      let hoursUntilWithdrawClosed =
        requestTimestamp + ONE_WEEK + UNVOTE_WINDOW - now;
      return (
        "You can withdraw for " +
        hoursUntilWithdrawClosed.toString() +
        " hours."
      );
    }

    if (now > requestTimestamp + ONE_WEEK + UNVOTE_WINDOW) {
      return "Please submit an withdrawal request to be able to withdraw. 7-day cooldown period.";
    }

    return "";
  }

  const handleWithdrawalSuccess = async function () {
    props.updateUI();
    props.setVisibility(false);
    dispatch({
      type: "success",
      message: "Please wait for transaction confirmation.",
      title: "Withdrawal Successful!",
      position: "topR",
    });
  };

  const handleRequestSuccess = async function () {
    props.setVisibility(false);
    dispatch({
      type: "info",
      message: "You will be able to withdraw in 7 days.",
      title: "Request Successful!",
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
    <div className={styles.container}>
      <div className="flex flex-row items-center justify-center m-4">
        <div className="flex flex-col">
          <Typography variant="subtitle2">Maximum withdrawal amount</Typography>
          <Typography variant="body16">
            {formatUnits(props.maxAmount, 18)} LE
          </Typography>
        </div>
      </div>
      <div className="flex flex-row items-center justify-center mt-8 mb-2">
        <Input
          label="Amount"
          type="number"
          step="any"
          validation={{
            numberMax: Number(formatUnits(props.maxAmount, 18)),
            numberMin: 0,
          }}
          onChange={handleInputChange}
        />
      </div>
      <div className="flex flex-row items-center text-center justify-center mb-8">
        <Typography variant="caption14">
          {getWithdrawalMessage(lastWithdrawalRequest.timestamp)}
        </Typography>
      </div>
      {canWithdraw(lastWithdrawalRequest.timestamp) ? (
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
            disabled={BigNumber.from(props.maxAmount).isZero()}
            onClick={async function () {
              if (BigNumber.from(amount).lte(BigNumber.from(props.maxAmount))) {
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
      ) : (
        <div className="m-8 mt-2">
          <Button
            text="Create Withdraw Request"
            theme="secondary"
            isFullWidth
            loadingProps={{
              spinnerColor: "#000000",
              spinnerType: "loader",
              direction: "right",
              size: "24",
            }}
            loadingText=""
            disabled={BigNumber.from(props.maxAmount).isZero()}
            isLoading={requestLoading}
            onClick={async function () {
              try {
                setRequestLoading(true);
                const tx = await nativeTokenVaultProvider.createWithdrawRequest(
                  amount
                );
                await tx.wait(1);
                handleRequestSuccess();
              } catch (error) {
                console.log(error);
              } finally {
                setRequestLoading(false);
              }
            }}
          ></Button>
        </div>
      )}
    </div>
  );
}

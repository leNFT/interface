import { useNotification } from "@web3uikit/core";
import { BigNumber } from "@ethersproject/bignumber";
import styles from "../styles/Home.module.css";
import { Button, Input, Typography } from "@web3uikit/core";
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
  const [lastWithdrawRequest, setLastWithdrawRequest] = useState({
    amount: "0",
    timestamp: 0,
  });
  const [maxAmount, setMaxAmount] = useState("0");
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

  async function updateMaxAmount() {
    const updatedMaxAmount = (
      await nativeTokenVaultProvider.getMaximumWithdrawalAmount(address)
    ).toString();

    console.log("Updated Max Withdrawal Amount:", updatedMaxAmount);
    setMaxAmount(updatedMaxAmount);
  }

  async function getLastWithdrawRequest() {
    var withdrawRequest;
    try {
      withdrawRequest = await nativeTokenVaultProvider.getWithdrawRequest(
        address
      );
    } catch (error) {
      console.log(error);
    }

    // Withdraw might be undefined if no request was made before
    if (withdrawRequest) {
      setLastWithdrawRequest({
        amount: withdrawRequest.amount.toString(),
        timestamp: withdrawRequest.timestamp.toNumber(),
      });
    }
  }

  //Run once
  useEffect(() => {
    if (isConnected) {
      updateMaxAmount();
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
      return "Please submit an withdrawal request to be able to withdraw. 7 days cooldown period.";
    }

    return "";
  }

  const handleWithdrawalSuccess = async function () {
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
            {formatUnits(maxAmount, 18)} LE
          </Typography>
        </div>
      </div>
      {!BigNumber.from(maxAmount).isZero() && (
        <div>
          <div className="flex flex-row items-center justify-center m-6">
            <Input
              labelBgColor="rgb(241, 242, 251)"
              label="Amount"
              type="number"
              step="any"
              validation={{
                numberMax: Number(formatUnits(maxAmount, 18)),
                numberMin: 0,
              }}
              onChange={handleInputChange}
            />
          </div>
          <div className="flex flex-row items-center text-center justify-center m-2">
            <Typography variant="caption14">
              {getWithdrawalMessage(lastWithdrawRequest.timestamp)}
            </Typography>
          </div>
          {canWithdraw(lastWithdrawRequest.timestamp) ? (
            <div className="mt-16 mb-8">
              <Button
                text="Withdraw"
                isFullWidth
                loadingProps={{
                  spinnerColor: "#000000",
                }}
                loadingText="Confirming Withdrawal"
                isLoading={withdrawalLoading}
                onClick={async function () {
                  if (BigNumber.from(amount).lte(BigNumber.from(maxAmount))) {
                    setWithdrawalLoading(true);
                    try {
                      await nativeTokenVaultSigner.withdraw(amount);
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
            <div className="mt-16 mb-8">
              <Button
                text="Request Withdrawal"
                isFullWidth
                loadingProps={{
                  spinnerColor: "#000000",
                }}
                loadingText="Confirming Approval"
                isLoading={requestLoading}
                onClick={async function () {
                  setRequestLoading(true);
                  try {
                    await nativeTokenVaultProvider.createWithdrawRequest(
                      balance
                    );
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
      )}
    </div>
  );
}

import { useNotification } from "web3uikit";
import { BigNumber } from "@ethersproject/bignumber";
import styles from "../styles/Home.module.css";
import { Button, Input, Typography } from "web3uikit";
import { formatUnits, parseUnits } from "@ethersproject/units";
import contractAddresses from "../contractAddresses.json";
import { useWeb3Contract, useMoralis } from "react-moralis";
import { useState, useEffect } from "react";
import nativeTokenVaultContract from "../contracts/NativeTokenVault.json";

export default function WithdrawNativeToken(props) {
  const ONE_DAY = 86400;
  const ONE_WEEK = ONE_DAY * 7;
  const UNVOTE_WINDOW = ONE_DAY * 2;
  const { isWeb3Enabled, chainId, account } = useMoralis();
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [amount, setAmount] = useState("0");
  const [lastWithdrawRequest, setLastWithdrawRequest] = useState({
    amount: "0",
    timestamp: 0,
  });
  const [maxAmount, setMaxAmount] = useState("0");
  const addresses =
    chainId in contractAddresses
      ? contractAddresses[chainId]
      : contractAddresses["0x1"];

  const dispatch = useNotification();

  const { runContractFunction: getMaximumWithdrawalAmount } = useWeb3Contract();
  const { runContractFunction: getWithdrawRequest } = useWeb3Contract();

  const { runContractFunction: withdraw } = useWeb3Contract({
    abi: nativeTokenVaultContract.abi,
    contractAddress: addresses.NativeTokenVault,
    functionName: "withdraw",
    params: {
      amount: amount,
    },
  });

  async function updateMaxAmount() {
    const maxWithdrawalOptions = {
      abi: nativeTokenVaultContract.abi,
      contractAddress: addresses.NativeTokenVault,
      functionName: "getMaximumWithdrawalAmount",
      params: {
        user: account,
      },
    };

    const updatedMaxAmount = (
      await getMaximumWithdrawalAmount({
        params: maxWithdrawalOptions,
      })
    ).toString();

    console.log("Updated Max Withdrawal Amount:", updatedMaxAmount);
    setMaxAmount(updatedMaxAmount);
  }

  async function getLastWithdrawRequest() {
    const getWithdrawRequestOptions = {
      abi: nativeTokenVaultContract.abi,
      contractAddress: addresses.NativeTokenVault,
      functionName: "getWithdrawRequest",
      params: {
        user: account,
      },
    };

    const withdrawRequest = await getWithdrawRequest({
      params: getWithdrawRequestOptions,
    });

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
    if (isWeb3Enabled) {
      updateMaxAmount();
      getLastWithdrawRequest();
    }
  }, [isWeb3Enabled]);

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
    let now = Date.now() / 1000; // Date in seconds

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
      type: "info",
      message:
        "Withdrawal Successful!  Please wait for transaction confirmation.",
      title: "Notification",
      position: "topR",
      icon: "bell",
    });
  };

  const handleRequestSuccess = async function () {
    props.setVisibility(false);
    dispatch({
      type: "info",
      message: "Request Successful! You will be able to withdraw in 7 days.",
      title: "Notification",
      position: "topR",
      icon: "bell",
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
          <Typography variant="h4">Maximum withdrawal amount</Typography>
          <Typography variant="body16">
            {formatUnits(maxAmount, 18)} LE
          </Typography>
        </div>
      </div>
      {!BigNumber.from(maxAmount).isZero() && (
        <div>
          <div className="flex flex-row items-center justify-center m-6">
            <Input
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
                    await withdraw({
                      onComplete: () => setWithdrawalLoading(false),
                      onSuccess: handleWithdrawalSuccess,
                      onError: (error) => console.log(error),
                    });
                  } else {
                    dispatch({
                      type: "info",
                      message: "Amount is bigger than max permited withdrawal",
                      title: "Notification",
                      position: "topR",
                      icon: "bell",
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
                  const requestWithdrawalOptions = {
                    abi: NativeTokenVault.abi,
                    contractAddress: addresses.NativeTokenVault,
                    functionName: "createWithdrawRequest",
                    params: {
                      amount: balance,
                    },
                  };

                  await requestWithdraw({
                    onComplete: () => setRequestLoading(false),
                    onSuccess: handleRequestSuccess,
                    onError: (error) => console.log(error),
                    params: requestWithdrawalOptions,
                  });
                }}
              ></Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

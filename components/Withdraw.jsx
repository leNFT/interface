import { useNotification } from "web3uikit";
import { BigNumber } from "@ethersproject/bignumber";
import styles from "../styles/Home.module.css";
import { Button } from "web3uikit";
import { formatUnits, parseUnits } from "@ethersproject/units";
import contractAddresses from "../contractAddresses.json";
import { useWeb3Contract, useMoralis } from "react-moralis";
import { useState, useEffect } from "react";
import marketContract from "../contracts/Market.json";
import reserveContract from "../contracts/Reserve.json";

export default function Withdraw() {
  const { isWeb3Enabled, chainId, account } = useMoralis();
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [amount, setAmount] = useState("0");
  const [maxAmount, setMaxAmount] = useState("0");
  const addresses =
    chainId in contractAddresses
      ? contractAddresses[chainId]
      : contractAddresses["0x1"];

  const dispatch = useNotification();

  const { runContractFunction: withdraw } = useWeb3Contract({
    abi: marketContract.abi,
    contractAddress: addresses.Market,
    functionName: "withdraw",
    params: {
      asset: addresses.WETH,
      amount: amount,
    },
  });

  const { runContractFunction: getReserveAddress } = useWeb3Contract({
    abi: marketContract.abi,
    contractAddress: addresses.Market,
    functionName: "getReserveAddress",
    params: {
      asset: addresses.WETH,
    },
  });

  const { runContractFunction: getMaximumWithdrawalAmount } = useWeb3Contract();

  async function updateMaxAmount() {
    const reserveAddress = (await getReserveAddress()).toString();

    const maxWithdrawalOptions = {
      abi: reserveContract.abi,
      contractAddress: reserveAddress,
      functionName: "getMaximumWithdrawalAmount",
      params: {
        to: account,
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

  //Run once
  useEffect(() => {
    if (isWeb3Enabled) {
      updateMaxAmount();
    }
  }, [isWeb3Enabled]);

  const handleWithdrawalSuccess = async function () {
    dispatch({
      type: "info",
      message: "Withdrawal Successful!",
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
      <div className="flex">
        Maximum withdrawal amount is {formatUnits(maxAmount, 18)} WETH
      </div>
      <input
        className="flex"
        type="number"
        defaultValue="0"
        onChange={handleInputChange}
      />
      <div className="m-8">
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
    </div>
  );
}

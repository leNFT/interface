import { useNotification } from "web3uikit";
import { BigNumber } from "@ethersproject/bignumber";
import styles from "../styles/Home.module.css";
import { Button, Input, Typography } from "web3uikit";
import { formatUnits, parseUnits } from "@ethersproject/units";
import contractAddresses from "../contractAddresses.json";
import { useWeb3Contract, useMoralis } from "react-moralis";
import { useState, useEffect } from "react";
import marketContract from "../contracts/Market.json";
import reserveContract from "../contracts/Reserve.json";

export default function Withdraw(props) {
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
      asset: addresses.wETH,
      amount: amount,
    },
  });

  const { runContractFunction: getReserveAddress } = useWeb3Contract({
    abi: marketContract.abi,
    contractAddress: addresses.Market,
    functionName: "getReserveAddress",
    params: {
      asset: addresses.wETH,
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
    props.setVisibility(false);
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
      <div className="flex flex-row items-center justify-center">
        <div className="flex flex-col">
          <Typography variant="h4">Maximum withdrawal amount</Typography>
          <Typography variant="body16">
            {formatUnits(maxAmount, 18)} wETH
          </Typography>
        </div>
      </div>
      <div className="flex flex-row items-center justify-center m-8">
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
    </div>
  );
}

import { useNotification } from "web3uikit";
import { BigNumber } from "@ethersproject/bignumber";
import styles from "../styles/Home.module.css";
import { formatUnits, parseUnits } from "@ethersproject/units";
import contractAddresses from "../contractAddresses.json";
import { useWeb3Contract, useMoralis } from "react-moralis";
import { useState, useEffect } from "react";
import marketContract from "../../lenft/artifacts/contracts/protocol/Market.sol/Market.json";
import reserveContract from "../../lenft/artifacts/contracts/protocol/Reserve.sol/Reserve.json";
import erc20 from "../contracts/erc20.json";

export default function Withdraw() {
  const { isWeb3Enabled, chainId, account } = useMoralis();
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
      <ul className="flex">
        Maximum withdrawal amount is {formatUnits(maxAmount, 18)} WETH
      </ul>
      <input
        className="flex"
        type="number"
        defaultValue="0"
        onChange={handleInputChange}
      />
      <button
        className="m-4 bor bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={async function () {
          if (BigNumber.from(amount).lte(BigNumber.from(maxAmount))) {
            await withdraw({
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
      >
        Withdraw
      </button>
    </div>
  );
}

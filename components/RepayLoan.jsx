import contractAddresses from "../contractAddresses.json";
import { useNotification } from "web3uikit";
import { BigNumber } from "@ethersproject/bignumber";
import { formatUnits, parseUnits } from "@ethersproject/units";
import { useWeb3Contract, useMoralis } from "react-moralis";
import styles from "../styles/Home.module.css";
import { useState, useEffect } from "react";
import marketContract from "../contracts/Market.json";
import loanCenterContract from "../contracts/LoanCenter.json";
import erc20 from "../contracts/erc20.json";

export default function RepayLoan(props) {
  const [debt, setDebt] = useState("0");
  const [balance, setBalance] = useState("0");
  const { isWeb3Enabled, chainId, account } = useMoralis();
  const addresses =
    chainId in contractAddresses
      ? contractAddresses[chainId]
      : contractAddresses["0x1"];

  const dispatch = useNotification();

  const { runContractFunction: repayLoan } = useWeb3Contract({
    abi: marketContract.abi,
    contractAddress: addresses.Market,
    functionName: "repay",
    params: {
      loanId: props.loan_id,
    },
  });

  const { runContractFunction: getBalance } = useWeb3Contract({
    abi: erc20,
    contractAddress: addresses.WETH,
    functionName: "balanceOf",
    params: {
      _owner: account,
    },
  });

  const { runContractFunction: getDebt } = useWeb3Contract({
    abi: loanCenterContract.abi,
    contractAddress: addresses.LoanCenter,
    functionName: "getLoanDebt",
    params: {
      loanId: props.loan_id,
    },
  });

  async function updateTokenBalance() {
    const updatedBalance = await getBalance({
      onError: (error) => console.log(error),
    });
    console.log("Updated Balance:", updatedBalance);
    setBalance(updatedBalance.toString());
  }

  async function getLoanDebt() {
    const updatedDebt = await getDebt({
      onError: (error) => console.log(error),
    });
    console.log("Updated Debt:", updatedDebt);
    setDebt(updatedDebt.toString());
  }

  //Run once
  useEffect(() => {
    if (isWeb3Enabled) {
      updateTokenBalance();
      getLoanDebt();
    }
  }, [isWeb3Enabled]);

  const handleRepaySuccess = async function () {
    dispatch({
      type: "info",
      message: "Repay Successful!",
      title: "Notification",
      position: "topR",
      icon: "bell",
    });
  };

  return (
    <div className={styles.container}>
      <ul className="flex">Loan ID is {props.loan_id}</ul>
      <ul className="flex">Debt is {formatUnits(debt, 18)} WETH</ul>
      <ul className="flex">
        Your WETH balance is {formatUnits(balance, 18)} WETH
      </ul>
      <button
        className="m-4 bor bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={async function () {
          if (BigNumber.from(debt).lte(BigNumber.from(balance))) {
            await repayLoan({
              onSuccess: handleRepaySuccess,
              onError: (error) => console.log(error),
            });
          } else {
            dispatch({
              type: "info",
              message: "Amount is bigger than balance",
              title: "Notification",
              position: "topR",
              icon: "bell",
            });
          }
        }}
      >
        Repay Loan
      </button>
    </div>
  );
}

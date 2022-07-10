import contractAddresses from "../contractAddresses.json";
import { useNotification } from "web3uikit";
import { BigNumber } from "@ethersproject/bignumber";
import { formatUnits, parseUnits } from "@ethersproject/units";
import { useWeb3Contract, useMoralis } from "react-moralis";
import { Button } from "web3uikit";
import styles from "../styles/Home.module.css";
import { useState, useEffect } from "react";
import marketContract from "../contracts/Market.json";
import loanCenterContract from "../contracts/LoanCenter.json";
import erc20 from "../contracts/erc20.json";
import Image from "next/image";

export default function RepayLoan(props) {
  const [debt, setDebt] = useState("0");
  const [balance, setBalance] = useState("0");
  const { isWeb3Enabled, chainId, account } = useMoralis();
  const [repayLoading, setRepayLoading] = useState(false);
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
    contractAddress: addresses.wETH,
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
      //getCollateralDetails();
    }
  }, [isWeb3Enabled]);

  const handleRepaySuccess = async function () {
    props.setVisibility(false);
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
      <div className="flex flex-row items-center justify-center text-center m-2">
        Loan ID is {props.loan_id}
      </div>
      <div className="flex flex-row items-center justify-center text-center m-2">
        Debt is {formatUnits(debt, 18)} wETH
      </div>
      <div className="flex flex-row items-center justify-center text-center m-2">
        Your wETH balance is {formatUnits(balance, 18)} wETH
      </div>
      <div className="flex m-8">
        <Button
          text="Repay Loan"
          isFullWidth
          loadingProps={{
            spinnerColor: "#000000",
          }}
          loadingText="Confirming Loan Repayment"
          isLoading={repayLoading}
          onClick={async function () {
            if (BigNumber.from(debt).lte(BigNumber.from(balance))) {
              setRepayLoading(true);
              await repayLoan({
                onComplete: () => setRepayLoading(false),
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
        />
      </div>
    </div>
  );
}

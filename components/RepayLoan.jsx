import contractAddresses from "../contractAddresses.json";
import { useNotification, Illustration } from "@web3uikit/core";
import { BigNumber } from "@ethersproject/bignumber";
import { formatUnits } from "@ethersproject/units";
import { useWeb3Contract, useMoralis } from "react-moralis";
import { Button, Typography } from "@web3uikit/core";
import styles from "../styles/Home.module.css";
import nftOracleContract from "../contracts/NFTOracle.json";
import { useState, useEffect } from "react";
import marketContract from "../contracts/Market.json";
import loanCenterContract from "../contracts/LoanCenter.json";
import reserveContract from "../contracts/Reserve.json";
import erc20 from "../contracts/erc20.json";
import Image from "next/image";
import { getTokenPrice } from "../helpers/getTokenPrice.js";

export default function RepayLoan(props) {
  const [loan, setLoan] = useState();
  const [debt, setDebt] = useState(0);
  const [tokenPrice, setTokenPrice] = useState("0");
  const [tokenMaxCollateralization, setTokenMaxCollateralization] = useState(0);
  const [balance, setBalance] = useState("0");
  const { isWeb3Enabled, chainId, account } = useMoralis();
  const [repayLoading, setRepayLoading] = useState(false);
  const addresses =
    chainId in contractAddresses
      ? contractAddresses[chainId]
      : contractAddresses["0x1"];

  const [asset, setAsset] = useState(addresses["WETH"].address);
  const [symbol, setSymbol] = useState("WETH");

  const dispatch = useNotification();

  const { runContractFunction: getCollectionMaxCollateralization } =
    useWeb3Contract({
      abi: nftOracleContract.abi,
      contractAddress: addresses.NFTOracle,
      functionName: "getCollectionMaxCollaterization",
      params: {
        collection: props.token_address,
      },
    });

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
    contractAddress: asset,
    functionName: "balanceOf",
    params: {
      _owner: account,
    },
  });

  const { runContractFunction: getLoan } = useWeb3Contract({
    abi: loanCenterContract.abi,
    contractAddress: addresses.LoanCenter,
    functionName: "getLoan",
    params: {
      loanId: props.loan_id,
    },
  });

  const { runContractFunction: getReserveAsset } = useWeb3Contract();
  const { runContractFunction: getSymbol } = useWeb3Contract();

  const { runContractFunction: getDebt } = useWeb3Contract({
    abi: loanCenterContract.abi,
    contractAddress: addresses.LoanCenter,
    functionName: "getLoanDebt",
    params: {
      loanId: props.loan_id,
    },
  });

  async function updateReserveAsset() {
    const updatedAsset = await getReserveAsset({
      params: {
        abi: reserveContract.abi,
        contractAddress: loan.reserve,
        functionName: "getAsset",
        params: {},
      },
      onError: (error) => console.log(error),
    });
    setAsset(updatedAsset);

    const updatedAssetSymbol = await getSymbol({
      params: {
        abi: erc20,
        contractAddress: updatedAsset,
        functionName: "symbol",
        params: {},
      },
      onError: (error) => console.log(error),
    });
    setSymbol(updatedAssetSymbol);
  }

  async function updateTokenBalance() {
    const updatedBalance = await getBalance({
      onError: (error) => console.log(error),
    });
    setBalance(updatedBalance.toString());
  }

  async function getLoanToRepay() {
    const updatedLoan = await getLoan({
      onError: (error) => console.log(error),
    });
    console.log("Updated Loan:", {
      loanId: updatedLoan.loanId.toString(),
      reserve: updatedLoan.reserve,
    });
    setLoan({
      loanId: updatedLoan.loanId.toString(),
      borrowRate: updatedLoan.borrowRate,
      reserve: updatedLoan.reserve,
    });
  }

  async function getLoanDebt() {
    const updatedDebt = await getDebt({
      onError: (error) => console.log(error),
    });
    setDebt(updatedDebt.toString());
  }

  async function getAssetPricing() {
    // Get token price
    const price = await getTokenPrice(props.token_address, props.token_id);
    setTokenPrice(price);
    console.log("price", price);

    //Get token max collateralization
    const maxCollateralization = (
      await getCollectionMaxCollateralization()
    ).toString();
    console.log("maxCollateralization updated", maxCollateralization);
    setTokenMaxCollateralization(maxCollateralization);
  }

  useEffect(() => {
    if (isWeb3Enabled) {
      getLoanToRepay();
      getLoanDebt();
      getAssetPricing();
    }
  }, [isWeb3Enabled, props.loan_id]);

  useEffect(() => {
    if (loan) {
      updateReserveAsset();
    }
  }, [loan]);

  useEffect(() => {
    if (asset) {
      updateTokenBalance();
    }
  }, [asset]);

  const handleRepaySuccess = async function () {
    props.setVisibility(false);
    dispatch({
      type: "success",
      message: "Please wait for transaction confirmation.",
      title: "Repay Successful!",
      position: "topR",
    });
  };

  return (
    <div className={styles.container}>
      <div className="flex flex-row justify-center mb-2">
        {props.token_uri ? (
          <Image
            loader={() => props.token_uri}
            src={props.token_uri}
            height="200"
            width="200"
            unoptimized={true}
          />
        ) : (
          <Illustration height="180px" logo="chest" width="100%" />
        )}
      </div>
      <div className="flex flex-row justify-center mb-8">
        <Typography variant="caption18">
          {props.token_name + " #" + props.token_id}
        </Typography>
      </div>
      <div className="flex flex-row m-2">
        <div className="flex flex-col">
          <Typography variant="subtitle2">Loan ID</Typography>
          <Typography variant="body16">{props.loan_id}</Typography>
        </div>
      </div>
      <div className="flex flex-row items-center m-2">
        <div className="flex flex-col">
          <Typography variant="subtitle2">Debt</Typography>
          <Typography variant="body16">
            {formatUnits(debt, addresses[symbol].decimals) + " " + symbol}
          </Typography>
        </div>
      </div>
      <div className="flex flex-row items-center m-2">
        {loan && (
          <div className="flex flex-col">
            <Typography variant="subtitle2">Interest Rate</Typography>
            <Typography variant="body16">{loan.borrowRate / 100}%</Typography>
          </div>
        )}
      </div>
      <div className="flex flex-row items-center m-2">
        <div className="flex flex-col">
          <Typography variant="subtitle2">Asset Pricing</Typography>
          <Typography variant="body16">
            {formatUnits(tokenPrice, 18) +
              " WETH @ " +
              tokenMaxCollateralization / 100 +
              "% Max LTV"}
          </Typography>
        </div>
      </div>
      <div className="flex flex-row items-center m-2">
        <div className="flex flex-col">
          <Typography variant="subtitle2">Your {symbol} balance</Typography>
          <Typography variant="body16">
            {formatUnits(balance, addresses[symbol].decimals) + " " + symbol}
          </Typography>
        </div>
      </div>
      <div className="flex m-8">
        <Button
          text="Repay Loan"
          theme="secondary"
          isFullWidth
          loadingProps={{
            spinnerColor: "#000000",
            spinnerType: "loader",
            direction: "right",
            size: "24",
          }}
          loadingText=""
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
                type: "error",
                message: "Amount is bigger than balance",
                title: "Error",
                position: "topR",
              });
            }
          }}
        />
      </div>
    </div>
  );
}

import contractAddresses from "../contractAddresses.json";
import { useNotification, Illustration } from "@web3uikit/core";
import { BigNumber } from "@ethersproject/bignumber";
import { formatUnits } from "@ethersproject/units";
import { Button, Typography, Tooltip } from "@web3uikit/core";
import { HelpCircle } from "@web3uikit/icons";
import LinearProgressWithLabel from "../components/LinearProgressWithLabel";
import styles from "../styles/Home.module.css";
import { calculateHealthLevel } from "../helpers/healthLevel.js";
import { useState, useEffect } from "react";
import marketContract from "../contracts/Market.json";
import loanCenterContract from "../contracts/LoanCenter.json";
import reserveContract from "../contracts/Reserve.json";
import erc20 from "../contracts/erc20.json";
import Image from "next/image";
import { ethers } from "ethers";
import { getAssetPrice } from "../helpers/getAssetPrice.js";
import {
  useAccount,
  useNetwork,
  useContract,
  useProvider,
  useSigner,
} from "wagmi";
import Box from "@mui/material/Box";

export default function RepayLoan(props) {
  const [loan, setLoan] = useState();
  const [debt, setDebt] = useState(0);
  const [tokenPrice, setTokenPrice] = useState("0");
  const [balance, setBalance] = useState("0");
  const { isConnected, address } = useAccount();
  const { chain } = useNetwork();
  const provider = useProvider();
  const { data: signer } = useSigner();
  const [repayLoading, setRepayLoading] = useState(false);
  const addresses =
    chain && chain.id in contractAddresses
      ? contractAddresses[chain.id]
      : contractAddresses["1"];

  const [asset, setAsset] = useState(addresses["WETH"].address);
  const [symbol, setSymbol] = useState("WETH");

  const dispatch = useNotification();

  const market = useContract({
    contractInterface: marketContract.abi,
    addressOrName: addresses.Market,
    signerOrProvider: signer,
  });

  const token = useContract({
    contractInterface: erc20,
    addressOrName: asset,
    signerOrProvider: provider,
  });

  const loanCenter = useContract({
    contractInterface: loanCenterContract.abi,
    addressOrName: addresses.LoanCenter,
    signerOrProvider: provider,
  });

  async function updateReserveAsset() {
    const reserve = new ethers.Contract(
      loan.reserve,
      reserveContract.abi,
      provider
    );

    const updatedAsset = await reserve.getAsset();
    setAsset(updatedAsset);

    const updatedAssetSymbol = await token.symbol();
    setSymbol(updatedAssetSymbol);
  }

  async function updateTokenBalance() {
    const updatedBalance = await token.balanceOf(address);
    setBalance(updatedBalance.toString());
  }

  async function getLoanToRepay() {
    const updatedLoan = await loanCenter.getLoan(props.loan_id);
    console.log("Updated Loan:", updatedLoan);
    setLoan(updatedLoan);
  }

  async function getLoanDebt() {
    const updatedDebt = await loanCenter.getLoanDebt(props.loan_id);
    setDebt(updatedDebt.toString());
  }

  async function getAssetPricing() {
    // Get token price
    const price = await getAssetPrice(props.token_address, props.token_id);
    setTokenPrice(price);
    console.log("price", price);
  }

  useEffect(() => {
    if (isConnected) {
      getLoanToRepay();
      getLoanDebt();
      getAssetPricing();
    }
  }, [isConnected, props.loan_id]);

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
      <div className="flex flex-col lg:flex-row lg:m-8 justify-center">
        <div className="flex flex-col lg:m-8 justify-center">
          <div className="flex flex-row justify-center mb-2">
            {props.token_uri ? (
              <Image
                loader={() => props.token_uri}
                src={props.token_uri}
                height="250"
                width="250"
                unoptimized={true}
              />
            ) : (
              <Illustration height="180px" logo="chest" width="100%" />
            )}
          </div>
          <div className="flex flex-row justify-center mb-8 lg:mb-0">
            <Typography variant="caption18">
              {props.token_name + " #" + props.token_id}
            </Typography>
          </div>
        </div>
        <div className="flex flex-col lg:m-2">
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
                <Typography variant="body16">
                  {loan.borrowRate.toNumber() / 100}%
                </Typography>
              </div>
            )}
          </div>
          <div className="flex flex-row items-center m-2">
            <div className="flex flex-col">
              <Typography variant="subtitle2">Asset Pricing</Typography>
              <Typography variant="body16">
                {formatUnits(tokenPrice, 18) + " WETH"}
              </Typography>
            </div>
          </div>
          <div className="flex flex-row m-2">
            <div className="flex flex-col">
              <Typography variant="subtitle2">Max LTV</Typography>
              {loan && (
                <Typography variant="body16">
                  {tokenPrice != "0"
                    ? loan.maxLTV.toNumber() / 100 +
                      "% + " +
                      loan.boost.toNumber() / 100 +
                      "% (Boost) = " +
                      loan.maxLTV.add(loan.boost).div(100).toNumber() +
                      "%"
                    : "Token Price Appraisal Error"}
                </Typography>
              )}
            </div>
          </div>
          {loan && (
            <div className="flex flex-row m-2">
              <div className="flex flex-col">
                <div className="flex flex-row">
                  <div className="flex flex-col">
                    <Typography variant="subtitle2">Health Level</Typography>
                  </div>
                  <div className="flex flex-col ml-1">
                    <Tooltip
                      content="Represents the relation between the debt and the collateral's value. When it reaches 0 the loan can be liquidated."
                      position="top"
                      minWidth={200}
                    >
                      <HelpCircle fontSize="14px" color="#000000" />
                    </Tooltip>
                  </div>
                </div>
                <div>
                  <LinearProgressWithLabel
                    color="success"
                    value={calculateHealthLevel(
                      debt,
                      BigNumber.from(loan.maxLTV)
                        .add(loan.boost)
                        .mul(tokenPrice)
                        .div(10000)
                        .toString()
                    )}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-row items-center m-4 justify-center">
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
              try {
                setRepayLoading(true);
                const tx = await market.repay(props.loan_id);
                await tx.wait(1);
                handleRepaySuccess();
              } catch (error) {
                console.log(error);
              } finally {
                setRepayLoading(false);
              }
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

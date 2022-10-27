import contractAddresses from "../contractAddresses.json";
import { useNotification, Illustration } from "@web3uikit/core";
import { BigNumber } from "@ethersproject/bignumber";
import { formatUnits } from "@ethersproject/units";
import { Button, Typography, Tooltip, Input } from "@web3uikit/core";
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

export default function RepayLoan(props) {
  const [loan, setLoan] = useState();
  const [debt, setDebt] = useState(0);
  const [approved, setApproved] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [tokenPrice, setTokenPrice] = useState("0");
  const [balance, setBalance] = useState("0");
  const [amount, setAmount] = useState("0");
  const { isConnected, address } = useAccount();
  const { chain } = useNetwork();
  const provider = useProvider();
  const { data: signer } = useSigner();
  const [repayLoading, setRepayLoading] = useState(false);
  const addresses =
    chain && chain.id in contractAddresses
      ? contractAddresses[chain.id]
      : contractAddresses["1"];

  const [asset, setAsset] = useState(addresses["ETH"].address);
  const [symbol, setSymbol] = useState("ETH");

  const dispatch = useNotification();

  const market = useContract({
    contractInterface: marketContract.abi,
    addressOrName: addresses.Market,
    signerOrProvider: signer,
  });

  const tokenProvider = useContract({
    contractInterface: erc20,
    addressOrName: asset,
    signerOrProvider: provider,
  });

  const tokenSigner = useContract({
    contractInterface: erc20,
    addressOrName: asset,
    signerOrProvider: signer,
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
  }

  async function getTokenAllowance() {
    const allowance = await tokenProvider.allowance(address, loan.reserve);

    console.log("Got allowance:", allowance);

    if (!allowance.eq(BigNumber.from(0))) {
      setApproved(true);
    } else {
      setApproved(false);
    }
  }

  async function updateTokenBalance() {
    const updatedBalance = await tokenProvider.balanceOf(address);
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
    if (loan && asset) {
      getTokenAllowance();
    }
  }, [loan, asset]);

  useEffect(() => {
    if (asset) {
      updateTokenBalance();
    }
  }, [asset]);

  const handleRepaySuccess = async function () {
    props.updateUI();
    props.setVisibility(false);
    dispatch({
      type: "success",
      message: "Your NFT will be available shortly.",
      title: "Repay Successful!",
      position: "topR",
    });
  };

  const handlePartialRepaySuccess = async function () {
    props.updateUI();
    props.setVisibility(false);
    dispatch({
      type: "success",
      message: "Your loan was partially repaid.",
      title: "Repay Successful!",
      position: "topR",
    });
  };

  const handleApprovalSuccess = async function () {
    setApproved(true);
    dispatch({
      type: "success",
      message: "You can now deposit.",
      title: "Approval Successful!",
      position: "topR",
    });
  };

  function handleInputChange(e) {
    if (e.target.value != "") {
      setAmount(
        parseUnits(e.target.value, addresses[symbol].decimals).toString()
      );
    } else {
      setAmount("0");
    }
  }

  return (
    <div className={styles.container}>
      <div className="flex flex-col lg:flex-row lg:m-8 justify-center">
        <div className="flex flex-col mb-4 lg:m-8 justify-center">
          <div className="flex flex-row justify-center">
            {props.token_image ? (
              <Image
                loader={() => props.token_image}
                src={props.token_image}
                height="300"
                width="300"
                unoptimized={true}
                className="rounded-3xl"
              />
            ) : (
              <div className="flex items-center justify-center w-[300px] h-[300px]">
                Image Unavailable
              </div>
            )}
          </div>
          <div className="flex flex-row justify-center">
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
                <Typography variant="subtitle2">
                  Liquidation Threshold
                </Typography>
                <Typography variant="caption16">
                  {formatUnits(
                    BigNumber.from(loan.maxLTV)
                      .add(loan.boost)
                      .mul(tokenPrice)
                      .div(10000)
                      .toString(),
                    18
                  ) +
                    " " +
                    symbol}
                </Typography>
              </div>
            )}
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
                {formatUnits(tokenPrice, 18) + " ETH"}
              </Typography>
            </div>
          </div>
          <div className="flex flex-row m-2">
            <div className="flex flex-col">
              <Typography variant="subtitle2">Max LTV (+ Boost)</Typography>
              {loan && (
                <Typography variant="body16">
                  {tokenPrice != "0"
                    ? loan.maxLTV.toNumber() / 100 +
                      "% + " +
                      loan.boost.toNumber() / 100 +
                      "% = " +
                      loan.maxLTV.add(loan.boost).toNumber() / 100 +
                      "%"
                    : "Token Price Appraisal Error"}
                </Typography>
              )}
            </div>
          </div>
          {loan && (
            <div className="flex flex-row m-2">
              <div className="flex flex-col min-w-[80%]">
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
      <div className="flex flex-row items-center justify-center mx-8 mt-12 mb-2">
        <Input
          label="Amount"
          type="number"
          step="any"
          value={amount && formatUnits(amount, addresses[symbol].decimals)}
          validation={{
            numberMax: Number(formatUnits(debt, addresses[symbol].decimals)),
            numberMin: 0,
          }}
          onChange={handleInputChange}
        />
      </div>
      <div className="flex flex-row justify-center">
        <div className="flex flex-col">
          <Button
            onClick={() => setAmount(BigNumber.from(debt).mul(2500).div(10000))}
            text="25%"
            theme="outline"
          />
        </div>
        <div className="flex flex-col">
          <Button
            onClick={() => setAmount(BigNumber.from(debt).mul(5000).div(10000))}
            text="50%"
            theme="outline"
          />
        </div>
        <div className="flex flex-col">
          <Button
            onClick={() => setAmount(BigNumber.from(debt).mul(7500).div(10000))}
            text="75%"
            theme="outline"
          />
        </div>
        <div className="flex flex-col">
          <Button onClick={() => setAmount(debt)} text="100%" theme="outline" />
        </div>
      </div>
      <div className="flex m-8">
        {approved ? (
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
              if (BigNumber.from(amount).lte(BigNumber.from(balance))) {
                try {
                  setRepayLoading(true);
                  var tx;
                  if (symbol == "ETH") {
                    console.log("Repay ETH");
                    console.log("amount", amount);
                    tx = await market.repayETH(props.loan_id, {
                      value: amount,
                    });
                    await tx.wait(1);
                  } else {
                    tx = await market.repay(props.loan_id, amount);
                    await tx.wait(1);
                  }
                  if (amount == debt) {
                    handleRepaySuccess();
                  } else {
                    handlePartialRepaySuccess();
                  }
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
        ) : (
          <Button
            text="Approve"
            theme="secondary"
            isFullWidth
            loadingProps={{
              spinnerColor: "#000000",
              spinnerType: "loader",
              direction: "right",
              size: "24",
            }}
            loadingText=""
            isLoading={approvalLoading}
            onClick={async function () {
              try {
                setApprovalLoading(true);
                const tx = await tokenSigner.approve(
                  loan.reserve,
                  "115792089237316195423570985008687907853269984665640564039457584007913129639935"
                );
                await tx.wait(1);
                handleApprovalSuccess();
              } catch (error) {
                console.log(error);
              } finally {
                setApprovalLoading(false);
              }
            }}
          ></Button>
        )}
      </div>
    </div>
  );
}

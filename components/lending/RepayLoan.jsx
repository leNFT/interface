import contractAddresses from "../../contractAddresses.json";
import { useNotification } from "@web3uikit/core";
import { BigNumber } from "@ethersproject/bignumber";
import { formatUnits } from "@ethersproject/units";
import { Typography, Tooltip, Input, Button } from "@web3uikit/core";
import { HelpCircle } from "@web3uikit/icons";
import LinearProgressWithLabel from "../LinearProgressWithLabel";
import styles from "../../styles/Home.module.css";
import { calculateHealthLevel } from "../../helpers/healthLevel.js";
import { useState, useEffect } from "react";
import loanCenterContract from "../../contracts/LoanCenter.json";
import lendingPoolContract from "../../contracts/LendingPool.json";
import erc20 from "../../contracts/erc20.json";
import Image from "next/image";
import { ethers } from "ethers";
import Countdown from "react-countdown";
import { getAssetsPrice } from "../../helpers/getAssetsPrice.js";
import {
  useAccount,
  useNetwork,
  useContract,
  useBalance,
  useProvider,
  useSigner,
} from "wagmi";
import lendingMarketContract from "../../contracts/LendingMarket.json";
import wethGatewayContract from "../../contracts/WETHGateway.json";

const SECONDS_IN_YEAR = 31556926;

export default function RepayLoan(props) {
  const [loan, setLoan] = useState();
  const [debt, setDebt] = useState(0);
  const [liquidationThreshold, setLiquidationThreshold] = useState("0");
  const [liquidationTimestamp, setLiquidationTimestamp] = useState(0);
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
  var addresses = contractAddresses["11155111"];

  const [asset, setAsset] = useState(addresses["ETH"].address);
  const [symbol, setSymbol] = useState("ETH");

  const dispatch = useNotification();

  const wethGatewaySigner = useContract({
    contractInterface: wethGatewayContract.abi,
    addressOrName: addresses.WETHGateway,
    signerOrProvider: signer,
  });

  const lendingMarket = useContract({
    contractInterface: lendingMarketContract.abi,
    addressOrName: addresses.LendingMarket,
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

  async function updateLendingPoolAsset() {
    const pool = new ethers.Contract(
      loan.pool,
      lendingPoolContract.abi,
      provider
    );

    const updatedAsset = await pool.asset();
    setAsset(updatedAsset);
  }

  async function getTokenAllowance() {
    const allowance = await tokenProvider.allowance(address, loan.pool);

    console.log("Got allowance:", allowance);

    if (!allowance.eq(BigNumber.from(0)) || symbol == "ETH") {
      setApproved(true);
    } else {
      setApproved(false);
    }
  }

  async function updateTokenBalance() {
    var updatedBalance;
    if (symbol == "ETH") {
      updatedBalance = await provider.getBalance(address);
    } else {
      updatedBalance = await tokenProvider.balanceOf(address);
    }

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
    const updatedPrice = await getAssetsPrice(
      props.token_address,
      props.token_ids,
      chain.id
    );

    setTokenPrice(updatedPrice.price);
    console.log("price", updatedPrice.price);
  }

  async function updateLiquidationThreshold() {
    const updatedLiquidationThreshold = await loanCenter.getLoanMaxDebt(
      props.loan_id,
      tokenPrice
    );

    console.log("updatedliquidationThreshold", updatedLiquidationThreshold);
    setLiquidationThreshold(updatedLiquidationThreshold);
  }

  function updateLiquidationTimestamp() {
    const timeUntilLiquidation =
      (SECONDS_IN_YEAR * 1000 * (liquidationThreshold - debt)) /
      BigNumber.from(loan.borrowRate).mul(loan.amount).div(10000);

    console.log("liquidationThreshold", liquidationThreshold);
    console.log("debt", debt);

    console.log("timeUntilLiquidation", timeUntilLiquidation);
    const updatedLiquidationTimestamp = Date.now() + timeUntilLiquidation;
    console.log("updatedLiquidationTimestamp", updatedLiquidationTimestamp);

    setLiquidationTimestamp(updatedLiquidationTimestamp);
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
      updateLendingPoolAsset();
    }
  }, [loan]);

  useEffect(() => {
    if (loan && tokenPrice) {
      updateLiquidationThreshold();
    }
  }, [loan, tokenPrice]);

  useEffect(() => {
    if (debt != 0 && loan && liquidationThreshold != "0") {
      updateLiquidationTimestamp();
    }
  }, [loan, debt, liquidationThreshold]);

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
      message: "Your NFTs will be available shortly.",
      title: "Repay Successful!",
      position: "bottomL",
    });
  };

  const handlePartialRepaySuccess = async function () {
    props.updateUI();
    props.setVisibility(false);
    dispatch({
      type: "success",
      message: "Your loan was partially repaid.",
      title: "Repay Successful!",
      position: "bottomL",
    });
  };

  const handleApprovalSuccess = async function () {
    setApproved(true);
    dispatch({
      type: "success",
      message: "You can now deposit.",
      title: "Approval Successful!",
      position: "bottomL",
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
    <div className="p-2">
      <div className="flex flex-col xl:flex-row lg:mb-4 lg:mx-8 justify-center">
        <div className="flex flex-col mb-4 lg:m-8 justify-center">
          <div
            className={
              "grid auto-rows-auto gap-2 " +
              (props.token_images.length == 1 ? "grid-cols-1" : "grid-cols-2")
            }
          >
            {props.token_images.map((token_image) => (
              <div key={token_image}>
                {token_image ? (
                  <Image
                    key={token_image}
                    loader={() => token_image}
                    src={token_image}
                    height="200"
                    width="200"
                    loading="eager"
                    className="rounded-3xl"
                  />
                ) : (
                  <div className="flex items-center text-center justify-center w-[200px] h-[200px]">
                    No Image
                  </div>
                )}{" "}
              </div>
            ))}
          </div>
          <div className="flex flex-row justify-center mt-1">
            <Typography variant="caption18">
              {props.token_ids.join(", ")}
            </Typography>
          </div>
          <div className="flex flex-row justify-center m-2 space-x-2">
            <Typography variant="subtitle2">Assets Pricing: </Typography>
            <Typography variant="body16">
              {formatUnits(tokenPrice, 18) + " ETH"}
            </Typography>
          </div>
        </div>
        <div className="flex flex-col justify-center lg:m-2">
          <div className="flex flex-row m-2">
            <div className="flex flex-col">
              <Typography variant="subtitle2">Loan ID</Typography>
              <Typography variant="body16">{props.loan_id}</Typography>
            </div>
          </div>
          <div className="flex flex-row items-center m-2">
            {loan && (
              <div className="flex flex-col">
                <Typography variant="subtitle2">Interest Rate</Typography>
                <Typography variant="body16">
                  {loan.borrowRate / 100}%
                </Typography>
              </div>
            )}
          </div>
          <div className="flex flex-row items-center m-2">
            <div className="flex flex-col">
              <Typography variant="subtitle2">
                Debt / Liquidation Threshold
              </Typography>
              <Typography variant="body16">
                {loan &&
                  formatUnits(debt, addresses[symbol].decimals) +
                    " / " +
                    formatUnits(liquidationThreshold, 18) +
                    " " +
                    symbol}
              </Typography>
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
                      content="The relation between the debt and the collateral's value. When it reaches 0 the loan can be liquidated."
                      position="top"
                      minWidth={200}
                    >
                      <HelpCircle fontSize="14px" color="#000000" />
                    </Tooltip>
                  </div>
                </div>
                <LinearProgressWithLabel
                  color="success"
                  value={calculateHealthLevel(debt, liquidationThreshold)}
                />
              </div>
            </div>
          )}
          <div className="flex flex-row items-center m-2">
            {liquidationTimestamp && (
              <div className="flex flex-col">
                <Typography variant="subtitle2">
                  Time until liquidation
                </Typography>
                {liquidationTimestamp <
                Date.now() + SECONDS_IN_YEAR * 2 * 1000 ? (
                  <Countdown date={liquidationTimestamp} />
                ) : (
                  "> 2 years"
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-row items-center justify-center m-8 mb-2">
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
      <div className="flex justify-center m-8">
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
                    tx = await wethGatewaySigner.repay(props.loan_id, {
                      value: amount,
                    });
                    await tx.wait(1);
                  } else {
                    tx = await lendingMarket.repay(props.loan_id, amount);
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
                  position: "bottomL",
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
                  loan.pool,
                  ethers.constants.MaxUint256
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

import {
  useAccount,
  useNetwork,
  useContract,
  useProvider,
  useSigner,
} from "wagmi";
import {
  getNewRequestID,
  getAssetPriceSig,
} from "../helpers/getAssetPriceSig.js";
import { getAssetPrice } from "../helpers/getAssetPrice.js";
import loanCenterContract from "../contracts/LoanCenter.json";
import { BigNumber } from "@ethersproject/bignumber";
import { formatUnits } from "@ethersproject/units";
import { HelpCircle } from "@web3uikit/icons";
import {
  useNotification,
  Button,
  Tooltip,
  Typography,
  Illustration,
} from "@web3uikit/core";
import styles from "../styles/Home.module.css";
import contractAddresses from "../contractAddresses.json";
import { calculateHealthLevel } from "../helpers/healthLevel.js";
import { useState, useEffect } from "react";
import Image from "next/image";
import marketContract from "../contracts/Market.json";
import LinearProgressWithLabel from "./LinearProgressWithLabel";
import erc20 from "../contracts/erc20.json";

function isLoanLiquidatable(
  debt,
  maxCollateralization,
  collaterizationBoost,
  price
) {
  return BigNumber.from(debt).gt(
    BigNumber.from(maxCollateralization)
      .add(collaterizationBoost)
      .mul(price)
      .div(10000)
  );
}

export default function Liquidate(props) {
  const [allowance, setAllowance] = useState("0");
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [liquidationLoading, setLiquidationLoading] = useState(false);
  const { address, isConnected } = useAccount();
  const [tokenPrice, setTokenPrice] = useState("0");
  const [liquidationPrice, setLiquidationPrice] = useState("0");
  const [liquidationReward, setLiquidationReward] = useState("0");
  const { chain } = useNetwork();
  const { data: signer } = useSigner();
  const provider = useProvider();
  const dispatch = useNotification();
  const addresses =
    chain && chain.id in contractAddresses
      ? contractAddresses[chain.id]
      : contractAddresses["1"];

  const marketSigner = useContract({
    contractInterface: marketContract.abi,
    addressOrName: addresses.Market,
    signerOrProvider: signer,
  });

  const loanCenterProvider = useContract({
    contractInterface: loanCenterContract.abi,
    addressOrName: addresses.LoanCenter,
    signerOrProvider: provider,
  });

  const wethSigner = useContract({
    contractInterface: erc20,
    addressOrName: addresses["WETH"].address,
    signerOrProvider: signer,
  });

  const wethProvider = useContract({
    contractInterface: erc20,
    addressOrName: addresses["WETH"].address,
    signerOrProvider: provider,
  });

  async function getWETHAllowance() {
    const allowance = await wethProvider.allowance(address, addresses.Market);
    console.log("Got allowance:", allowance);
    setAllowance(allowance.toString());
  }

  async function getLoanDetails() {
    // Get liquidation price for the loan
    const requestId = getNewRequestID();
    const priceSig = await getAssetPriceSig(
      requestId,
      props.loan.tokenAddress,
      props.loan.tokenId,
      chain.id
    );
    console.log("priceSig", priceSig);

    const newLiquidationPrice =
      await loanCenterProvider.getLoanLiquidationPrice(
        props.loan.loanId,
        requestId,
        priceSig
      );

    console.log("newLiquidationPrice", newLiquidationPrice);

    setLiquidationPrice(newLiquidationPrice[0].toString());
    setLiquidationReward(newLiquidationPrice[1].toString());
  }

  async function getAssetPricing() {
    // Get token price
    const price = await getAssetPrice(
      props.loan.tokenAddress,
      props.loan.tokenId
    );
    setTokenPrice(price);
    console.log("price:", price);
  }

  useEffect(() => {
    if ((isConnected, props.loan)) {
      getWETHAllowance();
      getLoanDetails();
      getAssetPricing();
      console.log("loan", props.loan);
    }
  }, [isConnected, props.loan]);

  const handleLiquidateSuccess = async function () {
    props.setVisibility(false);
    setLiquidationLoading(false);
    dispatch({
      type: "success",
      message: "The loan was liquidated.",
      title: "Liquidation Successful!",
      position: "topR",
    });
  };

  const handleApprovalSuccess = async function () {
    getWETHAllowance();
    setApprovalLoading(false);
    dispatch({
      type: "success",
      message: "You can now liquidate the loan.",
      title: "Liquidation Approval Successful!",
      position: "topR",
    });
  };

  return (
    <div>
      {props.loan && (
        <div className={styles.container}>
          <div className="flex flex-col lg:flex-row justify-center mb-2 lg:mb-4">
            {props.loan.tokenURI ? (
              <div className="flex flex-col items-center justify-center mb-4 lg:m-8">
                <Image
                  loader={() => props.loan.tokenURI}
                  src={props.loan.tokenURI}
                  height="300"
                  width="300"
                  unoptimized={true}
                  className="rounded-3xl"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <Illustration height="140px" logo="chest" width="100%" />
                Loading...
              </div>
            )}
            <div className="flex flex-col">
              <div className="flex flex-row items-center m-2">
                <div className="flex flex-col">
                  <Typography variant="subtitle2">Asset ID</Typography>
                  <Typography variant="body16">{props.loan.tokenId}</Typography>
                </div>
              </div>
              <div className="flex flex-row items-center m-2">
                <div className="flex flex-col">
                  <Typography variant="subtitle2">Asset Pricing</Typography>
                  <Typography variant="body16">
                    {formatUnits(tokenPrice, 18) + " WETH"}
                  </Typography>
                </div>
              </div>
              <div className="flex flex-row items-center m-2">
                <div className="flex flex-col">
                  <Typography variant="subtitle2">Debt</Typography>
                  <Typography variant="caption16">
                    {formatUnits(props.loan.debt, 18)} WETH
                  </Typography>
                </div>
              </div>
              <div className="flex flex-row items-center m-2">
                <div className="flex flex-col">
                  <Typography variant="subtitle2">
                    Liquidation Threshold
                  </Typography>
                  <Typography variant="caption16">
                    {formatUnits(
                      BigNumber.from(props.loan.maxLTV)
                        .add(props.loan.boost)
                        .mul(props.loan.price)
                        .div(10000)
                        .toString(),
                      18
                    )}{" "}
                    WETH
                  </Typography>
                </div>
              </div>
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
                        minWidth={300}
                      >
                        <HelpCircle fontSize="14px" color="#000000" />
                      </Tooltip>
                    </div>
                  </div>
                  <LinearProgressWithLabel
                    color="success"
                    value={calculateHealthLevel(
                      props.loan.debt,
                      BigNumber.from(props.loan.maxLTV)
                        .add(props.loan.boost)
                        .mul(props.loan.price)
                        .div(10000)
                        .toString()
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col lg:flex-row justify-center">
            <div className="flex flex-col m-4">
              <Typography variant="subtitle2">Liquidation Price</Typography>
              <Typography variant="caption16">
                {formatUnits(liquidationPrice, 18)} WETH
              </Typography>
            </div>
            <div className="flex flex-col m-4">
              <Typography variant="subtitle2">Liquidation Reward</Typography>
              <Typography variant="caption16">
                {Number(formatUnits(liquidationReward, 18)).toFixed(2)} LE
              </Typography>
            </div>
          </div>
          <div className="flex flex-row m-8 items-center justify-center">
            <div className="flex flex-col">
              {BigNumber.from(liquidationPrice).lte(
                BigNumber.from(allowance)
              ) ? (
                <Button
                  disabled={
                    !isLoanLiquidatable(
                      props.loan.debt,
                      props.loan.maxLTV,
                      props.loan.boost,
                      props.loan.price
                    )
                  }
                  loadingProps={{
                    spinnerColor: "#000000",
                    spinnerType: "loader",
                    direction: "right",
                    size: "24",
                  }}
                  loadingText=""
                  isLoading={liquidationLoading}
                  text="Liquidate"
                  theme="colored"
                  color="red"
                  radius="4"
                  onClick={async function () {
                    try {
                      setLiquidationLoading(true);
                      const requestId = getNewRequestID();
                      const priceSig = await getAssetPriceSig(
                        requestId,
                        props.loan.tokenAddress,
                        props.loan.tokenId,
                        chain.id
                      );
                      console.log("Liquidation loan", props.loan);
                      const tx = await marketSigner.liquidate(
                        props.loan.loanId,
                        requestId,
                        priceSig
                      );
                      await tx.wait(1);
                      handleLiquidateSuccess();
                    } catch (error) {
                      console.log(error);
                    } finally {
                      setLiquidationLoading(false);
                    }
                  }}
                />
              ) : (
                <Button
                  text={
                    isLoanLiquidatable(
                      props.loan.debt,
                      props.loan.maxLTV,
                      props.loan.boost,
                      props.loan.price
                    )
                      ? "Approve WETH for liquidation"
                      : "Liquidation conditions are not met"
                  }
                  theme="colored"
                  isFullWidth
                  color="red"
                  radius="5"
                  isLoading={approvalLoading}
                  disabled={
                    !isLoanLiquidatable(
                      props.loan.debt,
                      props.loan.maxLTV,
                      props.loan.boost,
                      props.loan.price
                    )
                  }
                  loadingProps={{
                    spinnerColor: "#000000",
                    spinnerType: "loader",
                    direction: "right",
                    size: "24",
                  }}
                  loadingText=""
                  onClick={async function () {
                    try {
                      setApprovalLoading(true);
                      const tx = await wethSigner.approve(
                        addresses.Market,
                        liquidationPrice
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
        </div>
      )}
    </div>
  );
}

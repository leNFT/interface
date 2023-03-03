import {
  useAccount,
  useNetwork,
  useContract,
  useProvider,
  useSigner,
} from "wagmi";
import { getAssetsPrice } from "../../helpers/getAssetsPrice.js";
import { getNewRequestID } from "../../helpers/getNewRequestID.js";
import loanCenterContract from "../../contracts/LoanCenter.json";
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
import styles from "../../styles/Home.module.css";
import contractAddresses from "../../contractAddresses.json";
import { calculateHealthLevel } from "../../helpers/healthLevel.js";
import { useState, useEffect } from "react";
import Image from "next/image";
import lendingMarketContract from "../../contracts/LendingMarket.json";
import LinearProgressWithLabel from "../LinearProgressWithLabel";
import erc20 from "../../contracts/erc20.json";
import * as timeago from "timeago.js";

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
  const [loanDetails, setLoanDetails] = useState();
  const { chain } = useNetwork();
  const { data: signer } = useSigner();
  const provider = useProvider();
  const dispatch = useNotification();
  const addresses =
    isConnected && chain.id in contractAddresses
      ? contractAddresses[chain.id]
      : contractAddresses["5"];

  const lendingMarketSigner = useContract({
    contractInterface: lendingMarketContract.abi,
    addressOrName: addresses.LendingMarket,
    signerOrProvider: signer,
  });

  const loanCenterProvider = useContract({
    contractInterface: loanCenterContract.abi,
    addressOrName: addresses.LoanCenter,
    signerOrProvider: provider,
  });

  const wethSigner = useContract({
    contractInterface: erc20,
    addressOrName: addresses["ETH"].address,
    signerOrProvider: signer,
  });

  const wethProvider = useContract({
    contractInterface: erc20,
    addressOrName: addresses["ETH"].address,
    signerOrProvider: provider,
  });

  async function getWETHAllowance() {
    const allowance = await wethProvider.allowance(
      address,
      addresses.LendingMarket
    );
    console.log("Got allowance:", allowance);
    setAllowance(allowance.toString());
  }

  async function getLoanDetails() {
    const loan = await loanCenterProvider.getLoan(props.loan.loanId);

    setLoanDetails(loan);
  }

  async function getAssetPricing() {
    // Get token price
    const price = await getAssetsPrice(
      props.loan.tokenAddress,
      props.loan.tokenIds,
      chain.id
    );
    setTokenPrice(price.price);
    console.log("price:", price.price);
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
      position: "bottomL",
    });
  };

  const handleApprovalSuccess = async function () {
    getWETHAllowance();
    setApprovalLoading(false);
    dispatch({
      type: "success",
      message: "You can now liquidate the loan.",
      title: "Liquidation Approval Successful!",
      position: "bottomL",
    });
  };

  return (
    <div>
      {props.loan && (
        <div className={styles.container}>
          <div className="flex flex-col items-center">
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
              <div className="flex flex-col justify-center">
                <div className="flex flex-row items-center m-2">
                  <div className="flex flex-col">
                    <Typography variant="subtitle2">Asset ID</Typography>
                    <Typography variant="body16">
                      {props.loan.tokenId}
                    </Typography>
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
                <div className="flex flex-row items-center m-2">
                  <div className="flex flex-col">
                    <Typography variant="subtitle2">Interest Rate</Typography>
                    <Typography variant="caption16">
                      {BigNumber.from(props.loan.borrowRate)
                        .div(100)
                        .toString()}
                      %
                    </Typography>
                  </div>
                </div>
                <div className="flex flex-row m-2">
                  <div className="flex flex-col min-w-[80%]">
                    <div className="flex flex-row">
                      <div className="flex flex-col">
                        <Typography variant="subtitle2">
                          Health Level
                        </Typography>
                      </div>
                      <div className="flex flex-col ml-1">
                        <Tooltip
                          content="The relation between the debt and the collateral's value. When it reaches 0 the loan can be liquidated."
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
            <div className="flex flex-col rounded-3xl max-w-max justify-center m-2 p-2">
              <div className="flex flex-row">
                <div className="flex flex-col m-4">
                  <Typography variant="subtitle2">Auction Max Bid</Typography>
                  <Typography variant="caption16">
                    {formatUnits(
                      loanDetails ? loanDetails.auctionMaxBid : "0",
                      18
                    )}{" "}
                    WETH
                  </Typography>
                </div>
                <div className="flex flex-col m-4">
                  <Typography variant="subtitle2">Time until end</Typography>
                  <Typography variant="caption16">
                    {loanDetails
                      ? BigNumber.from(loanDetails.auctionStartTimestamp).eq(0)
                        ? "-"
                        : loanDetails.auctionStartTimestamp + 3600 * 24 >
                          Date.now() / 1000
                        ? "Ending in " +
                          timeago.format(
                            loanDetails.auctionStartTimestamp * 1000
                          )
                        : "Ended " +
                          timeago.format(
                            loanDetails.auctionStartTimestamp * 1000
                          )
                      : "-"}
                  </Typography>
                </div>
              </div>
              <div className="flex flex-row">
                <div className="flex flex-col m-4">
                  <Typography variant="subtitle2">Highest Bidder</Typography>
                  <Typography variant="caption16">
                    {loanDetails?.liquidator.slice(0, 4) +
                      ".." +
                      loanDetails?.liquidator.slice(-3)}
                  </Typography>
                </div>
                <div className="flex flex-col m-4">
                  <Typography variant="subtitle2">Auctioner</Typography>
                  <Typography variant="caption16">
                    {loanDetails?.auctioner.slice(0, 4) +
                      ".." +
                      loanDetails?.auctioner.slice(-3)}
                  </Typography>
                </div>
              </div>
            </div>
            <div className="flex flex-row m-8 items-center justify-center">
              <div className="flex flex-col">
                {BigNumber.from(
                  loanDetails ? loanDetails.auctionMaxBid : "0"
                ).lte(BigNumber.from(allowance)) ? (
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
                        const priceSig = await getAssetsPrice(
                          props.loan.tokenAddress,
                          props.loan.tokenIds,
                          chain.id,
                          requestId
                        );
                        console.log("Liquidation loan", props.loan);
                        const tx = await lendingMarketSigner.liquidate(
                          props.loan.loanId,
                          requestId,
                          priceSig.sig
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
                          addresses.LendingMarket,
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
        </div>
      )}
    </div>
  );
}

import {
  useAccount,
  useNetwork,
  useContract,
  useProvider,
  useSigner,
} from "wagmi";
import { BigNumber } from "@ethersproject/bignumber";
import { formatUnits, parseUnits } from "@ethersproject/units";
import { useNotification, Button, Input, Typography } from "@web3uikit/core";
import styles from "../styles/Home.module.css";
import contractAddresses from "../contractAddresses.json";
import { useState, useEffect } from "react";
import marketContract from "../contracts/Market.json";
import erc20 from "../contracts/erc20.json";

function isLoanLiquidatable(debt, maxCollateralization, price) {
  return BigNumber.from(debt).lt(
    BigNumber.from(maxCollateralization).mul(price).div(10000)
  );
}

export default function Liquidate(props) {
  const [allowance, setAllowance] = useState("0");
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [depositLoading, setDepositLoading] = useState(false);
  const dispatch = useNotification();
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const { data: signer } = useSigner();
  const provider = useProvider();
  const addresses =
    chain && chain.id in contractAddresses
      ? contractAddresses[chain.id]
      : contractAddresses["1"];

  const marketSigner = useContract({
    contractInterface: marketContract.abi,
    addressOrName: addresses.Market,
    signerOrProvider: signer,
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

  useEffect(() => {
    if (isConnected && props.asset) {
      getWETHAllowance();
    }
  }, [isConnected, props.asset]);

  const handleLiquidateSuccess = async function () {
    props.setVisibility(false);
    updateTokenBalance();
    dispatch({
      type: "success",
      message: "Please wait for transaction confirmation.",
      title: "Deposit Successful!",
      position: "topR",
    });
  };

  const handleApprovalSuccess = async function () {
    setApproved(true);
    setApprovalLoading(false);
    dispatch({
      type: "success",
      message: "Please wait for transaction confirmation.",
      title: "Approval Successful!",
      position: "topR",
    });
  };

  return (
    <div className={styles.container}>
      {props.loan.tokenURI ? (
        <div className="flex flex-col items-center">
          <Image
            loader={() => collectionLoan.tokenURI}
            src={collectionLoan.tokenURI}
            height="200"
            width="200"
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
      <div className="flex flex-row mt-8">
        <Typography variant="caption14">Asset ID</Typography>
      </div>
      <div className="flex flex-row  items-center">
        <Typography variant="caption16">{collectionLoan.tokenId}</Typography>
      </div>
      <div className="flex flex-row mt-2">
        <Typography variant="caption14">Debt</Typography>
      </div>
      <div className="flex flex-row  items-center">
        <Typography variant="caption16">
          {formatUnits(collectionLoan.debt, 18)} WETH
        </Typography>
      </div>
      <div className="flex flex-row mt-6">
        <div className="flex flex-col">
          <Typography variant="caption14">Health Level</Typography>
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
      <div>
        <LinearProgressWithLabel
          color="success"
          value={calculateHealthLevel(
            collectionLoan.debt,
            BigNumber.from(maxCollateralization)
              .mul(collectionLoan.price)
              .div(10000)
              .toString()
          )}
        />
      </div>
      <div className="flex flex-row m-4 items-center justify-center">
        <div className="flex flex-col">
          {BigNumber.from(collectionLoan.price)
            .mul(BigNumber.from(82))
            .div(BigNumber.from(100))
            .lt(BigNumber.from(allowance)) ? (
            <Button
              disabled={isLoanLiquidatable(
                collectionLoan.debt,
                maxCollateralization,
                collectionLoan.price
              )}
              text="Liquidate"
              theme="colored"
              type="button"
              size="small"
              color="red"
              radius="5"
              onClick={async function () {
                const requestId = getNewRequestID();
                const priceSig = await getAssetPriceSig(
                  requestId,
                  collectionLoan.tokenAddress,
                  collectionLoan.tokenId,
                  chain.id
                );
                console.log("Liquidation loan", collectionLoan);
                try {
                  await marketSigner.liquidate(
                    collectionLoan.loanId,
                    requestId,
                    priceSig
                  );
                  handleLiquidateSuccess();
                } catch (error) {
                  console.log(error);
                }
              }}
            />
          ) : (
            <Button
              text="Approve WETH for Liquidation"
              theme="colored"
              type="button"
              size="small"
              color="red"
              radius="5"
              disabled={isLoanLiquidatable(
                collectionLoan.debt,
                maxCollateralization,
                collectionLoan.price
              )}
              loadingProps={{
                spinnerColor: "#000000",
              }}
              loadingText="Confirming Approval"
              onClick={async function () {
                try {
                  await wethSigner.approve(
                    addresses.Market,
                    collectionLoan.price
                  );
                  handleApprovalSuccess;
                } catch (error) {
                  console.log(error);
                }
              }}
            ></Button>
          )}
          {isLoanLiquidatable(
            collectionLoan.debt,
            maxCollateralization,
            collectionLoan.price
          ) && (
            <div className="flex justify-center">
              <Typography variant="caption14">
                Liquidation condtitions not met
              </Typography>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

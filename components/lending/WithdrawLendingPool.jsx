import { useNotification } from "@web3uikit/core";
import { BigNumber } from "@ethersproject/bignumber";
import styles from "../../styles/Home.module.css";
import { Button, Input, Typography } from "@web3uikit/core";
import { formatUnits, parseUnits } from "@ethersproject/units";
import { ethers } from "ethers";
import lendingPoolContract from "../../contracts/LendingPool.json";
import contractAddresses from "../../contractAddresses.json";
import { useState, useEffect } from "react";
import lendingMarketContract from "../../contracts/LendingMarket.json";
import wethGatewayContract from "../../contracts/WETHGateway.json";
import {
  useAccount,
  useNetwork,
  useContract,
  useProvider,
  useSigner,
} from "wagmi";

export default function Withdraw(props) {
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [amount, setAmount] = useState("0");
  const [maxAmount, setMaxAmount] = useState("0");
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const [approved, setApproved] = useState(false);
  const { data: signer } = useSigner();
  const [approvalLoading, setApprovalLoading] = useState(false);
  const provider = useProvider();
  const addresses =
    isConnected && chain.id in contractAddresses
      ? contractAddresses[chain.id]
      : contractAddresses["5"];

  const dispatch = useNotification();

  async function updateMaxAmount() {
    const lendingPool = new ethers.Contract(
      props.pool,
      lendingPoolContract.abi,
      provider
    );

    const updatedMaxAmount = await lendingPool.maxWithdraw(address);

    console.log("Updated Max Withdrawal Amount:", updatedMaxAmount);
    setMaxAmount(updatedMaxAmount);
  }

  async function getLendingPoolAllowance() {
    const lendingPool = new ethers.Contract(
      props.pool,
      lendingPoolContract.abi,
      provider
    );
    const updatedAllowance = await lendingPool.allowance(
      address,
      addresses.WETHGateway
    );

    console.log("Updated Allowance:", updatedAllowance);

    if (updatedAllowance.gt(0)) {
      setApproved(true);
    }
  }

  useEffect(() => {
    if (isConnected && props.pool && props.asset) {
      console.log("Got pool address, setting the rest...", props.pool);
      console.log(" props.asset", props.asset);
      updateMaxAmount();
      if (props.assetSymbol == "ETH") {
        getLendingPoolAllowance();
      }
    }
  }, [isConnected, props.pool, props.asset]);

  const handleWithdrawalSuccess = async function () {
    props.updateUI();
    props.setVisibility(false);
    updateMaxAmount();
    dispatch({
      type: "success",
      message: "Tokens are now back in your wallet.",
      title: "Withdrawal Successful! ",
      position: "bottomL",
    });
  };

  const handleApprovalSuccess = async function () {
    setApproved(true);
    dispatch({
      type: "success",
      message: "You can now withdraw you ETH.",
      title: "Approval Successful!",
      position: "bottomL",
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
      <div className="flex flex-row items-center justify-center">
        <div className="flex flex-col">
          <Typography variant="subtitle2">Maximum withdrawal amount</Typography>
          <Typography variant="body16">
            {formatUnits(maxAmount, 18) + " " + props.assetSymbol}
          </Typography>
        </div>
      </div>
      <div className="flex flex-row items-center justify-center mx-8 mt-12 mb-2">
        <Input
          label="Amount"
          type="number"
          step="any"
          value={amount && formatUnits(amount, 18)}
          validation={{
            numberMax: Number(formatUnits(maxAmount, 18)),
            numberMin: 0,
          }}
          onChange={handleInputChange}
        />
      </div>
      <div className="flex flex-row justify-center">
        <div className="flex flex-col">
          <Button
            onClick={() =>
              setAmount(BigNumber.from(maxAmount).mul(2500).div(10000))
            }
            text="25%"
            theme="outline"
          />
        </div>
        <div className="flex flex-col">
          <Button
            onClick={() =>
              setAmount(BigNumber.from(maxAmount).mul(5000).div(10000))
            }
            text="50%"
            theme="outline"
          />
        </div>
        <div className="flex flex-col">
          <Button
            onClick={() =>
              setAmount(BigNumber.from(maxAmount).mul(7500).div(10000))
            }
            text="75%"
            theme="outline"
          />
        </div>
        <div className="flex flex-col">
          <Button
            onClick={() => setAmount(maxAmount)}
            text="100%"
            theme="outline"
          />
        </div>
      </div>
      {props.assetSymbol != "ETH" || approved ? (
        <div className="m-8">
          <Button
            text="Withdraw"
            theme="secondary"
            isFullWidth
            loadingProps={{
              spinnerColor: "#000000",
              spinnerType: "loader",
              direction: "right",
              size: "24",
            }}
            loadingText=""
            isLoading={withdrawalLoading}
            onClick={async function () {
              const wethGateway = new ethers.Contract(
                addresses.WETHGateway,
                wethGatewayContract.abi,
                signer
              );
              const lendingMarket = new ethers.Contract(
                addresses.LendingMarket,
                lendingMarketContract.abi,
                signer
              );
              console.log("props.assetSymbol", props.assetSymbol);
              if (BigNumber.from(amount).lte(BigNumber.from(maxAmount))) {
                try {
                  setWithdrawalLoading(true);
                  var tx;
                  if (props.assetSymbol == "ETH") {
                    console.log("Withdrawal ETH: ", amount);
                    tx = await wethGateway.withdrawETH(props.pool, amount);
                  } else {
                    tx = await lendingMarket.withdraw(props.pool, amount);
                  }
                  await tx.wait(1);
                  handleWithdrawalSuccess();
                } catch (error) {
                  console.log(error);
                } finally {
                  setWithdrawalLoading(false);
                }
              } else {
                dispatch({
                  type: "error",
                  message: "Amount is bigger than max permited withdrawal",
                  title: "Error",
                  position: "bottomL",
                });
              }
            }}
          />
        </div>
      ) : (
        <div className="m-8">
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
                console.log("signer.", signer);
                const tx = await lendingPoolSigner.approve(
                  addresses.WETHGateway,
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
        </div>
      )}
    </div>
  );
}

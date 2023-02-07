import {
  useAccount,
  useBalance,
  useNetwork,
  useContract,
  useProvider,
  useSigner,
} from "wagmi";
import { BigNumber } from "@ethersproject/bignumber";
import { formatUnits, parseUnits } from "@ethersproject/units";
import { useNotification, Button, Input, Typography } from "@web3uikit/core";
import styles from "../../styles/Home.module.css";
import contractAddresses from "../../contractAddresses.json";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import lendingPoolContract from "../../contracts/LendingPool.json";
import wethGatewayContract from "../../contracts/WETHGateway.json";
import erc20 from "../../contracts/erc20.json";

export default function DepositLendingPool(props) {
  const [amount, setAmount] = useState("0");
  const [balance, setBalance] = useState("0");
  const [approved, setApproved] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [depositLoading, setDepositLoading] = useState(false);
  const dispatch = useNotification();
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const { data: signer } = useSigner();
  const provider = useProvider();
  const addresses =
    isConnected && chain.id in contractAddresses
      ? contractAddresses[chain.id]
      : contractAddresses["5"];

  async function updateTokenBalance() {
    const tokenProvider = new ethers.Contract(props.asset, erc20, provider);
    var updatedBalance;

    console.log("props.assetSymbol", props.assetSymbol);

    if (props.assetSymbol == "ETH") {
      console.log("props.assetSymbol", props.assetSymbol);
      updatedBalance = await provider.getBalance(address);
    } else {
      updatedBalance = await tokenProvider.balanceOf(address);
    }

    console.log("Updated Balance:", updatedBalance);
    setBalance(updatedBalance.toString());
  }

  async function getTokenAllowance() {
    const tokenProvider = new ethers.Contract(props.asset, erc20, provider);

    const allowance = await tokenProvider.allowance(address, props.pool);

    console.log("Got allowance:", allowance);

    if (!allowance.eq(BigNumber.from(0)) || props.assetSymbol == "ETH") {
      setApproved(true);
    } else {
      setApproved(false);
    }
  }

  // Set the rest of the UI when we receive the pool address
  useEffect(() => {
    if (isConnected && props.pool && props.asset && props.assetSymbol) {
      console.log("Got pool address, setting the rest...", props.pool);
      getTokenAllowance();
      updateTokenBalance();
    }
  }, [props.pool, props.asset, props.assetSymbol, isConnected]);

  const handleDepositSuccess = async function () {
    console.log("Deposited", amount);
    props.updateUI();
    props.setVisibility(false);
    updateTokenBalance();
    dispatch({
      type: "success",
      message: "Your tokens were deposited in the pool.",
      title: "Deposit Successful!",
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
      setAmount(parseUnits(e.target.value, 18).toString());
    } else {
      setAmount("0");
    }
  }

  return (
    <div className={styles.container}>
      <div className="flex flex-row items-center justify-center">
        <div className="flex flex-col">
          <Typography variant="subtitle2">My Balance</Typography>
          <Typography variant="body16">
            {formatUnits(balance, 18) + " " + props.assetSymbol}
          </Typography>
        </div>
      </div>
      <div className="flex flex-row items-center justify-center m-8">
        <Input
          label="Amount"
          type="number"
          step="any"
          validation={{
            numberMax: Number(formatUnits(balance, 18)),
            numberMin: 0,
          }}
          disabled={!approved}
          onChange={handleInputChange}
        />
      </div>
      {approved ? (
        <div className="m-8 mt-2">
          <Button
            text="Deposit"
            theme="secondary"
            isFullWidth
            loadingProps={{
              spinnerColor: "#000000",
              spinnerType: "loader",
              direction: "right",
              size: "24",
            }}
            loadingText=""
            isLoading={depositLoading}
            onClick={async function () {
              const wethGateway = new ethers.Contract(
                addresses.WETHGateway,
                wethGatewayContract.abi,
                signer
              );

              if (BigNumber.from(amount).lte(BigNumber.from(balance))) {
                try {
                  setDepositLoading(true);
                  var tx;
                  if (props.assetSymbol == "ETH") {
                    console.log("Depositing ETH");
                    tx = await wethGateway.depositETH(props.pool, {
                      value: amount,
                    });
                  } else {
                    const pool = new ethers.Contract(
                      props.pool,
                      lendingPoolContract.abi,
                      signer
                    );
                    tx = await pool.deposit(amount, address);
                  }
                  await tx.wait(1);
                  handleDepositSuccess();
                } catch (error) {
                  console.log(error);
                } finally {
                  setDepositLoading(false);
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
          ></Button>
        </div>
      ) : (
        <div className="m-8 mt-2">
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
                const underlyingAsset = new ethers.Contract(
                  props.asset,
                  erc20,
                  signer
                );
                const tx = await underlyingAsset.approve(
                  props.pool,
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

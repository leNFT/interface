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
import { useNotification, Button, Typography, Input } from "@web3uikit/core";
import styles from "../../styles/Home.module.css";
import contractAddresses from "../../contractAddresses.json";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import lendingGaugeContract from "../../contracts/LendingGauge.json";
import erc20 from "../../contracts/erc20.json";

export default function StakeLendingGauge(props) {
  const [amount, setAmount] = useState("0");
  const [balance, setBalance] = useState("0");
  const [approved, setApproved] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [stakeLoading, setStakeLoading] = useState(false);
  const dispatch = useNotification();
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const provider = useProvider();
  const { data: signer } = useSigner();
  const addresses =
    isConnected && chain.id in contractAddresses
      ? contractAddresses[chain.id]
      : contractAddresses["5"];

  const lpTokenProvider = useContract({
    contractInterface: erc20,
    addressOrName: props.lpToken,
    signerOrProvider: provider,
  });

  const gaugeSigner = useContract({
    contractInterface: lendingGaugeContract.abi,
    addressOrName: props.gauge,
    signerOrProvider: signer,
  });

  async function getUserBalance() {
    // Get lp positions
    const updatedBalance = BigNumber.from(
      await lpTokenProvider.balanceOf(address)
    ).toString();
    setBalance(updatedBalance);
    console.log("updatedBalance", updatedBalance);
  }

  async function getAllowance() {
    const allowance = await lpTokenProvider.allowance(address, props.gauge);

    console.log("Got allowance:", allowance);

    if (!BigNumber.from(allowance).eq(BigNumber.from(0))) {
      setApproved(true);
    } else {
      setApproved(false);
    }
  }

  // Set the rest of the UI when we receive the reserve address
  useEffect(() => {
    if (props.lpToken && props.gauge) {
      console.log("Got trading pool address...", props.gauge);
      getAllowance();
      getUserBalance();
    }
  }, [props.lpToken, props.gauge]);

  function handleInputChange(e) {
    if (e.target.value != "") {
      setAmount(parseUnits(e.target.value, 18).toString());
    } else {
      setAmount("0");
    }
  }

  const handleStakeSuccess = async function () {
    props.updateUI();
    props.setVisibility(false);
    dispatch({
      type: "success",
      message: "Your LP was staked in the gauge.",
      title: "Stake Successful!",
      position: "bottomL",
    });
  };

  const handleApprovalSuccess = async function () {
    setApproved(true);
    dispatch({
      type: "success",
      message: "You can now stake.",
      title: "Approval Successful!",
      position: "bottomL",
    });
  };

  return (
    <div className={styles.container}>
      <div className="flex flex-row items-center justify-center">
        <div className="flex flex-col">
          <Typography variant="subtitle2">My Balance</Typography>
          <Typography variant="body16">
            {formatUnits(balance, 18) + " " + props.lpTokenSymbol}
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
      <div className="flex flex-row items-center justify-center m-8">
        {approved ? (
          <Button
            text={"Stake LP"}
            theme="secondary"
            isFullWidth
            loadingProps={{
              spinnerColor: "#000000",
              spinnerType: "loader",
              direction: "right",
              size: "24",
            }}
            disabled={!approved}
            loadingText=""
            isLoading={stakeLoading}
            onClick={async function () {
              try {
                setStakeLoading(true);
                console.log("signer.", signer);
                const tx = await gaugeSigner.deposit(amount);
                await tx.wait(1);
                handleStakeSuccess();
              } catch (error) {
                console.log(error);
              } finally {
                setStakeLoading(false);
              }
            }}
          ></Button>
        ) : (
          <Button
            text="Approve LP"
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
                const lpTokenSigner = new ethers.Contract(
                  props.lpToken,
                  erc20,
                  signer
                );

                const tx = await lpTokenSigner.approve(
                  props.gauge,
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

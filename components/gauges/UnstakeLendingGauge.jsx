import {
  useAccount,
  useNetwork,
  useContract,
  useProvider,
  useSigner,
} from "wagmi";
import { ethers } from "ethers";
import { formatUnits, parseUnits } from "@ethersproject/units";
import { useNotification, Button, Typography, Input } from "@web3uikit/core";
import styles from "../../styles/Home.module.css";
import contractAddresses from "../../contractAddresses.json";
import { useState, useEffect } from "react";
import lendingGaugeContract from "../../contracts/LendingGauge.json";

export default function UnstakeLendingGauge(props) {
  const [unstakeLoading, setUnstakeLoading] = useState(false);
  const [amount, setAmount] = useState("0");
  const dispatch = useNotification();
  const [maxAmount, setMaxAmount] = useState("0");
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const provider = useProvider();
  const { data: signer } = useSigner();
  var addresses = contractAddresses[chain ? chain.id : 1];
  async function updateMaxAmount() {
    const gauge = new ethers.Contract(
      props.gauge,
      lendingGaugeContract.abi,
      provider
    );
    const updatedMaxAmount = await gauge.balanceOf(address);

    console.log("Updated Max Withdrawal Amount:", updatedMaxAmount);
    setMaxAmount(updatedMaxAmount);
  }

  useEffect(() => {
    if (isConnected && props.gauge) {
      console.log("Got gauge address, setting the rest...", props.gauge);
      updateMaxAmount();
    }
  }, [props.gauge]);

  const handleUnstakeSuccess = async function () {
    props.updateUI();
    props.setVisibility(false);
    dispatch({
      type: "success",
      message: "Your LP was successfully unstaked from the gauge.",
      title: "Removal Successful!",
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
          <Typography variant="subtitle2">Maximum unstake amount</Typography>
          <Typography variant="body16">
            {formatUnits(maxAmount, 18) + " " + props.lpTokenSymbol}
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
      <div className="flex flex-row items-center justify-center m-8">
        <Button
          text={"Unstake LP"}
          theme="secondary"
          isFullWidth
          loadingProps={{
            spinnerColor: "#000000",
            spinnerType: "loader",
            direction: "right",
            size: "24",
          }}
          loadingText=""
          isLoading={unstakeLoading}
          onClick={async function () {
            const gauge = new ethers.Contract(
              props.gauge,
              lendingGaugeContract.abi,
              provider
            );
            try {
              setUnstakeLoading(true);
              console.log("gaugeSigner.", gauge);
              console.log("amount.", amount);
              const tx = await gauge.withdraw(amount);
              await tx.wait(1);
              handleUnstakeSuccess();
            } catch (error) {
              console.log(error);
            } finally {
              setUnstakeLoading(false);
            }
          }}
        ></Button>
      </div>
    </div>
  );
}

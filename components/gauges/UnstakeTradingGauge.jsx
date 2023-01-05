import {
  useAccount,
  useNetwork,
  useContract,
  useProvider,
  useSigner,
} from "wagmi";
import { useNotification, Button, Typography } from "@web3uikit/core";

import styles from "../../styles/Home.module.css";
import contractAddresses from "../../contractAddresses.json";
import { useState, useEffect } from "react";
import tradingGaugeContract from "../../contracts/TradingGauge.json";

export default function UnstakeTradingGauge(props) {
  const [unstakeLoading, setUnstakeLoading] = useState(false);
  const dispatch = useNotification();
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const provider = useProvider();
  const { data: signer } = useSigner();
  const addresses =
    chain && chain.id in contractAddresses
      ? contractAddresses[chain.id]
      : contractAddresses["1"];

  const gaugeProvider = useContract({
    contractInterface: tradingGaugeContract.abi,
    addressOrName: props.gauge,
    signerOrProvider: provider,
  });

  const gaugeSigner = useContract({
    contractInterface: tradingGaugeContract.abi,
    addressOrName: props.gauge,
    signerOrProvider: signer,
  });

  useEffect(() => {}, []);

  const handleUnstakeSuccess = async function () {
    props.updateUI();
    props.setVisibility(false);
    dispatch({
      type: "success",
      message: "Your LP was successfully unstaked from the gauge.",
      title: "Removal Successful!",
      position: "topR",
    });
  };

  return (
    <div className={styles.container}>
      <div className="flex flex-row items-center justify-center m-8">
        <Typography variant="subtitle1">{"LP #" + props.selectedLP}</Typography>
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
            try {
              setUnstakeLoading(true);
              console.log("signer.", signer);
              console.log("props.selectedLP.", props.selectedLP);
              const tx = await gaugeSigner.withdraw(props.selectedLP);
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

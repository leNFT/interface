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
import { getNFTImage } from "../../helpers/getNFTImage";
import { ethers } from "ethers";

export default function UnstakeTradingGauge(props) {
  const [unstakeLoading, setUnstakeLoading] = useState(false);
  const [lpImage, setLPImage] = useState("");
  const dispatch = useNotification();
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const { data: signer } = useSigner();
  async function getLPImage() {
    const lpImage = await getNFTImage(
      props.lpToken,
      props.selectedLP,
      chain.id
    );
    console.log("lpImage", lpImage);
    setLPImage(lpImage);
  }

  useEffect(() => {
    if (isConnected && props.selectedLP !== undefined) {
      getLPImage();
    }
  }, [isConnected, props.selectedLP]);

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

  return (
    <div className={styles.container}>
      <div className="flex flex-col items-center space-y-2 justify-center m-8">
        <img src={lpImage} alt="LP Image" />
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
            const gauge = new ethers.Contract(
              props.gauge,
              tradingGaugeContract.abi,
              signer
            );
            try {
              setUnstakeLoading(true);
              console.log("gaugeSigner.", gauge);
              console.log("props.selectedLP.", props.selectedLP);
              const tx = await gauge.withdraw(props.selectedLP);
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

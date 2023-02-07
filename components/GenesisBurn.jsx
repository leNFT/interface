import { BigNumber } from "@ethersproject/bignumber";
import { formatUnits, parseUnits } from "@ethersproject/units";
import { useNotification, Button, Input, Typography } from "@web3uikit/core";
import styles from "../styles/Home.module.css";
import contractAddresses from "../contractAddresses.json";
import {
  useAccount,
  useNetwork,
  useContract,
  useProvider,
  useSigner,
} from "wagmi";
import { useState, useEffect } from "react";
import Slider from "@mui/material/Slider";
import genesisNFTContract from "../contracts/GenesisNFT.json";

export default function GenesisBurn(props) {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const provider = useProvider();
  const { data: signer } = useSigner();
  const [burningLoading, setBurningLoading] = useState(false);
  const [unlockTimestamp, setUnlockTimestamp] = useState(0);

  const addresses =
    isConnected && chain.id in contractAddresses
      ? contractAddresses[chain.id]
      : contractAddresses["5"];
  const dispatch = useNotification();

  const genesisNFTProvider = useContract({
    contractInterface: genesisNFTContract.abi,
    addressOrName: addresses.GenesisNFT,
    signerOrProvider: provider,
  });

  const genesisNFTSigner = useContract({
    contractInterface: genesisNFTContract.abi,
    addressOrName: addresses.GenesisNFT,
    signerOrProvider: signer,
  });

  async function updateBurnInfo() {
    const updatedUnlockTimestamp = (
      await genesisNFTProvider.getUnlockTimestamp(props.tokenId)
    ).toNumber();
    console.log("updatedUnlockTimestamp", updatedUnlockTimestamp);
    setUnlockTimestamp(updatedUnlockTimestamp);
  }

  useEffect(() => {
    if (isConnected) {
      updateBurnInfo();
    }
  }, [isConnected, props.tokenId]);

  const handleBurnSuccess = async function () {
    console.log("Burned");
    props.setVisibility(false);
    props.updateUI();
    dispatch({
      type: "success",
      message: "You have burned your Genesis NFT.",
      title: "Burn Successful!",
      position: "bottomL",
    });
  };

  return (
    <div className={styles.container}>
      <div className="flex flex-row items-center justify-center m-4 text-center">
        <div className="flex flex-col">
          <Typography variant="subtitle2">Token ID</Typography>
          <Typography variant="body16">{props.tokenId}</Typography>
        </div>
      </div>
      <div className="flex flex-row items-center justify-center m-4 text-center">
        <div className="flex flex-col">
          <Typography variant="subtitle2">Unlock Date</Typography>
          <Typography variant="body16">
            {new Date(unlockTimestamp * 1000).toDateString()}
          </Typography>
        </div>
      </div>
      <div className="flex flex-row items-center justify-center m-8">
        <Button
          text="BURN"
          disabled={Date.now() / 1000 < unlockTimestamp}
          theme="secondary"
          isFullWidth
          loadingProps={{
            spinnerColor: "#000000",
            spinnerType: "loader",
            direction: "right",
            size: "24",
          }}
          loadingText=""
          isLoading={burningLoading}
          onClick={async function () {
            try {
              setBurningLoading(true);
              const tx = await genesisNFTSigner.burn(props.tokenId);
              await tx.wait(1);
              await handleBurnSuccess();
            } catch (error) {
              console.log(error);
            } finally {
              setBurningLoading(false);
            }
          }}
        />
      </div>
    </div>
  );
}

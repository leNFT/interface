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

export default function GenesisMint(props) {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const provider = useProvider();
  const { data: signer } = useSigner();
  const [mintingLoading, setMintingLoading] = useState(false);
  const [rewards, setRewards] = useState("0");
  const [locktimeDays, setLocktimeDays] = useState(30);

  const addresses =
    chain && chain.id in contractAddresses
      ? contractAddresses[chain.id]
      : contractAddresses["1"];
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

  async function updateMintInfo() {
    const updatedRewards = await genesisNFTProvider.getGenesisNativeTokens(
      locktimeDays * 86400
    );
    setRewards(updatedRewards.toString());
  }

  useEffect(() => {
    if (isConnected) {
      updateMintInfo();
    }
  }, [isConnected]);

  const handleMintingSuccess = async function () {
    console.log("Minted");
    props.setVisibility(false);
    dispatch({
      type: "success",
      message: "You have voted.",
      title: "Vote Successful!",
      position: "topR",
    });
  };

  function handleInputChange(event, newValue) {
    setLocktimeDays(newValue);
    updateMintInfo();
  }

  return (
    <div className={styles.container}>
      <div className="flex flex-row items-center justify-center m-4 text-center">
        <div className="flex flex-col">
          <Typography variant="subtitle2">Price</Typography>
          <Typography variant="body16">0.3 ETH</Typography>
        </div>
      </div>
      <div className="flex flex-row items-center justify-center m-4 text-center">
        <div className="flex flex-col">
          <Typography variant="subtitle2">Token ID</Typography>
          <Typography variant="body16">{props.supply + 1}</Typography>
        </div>
      </div>
      <div className="flex flex-col p-2 border-4 rounded-3xl">
        <div className="flex flex-col md:flex-row items-center justify-center mt-2 text-center">
          <div className="flex flex-col m-2 md:m-4">
            <Typography variant="subtitle2">Lock Time</Typography>
            <Typography variant="body16">{locktimeDays + " days"}</Typography>
          </div>
          <div className="flex flex-col m-2 md:m-4">
            <Typography variant="subtitle2">LE Rewards</Typography>
            <Typography variant="body16">
              {formatUnits(rewards, 18) + " LE"}
            </Typography>
          </div>
        </div>
        <div className="flex flex-row items-center justify-center p-4">
          <Slider
            valueLabelDisplay="auto"
            onChange={handleInputChange}
            min={30}
            step={1}
            max={365}
          />
        </div>
      </div>
      <div className="flex flex-row items-center justify-center m-8">
        <Button
          text="MINT"
          theme="secondary"
          isFullWidth
          loadingProps={{
            spinnerColor: "#000000",
            spinnerType: "loader",
            direction: "right",
            size: "24",
          }}
          loadingText=""
          isLoading={mintingLoading}
          onClick={async function () {
            try {
              setMintingLoading(true);
              const tx = await genesisNFTSigner.mint(locktime);
              await tx.wait(1);
              await handleMintingSuccess();
            } catch (error) {
              console.log(error);
            } finally {
              setMintingLoading(false);
            }
          }}
        />
      </div>
    </div>
  );
}

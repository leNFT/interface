import { useNotification, Button, Input } from "@web3uikit/core";
import styles from "../styles/Home.module.css";
import contractAddresses from "../contractAddresses.json";
import { useAccount, useNetwork, useContract, useSigner } from "wagmi";
import marketContract from "../contracts/Market.json";
import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";

export default function Vote(props) {
  const { isConnected } = useAccount();
  const { chain } = useNetwork();
  const { data: signer } = useSigner();
  const [creatingLoading, setCreatingLoading] = useState(false);
  const [collection, setCollection] = useState("");
  const [asset, setAsset] = useState("");
  const dispatch = useNotification();

  const addresses =
    chain && chain.id in contractAddresses
      ? contractAddresses[chain.id]
      : contractAddresses["1"];

  const marketSigner = useContract({
    contractInterface: marketContract.abi,
    addressOrName: addresses.Market,
    signerOrProvider: signer,
  });

  useEffect(() => {
    if (isConnected) {
    }
  }, [isConnected]);

  const handleCreateReserveSuccess = async function () {
    props.updateUI();
    props.setVisibility(false);
    dispatch({
      type: "success",
      message: "You have create a new reserve.",
      title: "Create Successful!",
      position: "topR",
    });
  };

  function handleCollectionChange(e) {
    setCollection(e.target.value);
  }

  function handleAssetChange(e) {
    setAsset(e.target.value);
  }

  return (
    <div className={styles.container}>
      <div className="flex flex-row items-center justify-center m-8">
        <Input
          label="Collection Address"
          type="text"
          onChange={handleCollectionChange}
        />
      </div>
      <div className="flex flex-row items-center justify-center m-8">
        <FormControl fullWidth>
          <InputLabel>Asset</InputLabel>
          <Select
            value={asset}
            label="Asset"
            onChange={handleAssetChange}
            className="rounded-2xl"
          >
            <MenuItem value={"0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6"}>
              ETH
            </MenuItem>
          </Select>
        </FormControl>
      </div>
      <div className="flex flex-row items-center justify-center m-8 mt-2">
        <Button
          text="Create Reserve"
          theme="secondary"
          isFullWidth
          loadingProps={{
            spinnerColor: "#000000",
            spinnerType: "loader",
            direction: "right",
            size: "24",
          }}
          loadingText=""
          isLoading={creatingLoading}
          onClick={async function () {
            try {
              setCreatingLoading(true);
              const tx = await marketSigner.createReserve(collection, asset);
              await tx.wait(1);
              await handleCreateReserveSuccess();
            } catch (error) {
              console.log(error);
            } finally {
              setCreatingLoading(false);
            }
          }}
        ></Button>
      </div>
    </div>
  );
}

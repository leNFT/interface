import { useNotification, Button, Input, Typography } from "@web3uikit/core";
import contractAddresses from "../../contractAddresses.json";
import {
  useAccount,
  useNetwork,
  useContract,
  useSigner,
  useProvider,
} from "wagmi";
import Box from "@mui/material/Box";
import { formatUnits } from "@ethersproject/units";
import { BigNumber } from "@ethersproject/bignumber";
import { useState, useEffect } from "react";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import { ethers } from "ethers";
import Select from "@mui/material/Select";
import tradingPoolFactoryContract from "../../contracts/TradingPoolFactory.json";

export default function CreateTradingPool(props) {
  const { isConnected } = useAccount();
  const { chain } = useNetwork();
  const { data: signer } = useSigner();
  const [creatingLoading, setCreatingLoading] = useState(false);
  const [collection, setCollection] = useState("");

  const provider = useProvider();
  const [errorMessage, setErrorMessage] = useState("");
  const [swapFee, setSwapFee] = useState("0");

  const dispatch = useNotification();

  const addresses =
    chain && chain.id in contractAddresses
      ? contractAddresses[chain.id]
      : contractAddresses["1"];
  const [asset, setAsset] = useState(addresses.ETH.address);

  const factorySigner = useContract({
    contractInterface: tradingPoolFactoryContract.abi,
    addressOrName: addresses.TradingPoolFactory,
    signerOrProvider: signer,
  });

  const factoryProvider = useContract({
    contractInterface: tradingPoolFactoryContract.abi,
    addressOrName: addresses.TradingPoolFactory,
    signerOrProvider: provider,
  });

  async function getTradingPoolDefaultValues() {
    // Get swap fee
    const updatedSwapFee = (
      await factoryProvider.getDefaultSwapFee()
    ).toString();
    console.log("swapFee", updatedSwapFee);
    setSwapFee(updatedSwapFee);
  }

  useEffect(() => {
    if (isConnected) {
      getTradingPoolDefaultValues();
    }
  }, [isConnected]);

  const handleCreateTradingPoolSuccess = async function () {
    props.updateUI();
    setCollection("");
    props.setVisibility(false);
    dispatch({
      type: "success",
      message: "You have create a new trading pool.",
      title: "Create Successful!",
      position: "bottomR",
    });
  };

  async function getErrorMessage(collection) {
    if (collection == "") {
      setErrorMessage("");
      return;
    }

    if (ethers.utils.isAddress(collection)) {
      const pool = (
        await factoryProvider.getTradingPool(collection, asset)
      ).toString();
      console.log("pool", pool);
      if (pool != ethers.constants.AddressZero) {
        setErrorMessage("Pool already exists!");
        return;
      }
    } else {
      setErrorMessage("Invalid Address!");
    }
  }

  function handleCollectionChange(e) {
    getErrorMessage(e.target.value);
    setCollection(e.target.value);
  }

  function handleAssetChange(e) {
    setAsset(e.target.value);
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col md:flex-row justify-center m-2 border-2 rounded-2xl max-w-lg self-center">
        <div className="flex flex-col my-2 md:m-2">
          <div className="flex flex-col m-4">
            <Typography variant="subtitle2">Swap Fee</Typography>
            <Typography variant="caption16">{swapFee / 100 + "%"}</Typography>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center mt-8 mb-2 mx-2 md:mx-8">
        <Input
          description="The address of the pool's NFT collection."
          width="100%"
          label="Collection Address"
          type="text"
          value={collection}
          onChange={handleCollectionChange}
        />
      </div>

      <div className="flex flex-row items-center justify-center my-8 mx-2 md:mx-8">
        <FormControl fullWidth>
          <InputLabel>Asset</InputLabel>
          <Select
            value={asset}
            label="Asset"
            onChange={handleAssetChange}
            className="rounded-2xl"
          >
            <MenuItem value={addresses.ETH.address}>Ethereum (ETH)</MenuItem>
          </Select>
        </FormControl>
      </div>
      {errorMessage && (
        <Box
          className="flex flex-col items-center text-red-500 mb-4"
          sx={{
            fontFamily: "Monospace",
            fontSize: "caption.fontSize",
            fontWeight: "bold",
            letterSpacing: 1,
          }}
        >
          {errorMessage}
        </Box>
      )}
      <div className="flex flex-row items-center justify-center m-8 mt-2">
        <Button
          text="Create Trading Pool"
          theme="secondary"
          isFullWidth
          loadingProps={{
            spinnerColor: "#000000",
            spinnerType: "loader",
            direction: "right",
            size: "24",
          }}
          disabled={!collection || !asset || !errorMessage}
          loadingText=""
          isLoading={creatingLoading}
          onClick={async function () {
            try {
              setCreatingLoading(true);
              const tx = await factorySigner.createTradingPool(
                collection,
                asset
              );
              await tx.wait(1);
              await handleCreateTradingPoolSuccess();
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

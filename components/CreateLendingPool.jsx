import { useNotification, Button, Input, Typography } from "@web3uikit/core";
import contractAddresses from "../contractAddresses.json";
import {
  useAccount,
  useNetwork,
  useContract,
  useSigner,
  useProvider,
} from "wagmi";
import { formatUnits } from "@ethersproject/units";
import { BigNumber } from "@ethersproject/bignumber";
import lendingMarketContract from "../contracts/LendingMarket.json";
import { useState, useEffect } from "react";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import { getCollectionInfo } from "../helpers/getCollectionInfo.js";

export default function CreateLendingPool(props) {
  const { isConnected } = useAccount();
  const { chain } = useNetwork();
  const { data: signer } = useSigner();
  const [creatingLoading, setCreatingLoading] = useState(false);
  const [collection, setCollection] = useState("");
  const [asset, setAsset] = useState("");
  const [collectionFloorPrice, setCollectionFloorPrice] = useState();
  const provider = useProvider();
  const [tvlSafeguard, setTVLSafeguard] = useState("0");
  const [maximumUtilizationRate, setMaximumUtilizationRate] = useState("0");
  const [liquidationFee, setLiquidationFee] = useState("0");
  const [liquidationPenalty, setLiquidationPenalty] = useState("0");

  const dispatch = useNotification();

  const addresses =
    chain && chain.id in contractAddresses
      ? contractAddresses[chain.id]
      : contractAddresses["1"];

  const lendingMarketContractSigner = useContract({
    contractInterface: lendingMarketContract.abi,
    addressOrName: addresses.LendingMarket,
    signerOrProvider: signer,
  });

  const lendingMarketContractProvider = useContract({
    contractInterface: lendingMarketContract.abi,
    addressOrName: addresses.LendingMarket,
    signerOrProvider: provider,
  });

  async function getLendingPoolDefaultValues() {
    // Get default underlying safeguard
    const updatedTVLSafeguard = (
      await lendingMarketContractProvider.getDefaultTVLSafeguard()
    ).toString();

    setTVLSafeguard(updatedTVLSafeguard);

    // Get default maximum utilization rate
    const updatedMaximumUtilizationRate = (
      await lendingMarketContractProvider.getDefaultMaximumUtilizationRate()
    ).toString();

    setMaximumUtilizationRate(updatedMaximumUtilizationRate);

    // Get protocol liquidation fee
    const updatedLiquidationFee = (
      await lendingMarketContractProvider.getDefaultLiquidationFee()
    ).toString();

    setLiquidationFee(updatedLiquidationFee);

    // Get underlying safeguard
    const updatedLiquidationPenalty = (
      await lendingMarketContractProvider.getDefaultLiquidationPenalty()
    ).toString();

    setLiquidationPenalty(updatedLiquidationPenalty);
  }

  async function updateCollectionInfo(collection) {
    const collectionInfo = await getCollectionInfo(collection, chain.id);
    setCollectionFloorPrice(collectionInfo.floorPrice);
  }

  useEffect(() => {
    if (isConnected) {
      getLendingPoolDefaultValues();
    }
  }, [isConnected]);

  const handleCreateReserveSuccess = async function () {
    props.updateUI();
    props.setVisibility(false);
    dispatch({
      type: "success",
      message: "You have create a new lending pool.",
      title: "Create Successful!",
      position: "topR",
    });
  };

  function handleCollectionChange(e) {
    setCollection(e.target.value);
    updateCollectionInfo(e.target.value);
  }

  function handleAssetChange(e) {
    setAsset(e.target.value);
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col md:flex-row justify-center m-2 border-2 rounded-2xl max-w-lg self-center">
        <div className="flex flex-col my-2 md:m-2">
          <div className="flex flex-col m-4">
            <Typography variant="subtitle2">Liquidation Penalty</Typography>
            <Typography variant="caption16">
              {BigNumber.from(liquidationPenalty).div(100) + "%"}
            </Typography>
          </div>
          <div className="flex flex-col m-4">
            <Typography variant="subtitle2">Liquidation Fee</Typography>
            <Typography variant="caption16">
              {BigNumber.from(liquidationFee).div(100) + "%"}
            </Typography>
          </div>
        </div>
        <div className="flex flex-col my-2 md:m-2">
          <div className="flex flex-col m-4">
            <Typography variant="subtitle2">Max Utilization Rate</Typography>
            <Typography variant="caption16">
              {BigNumber.from(maximumUtilizationRate).div(100) + "%"}
            </Typography>
          </div>
          <div className="flex flex-col m-4">
            <Typography variant="subtitle2">TVL Safeguard</Typography>
            <Typography variant="caption16">
              {formatUnits(tvlSafeguard, 18) + " ETH"}
            </Typography>
          </div>
        </div>
      </div>
      <div className="flex flex-row items-center justify-center mt-8 mb-2 mx-2 md:mx-8">
        <Input
          width="100%"
          label="Collection Address"
          type="text"
          onChange={handleCollectionChange}
        />
      </div>
      {collectionFloorPrice && (
        <div className="flex flex-row items-center text-center justify-center">
          <Typography variant="caption12">
            {collectionFloorPrice == "0"
              ? "Collection appraisal is not available"
              : "Collection Appraisal available! Floor Price @ " +
                formatUnits(collectionFloorPrice, 18) +
                " ETH"}
          </Typography>
        </div>
      )}
      <div className="flex flex-row items-center justify-center my-8 mx-2 md:mx-8">
        <FormControl fullWidth>
          <InputLabel>Asset</InputLabel>
          <Select
            value={asset}
            label="Asset"
            onChange={handleAssetChange}
            className="rounded-2xl"
          >
            <MenuItem value={"0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6"}>
              Ethereum (ETH)
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
          disabled={
            !collectionFloorPrice || collectionFloorPrice == "0" || !asset
          }
          loadingText=""
          isLoading={creatingLoading}
          onClick={async function () {
            try {
              setCreatingLoading(true);
              const tx = await lendingMarketContractSigner.createLendingPool(
                collection,
                asset
              );
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

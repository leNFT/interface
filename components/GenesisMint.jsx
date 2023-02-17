import { formatUnits } from "@ethersproject/units";
import { useNotification, Button, Typography, Input } from "@web3uikit/core";
import styles from "../styles/Home.module.css";
import genesisNFTURIs from "../genesisNFTURIs.json";
import contractAddresses from "../contractAddresses.json";
import {
  useAccount,
  useNetwork,
  useContract,
  useBalance,
  useProvider,
  useSigner,
} from "wagmi";
import { useState, useEffect } from "react";
import Slider from "@mui/material/Slider";
import genesisNFTContract from "../contracts/GenesisNFT.json";
import votingEscrowContract from "../contracts/VotingEscrow.json";
import { BigNumber } from "@ethersproject/bignumber";

export default function GenesisMint(props) {
  const SECONDS_IN_DAY = 86400;
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const provider = useProvider();
  const { data: ethBalance } = useBalance({
    addressOrName: address,
  });
  const [amount, setAmount] = useState(1);
  const { data: signer } = useSigner();
  const [mintingLoading, setMintingLoading] = useState(false);
  const [rewards, setRewards] = useState("0");
  const [lockedRewards, setLockedRewards] = useState("0");
  const [locktimeDays, setLocktimeDays] = useState(14);
  const [sliderValue, setSliderValue] = useState(14);
  const [mintIds, setMintIds] = useState([]);
  const [mintPrice, setMintPrice] = useState("0");

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

  const votingEscrowProvider = useContract({
    contractInterface: votingEscrowContract.abi,
    addressOrName: addresses.VotingEscrow,
    signerOrProvider: provider,
  });

  const genesisNFTSigner = useContract({
    contractInterface: genesisNFTContract.abi,
    addressOrName: addresses.GenesisNFT,
    signerOrProvider: signer,
  });

  async function updateMintInfo() {
    const updatedRewards = await genesisNFTProvider.getNativeTokenReward(
      amount,
      locktimeDays * SECONDS_IN_DAY
    );
    setRewards(updatedRewards.toString());

    const updateLockedRewards = await votingEscrowProvider.simulateLock(
      updatedRewards.toString(),
      Math.floor(Date.now() / 1000) + locktimeDays * SECONDS_IN_DAY
    );
    console.log("updateLockedRewards: ", updateLockedRewards.toString());
    console.log("updatedRewards: ", updatedRewards.toString());
    console.log(
      "locktimeDays: ",
      Math.floor(Date.now() / 1000) + locktimeDays * SECONDS_IN_DAY
    );
    setLockedRewards(updateLockedRewards.toString());
  }

  useEffect(() => {
    if (props.price) {
      setMintPrice(props.price);
    }
  }, [props.price]);

  useEffect(() => {
    if (props.mintCount != undefined) {
      setMintIds([props.mintCount + 1]);
    }
  }, [props.mintCount]);

  useEffect(() => {
    updateMintInfo();
  }, [locktimeDays, amount]);

  useEffect(() => {
    if (isConnected) {
      updateMintInfo();
    }
  }, [isConnected]);

  const handleMintingSuccess = async function () {
    console.log("Minted");
    // Reset fields
    setLocktimeDays(14);
    props.setVisibility(false);
    props.updateUI();
    dispatch({
      type: "success",
      message: "You have minted your Genesis NFT.",
      title: "Mint Successful!",
      position: "bottomL",
    });
  };

  function handleSliderCommitedChange(_, newValue) {
    console.log("locktimeDays: ", newValue);
    setLocktimeDays(newValue);
  }

  function handleSliderChange(_, newValue) {
    console.log("locktimeDays: ", newValue);
    setSliderValue(newValue);
  }

  const handleAmountChange = (event) => {
    if (event.target.value == "") {
      setMintIds([]);
      setMintPrice("0");
      return;
    }

    var updatedAmount;
    if (props.mintCount + parseInt(event.target.value) > 9999) {
      updatedAmount = 9999 - props.mintCount;
    } else {
      updatedAmount = event.target.value;
    }

    var updatedMintIds = [];
    for (var i = 0; i < updatedAmount; i++) {
      updatedMintIds[i] = props.mintCount + i + 1;
    }

    setMintIds(updatedMintIds);
    setMintPrice(BigNumber.from(props.price).mul(updatedAmount).toString());
    setAmount(updatedAmount);
  };

  return (
    <div className="flex flex-col w-full items-center">
      <div className="flex flex-col lg:flex-row items-center justify-center m-4 text-center">
        <div className="flex flex-col m-2 lg:mx-8">
          <Typography variant="subtitle2">Price</Typography>
          <Typography variant="body16">
            {formatUnits(mintPrice, 18) + " ETH"}
          </Typography>
        </div>
        <div className="flex flex-col m-2 lg:mx-8">
          <Typography variant="subtitle2">Token ID</Typography>
          <Typography variant="body16">
            {amount < 4
              ? mintIds.toString()
              : mintIds.slice(0, 2) + "..." + mintIds.slice(-1)}
          </Typography>
        </div>
      </div>
      <div className="flex flex-col items-center w-full justify-center m-4 mb-8">
        <Input
          label="Genesis NFTs to mint"
          type="number"
          value={amount}
          placeholder="0"
          step="any"
          description=""
          validation={{
            numberMin: 0,
          }}
          onChange={handleAmountChange}
        />
      </div>
      <div className="flex flex-col p-2 border-4 rounded-3xl w-full md:w-8/12">
        <div className="flex flex-col md:flex-row items-center justify-center mt-2 text-center">
          <div className="flex flex-col m-2 md:m-4">
            <Typography variant="subtitle2">Lock Time</Typography>
            <Typography variant="body16">{locktimeDays + " days"}</Typography>
          </div>
          <div className="flex flex-col m-2 md:m-4">
            <Typography variant="subtitle2">LE Rewards</Typography>
            <Typography variant="body16">
              {formatUnits(rewards, 18) +
                " LE -> " +
                Number(formatUnits(lockedRewards, 18)).toPrecision(4) +
                " veLE"}
            </Typography>
          </div>
        </div>
        <div className="flex flex-row items-center justify-center p-4">
          <Slider
            value={sliderValue}
            valueLabelDisplay="auto"
            onChangeCommitted={handleSliderCommitedChange}
            onChange={handleSliderChange}
            min={14}
            step={1}
            max={120}
          />
        </div>
      </div>
      <div className="flex flex-row items-center justify-center m-8 px-8 w-full">
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
            if (ethBalance.value.lt(props.price)) {
              dispatch({
                type: "error",
                message: "Insufficient balance.",
                title: "Error",
                position: "bottomL",
              });
              return;
            }
            try {
              setMintingLoading(true);
              console.log("Minting...");
              console.log("mintPrice: ", mintPrice);
              const tx = await genesisNFTSigner.mint(
                locktimeDays * SECONDS_IN_DAY,
                mintIds.map((id) => genesisNFTURIs[id]),
                { value: mintPrice }
              );
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

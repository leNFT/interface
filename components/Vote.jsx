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
import gaugeControllerContract from "../contracts/GaugeController.json";
import { useState, useEffect } from "react";

export default function Vote(props) {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const provider = useProvider();
  const { data: signer } = useSigner();
  const [amount, setAmount] = useState("0");
  const [votingLoading, setVotingLoading] = useState(false);
  const [gaugeVotingPower, setGaugeVotingPower] = useState(0);

  const addresses =
    chain && chain.id in contractAddresses
      ? contractAddresses[chain.id]
      : contractAddresses["1"];
  const dispatch = useNotification();

  const gaugeControllerProvider = useContract({
    contractInterface: gaugeControllerContract.abi,
    addressOrName: addresses.GaugeController,
    signerOrProvider: provider,
  });

  const gaugeControllerSigner = useContract({
    contractInterface: gaugeControllerContract.abi,
    addressOrName: addresses.GaugeController,
    signerOrProvider: provider,
  });

  async function getFreeVotingPower() {
    const updatedGaugeVotingPower =
      await gaugeControllerProvider.userGaugeVoteWeight(address, props.address);
    setGaugeVotingPower(BigNumber.from(updatedGaugeVotingPower.toNumber()));
  }

  useEffect(() => {
    if (isConnected) {
      getFreeVotingPower();
    }
  }, [isConnected]);

  const handleVoteSuccess = async function (amount) {
    console.log("Voted", amount);
    props.updateUI();
    props.updateGaugeDetails(props.address);
    props.setVisibility(false);
    dispatch({
      type: "success",
      message: "You have voted.",
      title: "Vote Successful!",
      position: "topR",
    });
  };

  function handleInputChange(e) {
    if (e.target.value != "") {
      setAmount(e.target.value * 100);
    } else {
      setAmount("0");
    }
  }

  return (
    <div className={styles.container}>
      <div className="flex flex-row items-center justify-center m-8">
        <div className="flex flex-col">
          <Typography variant="subtitle2">My Gauge Voting Power</Typography>
          <Typography variant="body16">{gaugeVotingPower / 100} %</Typography>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center m-8 mt-12">
        <div className="flex flex-col max-w-[250px]">
          <Input
            label="Amount (%)"
            placeholder="0"
            type="number"
            step="any"
            validation={{
              numberMax: Number(formatUnits(0, 18)),
              numberMin: 0,
            }}
            onChange={handleInputChange}
          />
        </div>
        <div className="m-4">
          <Button
            text="Vote"
            theme="secondary"
            isFullWidth
            loadingProps={{
              spinnerColor: "#000000",
              spinnerType: "loader",
              direction: "right",
              size: "24",
            }}
            loadingText=""
            isLoading={votingLoading}
            onClick={async function () {
              try {
                setVotingLoading(true);
                const tx = await gaugeControllerSigner.vote(
                  props.address,
                  amount
                );
                await tx.wait(1);
                await handleVoteSuccess(amount);
              } catch (error) {
                console.log(error);
              } finally {
                setVotingLoading(false);
              }
            }}
          ></Button>
        </div>
      </div>
    </div>
  );
}

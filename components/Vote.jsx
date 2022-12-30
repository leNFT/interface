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

export default function Vote(props) {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const provider = useProvider();
  const { data: signer } = useSigner();
  const [amount, setAmount] = useState("0");
  const [votesBoost, setVotesBoost] = useState("0");
  const [votingLoading, setVotingLoading] = useState(false);

  const addresses =
    chain && chain.id in contractAddresses
      ? contractAddresses[chain.id]
      : contractAddresses["1"];
  const dispatch = useNotification();

  async function updateVotesBoost(votes) {
    const updatedVotesBoost = await nativeTokenVaultProvider.calculateLTVBoost(
      address,
      props.address,
      votes
    );

    console.log("Updated Votes Boost Amount:", updatedVotesBoost);
    setVotesBoost(updatedVotesBoost);
  }

  useEffect(() => {
    if (isConnected) {
    }
  }, [isConnected]);

  const handleVoteSuccess = async function (amount) {
    console.log("Voted", amount);
    props.updateUI();
    props.updateCollectionDetails(props.address);
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
      setAmount(parseUnits(e.target.value, 18).toString());
      updateVotesBoost(parseUnits(e.target.value, 18).toString());
    } else {
      setAmount("0");
    }
  }

  return (
    <div className={styles.container}>
      <div className="flex flex-row items-center justify-center m-4">
        <div className="flex flex-col">
          <Typography variant="subtitle2">Free Votes</Typography>
          <Typography variant="body16">{formatUnits(0, 18)} veLE</Typography>
        </div>
      </div>
      <div className="flex flex-row items-center justify-center mt-8 mb-2">
        <div className="flex flex-col max-w-[250px]">
          <Input
            label="Amount"
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
        <div className="flex flex-col m-4"> = </div>
        <div className="flex flex-col">
          <Typography variant="h6">
            {votesBoost / 100 + "% TVL Boost"}
          </Typography>
        </div>
      </div>
      <div className="flex flex-row items-center text-center justify-center my-8">
        <Typography variant="caption14">
          Votes can only be removed after all loans in collection are repaid.
        </Typography>
      </div>
      <div className="flex flex-row items-center justify-center m-8">
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
            if (BigNumber.from(amount).lte(BigNumber.from(props.freeVotes))) {
              try {
                setVotingLoading(true);
                const tx = await nativeTokenVaultSigner.vote(
                  amount,
                  props.address
                );
                await tx.wait(1);
                await handleVoteSuccess(amount);
              } catch (error) {
                console.log(error);
              } finally {
                setVotingLoading(false);
              }
            } else {
              dispatch({
                type: "error",
                message: "Amount is bigger than balance",
                title: "Error",
                position: "topR",
              });
            }
          }}
        ></Button>
      </div>
    </div>
  );
}

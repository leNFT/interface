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
import nativeTokenVaultContract from "../contracts/NativeTokenVault.json";

export default function Vote(props) {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const provider = useProvider();
  const { data: signer } = useSigner();
  const [freeVotes, setFreeVotes] = useState("0");
  const [amount, setAmount] = useState("0");
  const [votingLoading, setVotingLoading] = useState(false);

  const addresses =
    chain && chain.id in contractAddresses
      ? contractAddresses[chain.id]
      : contractAddresses["1"];
  const dispatch = useNotification();

  const nativeTokenVaultSigner = useContract({
    contractInterface: nativeTokenVaultContract.abi,
    addressOrName: addresses.NativeTokenVault,
    signerOrProvider: signer,
  });

  const nativeTokenVaultProvider = useContract({
    contractInterface: nativeTokenVaultContract.abi,
    addressOrName: addresses.NativeTokenVault,
    signerOrProvider: provider,
  });

  async function updateFreeVotes() {
    const updatedFreeVotes = await nativeTokenVaultProvider.getUserFreeVotes(
      address
    );
    console.log("Updated Free Votes:", updatedFreeVotes);
    setFreeVotes(updatedFreeVotes.toString());
  }

  useEffect(() => {
    if (isConnected) {
      updateFreeVotes();
    }
  }, [isConnected]);

  const handleVoteSuccess = async function (amount) {
    console.log("Voted", amount);
    props.updateUI();
    props.setVisibility(false);
    updateFreeVotes();
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
    } else {
      setAmount("0");
    }
  }

  return (
    <div className={styles.container}>
      <div className="flex flex-row items-center justify-center m-4">
        <div className="flex flex-col">
          <Typography variant="subtitle2">Free Votes</Typography>
          <Typography variant="body16">
            {formatUnits(freeVotes, 18)} veLE
          </Typography>
        </div>
      </div>
      <div className="flex flex-row items-center justify-center mt-8 mb-2">
        <Input
          label="Amount"
          type="number"
          step="any"
          validation={{
            numberMax: Number(formatUnits(freeVotes, 18)),
            numberMin: 0,
          }}
          onChange={handleInputChange}
        />
      </div>
      <div className="flex flex-row items-center text-center justify-center mb-8">
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
            if (BigNumber.from(amount).lte(BigNumber.from(freeVotes))) {
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

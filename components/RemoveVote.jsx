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

export default function RemoveVote(props) {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const provider = useProvider();
  const { data: signer } = useSigner();
  const [amount, setAmount] = useState("0");
  const [removeVotingLoading, setRemoveVotingLoading] = useState(false);

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

  //Run once
  useEffect(() => {
    if (isConnected) {
    }
  }, [isConnected]);

  function handleInputChange(e) {
    if (e.target.value != "") {
      setAmount(parseUnits(e.target.value, 18).toString());
    } else {
      setAmount("0");
    }
  }

  const handleRemoveVoteSuccess = async function () {
    props.updateUI();
    props.updateCollectionDetails(props.address);
    props.setVisibility(false);
    dispatch({
      type: "success",
      message: "You can now vote for other collection.",
      title: "Vote Removal Successful!",
      position: "topR",
    });
  };

  return (
    <div className={styles.container}>
      <div className="flex flex-row items-center justify-center">
        <div className="flex flex-col">
          <Typography variant="subtitle2">Maximum removable votes</Typography>
          <Typography variant="body16">
            {formatUnits(props.collectionVotes, 18)} veLE
          </Typography>
        </div>
      </div>
      <div className="flex flex-row items-center justify-center mt-8 mb-2">
        <Input
          label="Amount"
          type="number"
          step="any"
          validation={{
            numberMax: Number(formatUnits(props.collectionVotes, 18)),
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
      <div className="m-8 mt-2">
        <Button
          text="Remove Votes"
          theme="secondary"
          isFullWidth
          loadingProps={{
            spinnerColor: "#000000",
            spinnerType: "loader",
            direction: "right",
            size: "24",
          }}
          loadingText=""
          isLoading={removeVotingLoading}
          onClick={async function () {
            if (
              BigNumber.from(amount).lte(BigNumber.from(props.collectionVotes))
            ) {
              try {
                setRemoveVotingLoading(true);
                const tx = await nativeTokenVaultSigner.removeVote(
                  amount,
                  props.address
                );
                await tx.wait(1);
                handleRemoveVoteSuccess();
              } catch (error) {
                console.log(error);
              } finally {
                setRemoveVotingLoading(false);
              }
            } else {
              dispatch({
                type: "error",
                message: "Amount is bigger than used votes",
                title: "Error",
                position: "topR",
              });
            }
          }}
        />
      </div>
    </div>
  );
}

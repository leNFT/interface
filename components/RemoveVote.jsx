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

export default function RemoveVote(props) {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const provider = useProvider();
  const { data: signer } = useSigner();
  const [amount, setAmount] = useState("0");
  const [removeVotingLoading, setRemoveVotingLoading] = useState(false);
  const [maxAmount, setMaxAmount] = useState("0");

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

  const { runContractFunction: removeVote } = useWeb3Contract({
    abi: nativeTokenVaultContract.abi,
    contractAddress: addresses.NativeTokenVault,
    functionName: "removeVote",
    params: {
      amount: amount,
      collection: props.address,
    },
  });

  const { runContractFunction: getFreeVotes } = useWeb3Contract({
    abi: nativeTokenVaultContract.abi,
    contractAddress: addresses.NativeTokenVault,
    functionName: "getUserFreeVotes",
    params: {
      user: account,
    },
  });

  async function updateMaxAmount() {
    const voteTokenBalance = (
      await nativeTokenVaultProvider.balanceOf(address)
    ).toString();

    const freeVotes = (
      await nativeTokenVaultProvider.getUserFreeVotes(address)
    ).toString();

    const updatedMaxAmount = BigNumber.from(voteTokenBalance).sub(freeVotes);

    console.log("Updated Max Remove Votes:", updatedMaxAmount);
    setMaxAmount(updatedMaxAmount);
  }

  //Run once
  useEffect(() => {
    if (isConnected) {
      updateMaxAmount();
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
    props.setVisibility(false);
    dispatch({
      type: "success",
      message: "Please wait for transaction confirmation.",
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
            {formatUnits(maxAmount, 18)} veLE
          </Typography>
        </div>
      </div>
      <div className="flex flex-row items-center justify-center m-8">
        <Input
          labelBgColor="rgb(241, 242, 251)"
          label="Amount"
          type="number"
          step="any"
          validation={{
            numberMax: Number(formatUnits(maxAmount, 18)),
            numberMin: 0,
          }}
          onChange={handleInputChange}
        />
      </div>

      <div className="mt-16 mb-8">
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
            if (BigNumber.from(amount).lte(BigNumber.from(maxAmount))) {
              setRemoveVotingLoading(true);
              try {
                await nativeTokenVaultSigner.removeVote(amount, props.address);
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

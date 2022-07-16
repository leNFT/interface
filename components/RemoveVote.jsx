import { BigNumber } from "@ethersproject/bignumber";
import { formatUnits, parseUnits } from "@ethersproject/units";
import { useNotification, Button, Input, Typography } from "web3uikit";
import styles from "../styles/Home.module.css";
import contractAddresses from "../contractAddresses.json";
import { useWeb3Contract, useMoralis } from "react-moralis";
import { useState, useEffect } from "react";
import Link from "next/link";
import marketContract from "../contracts/Market.json";
import erc20 from "../contracts/erc20.json";
import nativeTokenVaultContract from "../contracts/NativeTokenVault.json";
import nativeTokenContract from "../contracts/NativeToken.json";

export default function RemoveVote(props) {
  const { isWeb3Enabled, chainId, account } = useMoralis();
  const [amount, setAmount] = useState("0");
  const [removeVotingLoading, setRemoveVotingLoading] = useState(false);
  const [maxAmount, setMaxAmount] = useState("0");

  const dispatch = useNotification();
  const addresses =
    chainId in contractAddresses
      ? contractAddresses[chainId]
      : contractAddresses["0x1"];

  const { runContractFunction: removeVote } = useWeb3Contract({
    abi: nativeTokenVaultContract.abi,
    contractAddress: addresses.NativeTokenVault,
    functionName: "vote",
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

  const { runContractFunction: getVoteTokenBalance } = useWeb3Contract({
    abi: nativeTokenVaultContract.abi,
    contractAddress: addresses.NativeTokenVault,
    functionName: "balanceOf",
    params: {
      account: account,
    },
  });

  async function updateMaxAmount() {
    const voteTokenBalance = (
      await getVoteTokenBalance({
        onError: (error) => console.log(error),
      })
    ).toString();

    const freeVotes = (
      await getFreeVotes({
        onError: (error) => console.log(error),
      })
    ).toString();

    const updatedMaxAmount = BigNumber.from(voteTokenBalance).sub(freeVotes);

    console.log("Updated Max Remove Votes:", updatedMaxAmount);
    setMaxAmount(updatedMaxAmount);
  }

  //Run once
  useEffect(() => {
    if (isWeb3Enabled) {
      updateMaxAmount();
    }
  }, [isWeb3Enabled]);

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
      type: "info",
      message:
        "Vote Remocal Successful!  Please wait for transaction confirmation.",
      title: "Notification",
      position: "topR",
      icon: "bell",
    });
  };

  return (
    <div className={styles.container}>
      <div className="flex flex-row items-center justify-center">
        <div className="flex flex-col">
          <Typography variant="h4">Maximum removable votes</Typography>
          <Typography variant="body16">
            {formatUnits(maxAmount, 18)} veLE
          </Typography>
        </div>
      </div>
      <div className="flex flex-row items-center justify-center m-8">
        <Input
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
          isFullWidth
          loadingProps={{
            spinnerColor: "#000000",
          }}
          loadingText="Confirming Vote Removal"
          isLoading={removeVotingLoading}
          onClick={async function () {
            if (BigNumber.from(amount).lte(BigNumber.from(maxAmount))) {
              setRemoveVotingLoading(true);
              await removeVote({
                onComplete: () => setRemoveVotingLoading(false),
                onSuccess: handleRemoveVoteSuccess,
                onError: (error) => console.log(error),
              });
            } else {
              dispatch({
                type: "info",
                message: "Amount is bigger than used votes",
                title: "Notification",
                position: "topR",
                icon: "bell",
              });
            }
          }}
        />
      </div>
    </div>
  );
}

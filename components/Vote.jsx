import { BigNumber } from "@ethersproject/bignumber";
import { formatUnits, parseUnits } from "@ethersproject/units";
import { useNotification, Button, Input, Typography } from "@web3uikit/core";
import styles from "../styles/Home.module.css";
import contractAddresses from "../contractAddresses.json";
import { useWeb3Contract, useMoralis } from "react-moralis";
import { useState, useEffect } from "react";
import nativeTokenVaultContract from "../contracts/NativeTokenVault.json";

export default function Vote(props) {
  const { isWeb3Enabled, chainId, account } = useMoralis();
  const [freeVotes, setFreeVotes] = useState("0");
  const [amount, setAmount] = useState("0");
  const [votingLoading, setVotingLoading] = useState(false);

  const dispatch = useNotification();
  const addresses =
    chainId in contractAddresses
      ? contractAddresses[chainId]
      : contractAddresses["0x1"];

  const { runContractFunction: vote } = useWeb3Contract({
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

  async function updateFreeVotes() {
    const updatedFreeVotes = await getFreeVotes({
      onError: (error) => console.log(error),
    });
    console.log("Updated Free Votes:", updatedFreeVotes);
    setFreeVotes(updatedFreeVotes.toString());
  }

  useEffect(() => {
    if (isWeb3Enabled) {
      updateFreeVotes();
    }
  }, [isWeb3Enabled]);

  const handleVoteSuccess = async function () {
    console.log("Voted", amount);
    props.setVisibility(false);
    updateFreeVotes();
    dispatch({
      type: "success",
      message: "Please wait for transaction confirmation.",
      title: "Deposit Successful!",
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
      <div className="flex flex-row items-center justify-center">
        <div className="flex flex-col">
          <Typography variant="subtitle2">Free Votes</Typography>
          <Typography variant="body16">
            {formatUnits(freeVotes, 18)} LE
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
            numberMax: Number(formatUnits(freeVotes, 18)),
            numberMin: 0,
          }}
          onChange={handleInputChange}
        />
      </div>
      <div className="flex flex-row items-center justify-center mt-16 mb-8">
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
              setVotingLoading(true);
              await vote({
                onComplete: () => setVotingLoading(false),
                onSuccess: handleVoteSuccess,
                onError: (error) => console.log(error),
              });
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

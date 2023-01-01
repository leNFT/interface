import { BigNumber } from "@ethersproject/bignumber";
import styles from "../styles/Home.module.css";
import { useNotification, Button, Input, Typography } from "@web3uikit/core";
import { formatUnits, parseUnits } from "@ethersproject/units";
import contractAddresses from "../contractAddresses.json";
import {
  useAccount,
  useNetwork,
  useContract,
  useProvider,
  useSigner,
} from "wagmi";
import { useState, useEffect } from "react";
import votingEscrowContract from "../contracts/VotingEscrow.json";

export default function WithdrawNativeToken(props) {
  const ONE_DAY = 86400;

  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const [unlockTime, setUnlockTime] = useState(0);
  const provider = useProvider();
  const { data: signer } = useSigner();
  const [unlockLoading, setUnlockLoading] = useState(false);

  const addresses =
    chain && chain.id in contractAddresses
      ? contractAddresses[chain.id]
      : contractAddresses["1"];
  const dispatch = useNotification();

  const votingEscrowProvider = useContract({
    contractInterface: votingEscrowContract.abi,
    addressOrName: addresses.VotingEscrow,
    signerOrProvider: provider,
  });

  const votingEscrowSigner = useContract({
    contractInterface: votingEscrowContract.abi,
    addressOrName: addresses.VotingEscrow,
    signerOrProvider: signer,
  });

  async function getUnlockTime() {
    const updatedUnlockTime = await votingEscrowProvider.locked(address);
    console.log(
      "updatedUnlockTime:",
      BigNumber.from(updatedUnlockTime.end).toNumber()
    );
    setUnlockTime(BigNumber.from(updatedUnlockTime.end).toNumber());
  }

  useEffect(() => {
    if (isConnected) {
      getUnlockTime();
    }
  }, [isConnected]);

  const handleUnlockSuccess = async function () {
    props.updateUI();
    props.setVisibility(false);
    dispatch({
      type: "success",
      message: "Please wait for transaction confirmation.",
      title: "Withdrawal Successful!",
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
    <div>
      {unlockTime > Date.now() / 1000 ? (
        <div className="flex flex-col items-center m-8">
          <Typography variant="subtitle2">
            Locked until {new Date(unlockTime * 1000).toLocaleString()}
          </Typography>
        </div>
      ) : (
        <div className="m-8">
          <Button
            text="UNLOCK"
            theme="secondary"
            isFullWidth
            loadingProps={{
              spinnerColor: "#000000",
              spinnerType: "loader",
              direction: "right",
              size: "24",
            }}
            loadingText=""
            isLoading={unlockLoading}
            onClick={async function () {
              try {
                setUnlockLoading(true);
                const tx = await votingEscrowSigner.withdraw();
                await tx.wait(1);
                handleUnlockSuccess();
              } catch (error) {
                console.log(error);
              } finally {
                setUnlockLoading(false);
              }
            }}
          />
        </div>
      )}
    </div>
  );
}

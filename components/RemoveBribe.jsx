import { BigNumber } from "@ethersproject/bignumber";
import {
  useAccount,
  useNetwork,
  useContract,
  useProvider,
  useSigner,
} from "wagmi";
import { formatUnits, parseUnits } from "@ethersproject/units";
import styles from "../styles/Home.module.css";
import {
  useNotification,
  Button,
  Input,
  Typography,
  DatePicker,
} from "@web3uikit/core";
import Slider from "@mui/material/Slider";
import { ethers } from "ethers";
import contractAddresses from "../contractAddresses.json";
import { useState, useEffect } from "react";
import bribesContract from "../contracts/Bribes.json";
import Box from "@mui/material/Box";

export default function RemoveBribe(props) {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const provider = useProvider();
  const [removeBribeLoading, setRemoveBribeLoading] = useState(false);
  const { data: signer } = useSigner();
  const [amount, setAmount] = useState("0");

  const dispatch = useNotification();
  var addresses = contractAddresses["11155111"];

  const bribesSigner = useContract({
    contractInterface: bribesContract.abi,
    addressOrName: addresses.Bribes,
    signerOrProvider: signer,
  });

  const handleRemoveBribe = async () => {
    if (!amount) {
      dispatch({
        type: "error",
        message: "Please enter an amount to remove.",
        title: "No Amount",
        position: "bottomL",
      });
      return;
    }
    try {
      setRemoveBribeLoading(true);
      const tx = await bribesSigner.withdrawBribe(
        address,
        addresses.ETH.address,
        props.gauge,
        parseUnits(amount, 18)
      );
      await tx.wait(1);
      props.setVisibility(false);
      dispatch({
        type: "success",
        message: "Bribe sent successfully!",
        title: "Bribe Sent",
        position: "bottomL",
      });
    } catch (error) {
      console.error("Error while sending bribe: ", error);
      dispatch({
        type: "error",
        message: "Error while sending bribe.",
        title: "Error",
        position: "bottomL",
      });
    } finally {
      setRemoveBribeLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      addresses = contractAddresses[chain.id];
    }
  }, [isConnected]);

  return (
    <div className={styles.container}>
      <div className="flex flex-col items-center justify-center m-4 text-center">
        <div className="mb-8">
          <Typography variant="h4">Gauge: {props.gauge}</Typography>
        </div>
        <div className="m-4">
          <Typography variant="h6">
            Deposited: {props.gaugeBribes} ETH
          </Typography>
        </div>
        <div className="m-4">
          <Input
            label="Bribe Amount (ETH)"
            type="number"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="w-full m-4">
          <Button
            theme="secondary"
            isLoading={removeBribeLoading}
            isFullWidth
            onClick={handleRemoveBribe}
            text="Remove Bribe"
          />
        </div>
      </div>
    </div>
  );
}

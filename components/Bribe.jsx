import { BigNumber } from "@ethersproject/bignumber";
import {
  useAccount,
  useNetwork,
  useContract,
  useProvider,
  useSigner,
} from "wagmi";
import { formatUnits, parseUnits } from "@ethersproject/units";
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
import wethGatewayContract from "../contracts/WETHGateway.json";
import Box from "@mui/material/Box";

export default function Bribe(props) {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const provider = useProvider();
  const { data: signer } = useSigner();
  const [amount, setAmount] = useState("0");

  const dispatch = useNotification();
  var addresses = contractAddresses["11155111"];

  const wethGatewaySigner = useContract({
    contractInterface: wethGatewayContract.abi,
    addressOrName: addresses.WETHGateway,
    signerOrProvider: signer,
  });

  const handleBribe = async () => {
    if (!amount) {
      dispatch({
        type: "error",
        message: "Please enter an amount to bribe.",
        title: "No Amount",
        position: "bottomL",
      });
      return;
    }
    try {
      const tx = await wethGatewaySigner.bribe(props.gauge, amount);
      await tx.wait();
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
    }
  };

  useEffect(() => {
    if (isConnected) {
      addresses = contractAddresses[chain.id];
    }
  }, [isConnected]);

  return (
    <div>
      <Typography variant="h4">Gauge: {props.gauge}</Typography>
      <Input
        label="Bribe Amount"
        type="number"
        step="any"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <Button onClick={handleBribe} text="Bribe" />
    </div>
  );
}

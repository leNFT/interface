import { useState, useEffect } from "react";
import { useAccount, useNetwork, useContract, useProvider } from "wagmi";

export default function Lend() {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();

  const provider = useProvider();
  const addresses =
    chain && chain.id in contractAddresses
      ? contractAddresses[chain.id]
      : contractAddresses["1"];

  return <div></div>;
}

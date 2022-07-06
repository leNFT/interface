import AutoConnectButton from "./AutoConnectButton";
import { useWeb3Contract, useMoralis } from "react-moralis";
import { useState, useEffect } from "react";
import contractAddresses from "../contractAddresses.json";
import marketContract from "../contracts/Market.json";
import reserveContract from "../contracts/Reserve.json";
import { Button } from "web3uikit";

export default function Header() {
  const [borrowRate, setBorrowRate] = useState(0);
  const [reserveAddress, setReserveAddress] = useState("");
  const { isWeb3Enabled, chainId } = useMoralis();
  const addresses =
    chainId in contractAddresses
      ? contractAddresses[chainId]
      : contractAddresses["0x1"];

  const { runContractFunction: getReserveAddress } = useWeb3Contract({
    abi: marketContract.abi,
    contractAddress: addresses.Market,
    functionName: "getReserveAddress",
    params: {
      asset: addresses.WETH,
    },
  });

  const { runContractFunction: getBorrowRate } = useWeb3Contract({
    abi: reserveContract.abi,
    contractAddress: reserveAddress,
    functionName: "getBorrowRate",
    params: {},
  });

  async function getReserve() {
    const updatedReserveAddress = (
      await getReserveAddress({
        onError: (error) => console.log(error),
      })
    ).toString();
    setReserveAddress(updatedReserveAddress);
    console.log("updatedReserveAddress", updatedReserveAddress);
  }

  async function updateUI() {
    const updatedBorrowRate = (await getBorrowRate()).toNumber();
    console.log("New updated borrowRate:", borrowRate);
    setBorrowRate(updatedBorrowRate);
  }

  useEffect(() => {
    if (isWeb3Enabled) {
      getReserve();
    }
  }, [isWeb3Enabled]);

  // Set the rest of the UI when we receive the reserve address
  useEffect(() => {
    if (reserveAddress) {
      console.log("Got reserve address, setting the rest...", reserveAddress);
      updateUI();
    }
  }, [reserveAddress]);

  return (
    <nav className="p-5 border-b-2 flex flex-row justify-between items-center">
      <div className="flex flex-col items-center justify-content">
        <h1 className="py-4 px-4 font-bold text-3xl">leNFT</h1>
        <h1 className="font-bold text-xs">
          <div className="flex flex-row items-center">
            Borrow Rate @ {borrowRate / 100}%
          </div>
        </h1>
      </div>
      <div className="flex flex-row items-center">
        <div className="flex m-2">
          <Button
            id="test-button-outline"
            onClick={function noRefCheck() {}}
            text="Home"
            size="large"
            theme="outline"
            type="button"
          />
        </div>
        <div className="flex m-2">
          <Button
            color="green"
            id="test-button-colored-green"
            text="Suppl"
            size="large"
            theme="colored"
            type="button"
            onClick={function noRefCheck() {}}
          />
        </div>
        <div className="flex m-2">
          <AutoConnectButton />
        </div>
      </div>
    </nav>
  );
}

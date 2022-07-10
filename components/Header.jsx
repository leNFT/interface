import { useWeb3Contract, useMoralis } from "react-moralis";
import { useState, useEffect } from "react";
import contractAddresses from "../contractAddresses.json";
import marketContract from "../contracts/Market.json";
import reserveContract from "../contracts/Reserve.json";
import Link from "next/link";
import { ConnectButton, Button } from "web3uikit";

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
      asset: addresses.wETH,
    },
  });

  const { runContractFunction: getBorrowRate } = useWeb3Contract();

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
    const getBorrowRateOptions = {
      abi: reserveContract.abi,
      contractAddress: reserveAddress,
      functionName: "getBorrowRate",
      params: {},
    };

    const updatedBorrowRate = (
      await getBorrowRate({
        onError: (error) => console.log(error),
        params: getBorrowRateOptions,
      })
    ).toNumber();

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
    <div className="p-5 border-b-2 flex flex-row justify-between items-center">
      <div className="flex flex-col items-center justify-content">
        <Link href="/">
          <a target="_blank" rel="noopener noreferrer">
            <div className="p-5 flex flex-row justify-between items-center">
              <div className="flex flex-col items-center justify-content">
                <h1 className="font-bold text-2xl">leNFT</h1>
              </div>
              <div className="flex flex-col ml-1 items-center justify-content">
                <h1 className="text-2xl">.finance</h1>
              </div>
            </div>
          </a>
        </Link>
        <h1 className="font-bold text-xs">
          {isWeb3Enabled && (
            <div className="flex flex-row items-center">
              Borrow Rate @ {borrowRate / 100}%
            </div>
          )}
        </h1>
      </div>
      <div className="flex flex-row items-center">
        <div className="flex m-2">
          <Link href="/app">
            <Button text="Home" size="large" theme="outline"></Button>
          </Link>
        </div>
        <div className="flex m-2">
          <Link href="/activeLoans">
            <Button text="Active Loans" size="large" theme="outline"></Button>
          </Link>
        </div>
        <div className="flex m-2">
          <Link href="/supply">
            <Button
              color="green"
              text="Supply"
              size="large"
              theme="colored"
            ></Button>
          </Link>
        </div>
        <div className="flex m-2">
          <ConnectButton moralisAuth={false} />
        </div>
      </div>
    </div>
  );
}

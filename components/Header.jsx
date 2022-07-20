import { useWeb3Contract, useMoralis } from "react-moralis";
import { useState, useEffect } from "react";
import { formatUnits, parseUnits } from "@ethersproject/units";
import contractAddresses from "../contractAddresses.json";
import marketContract from "../contracts/Market.json";
import reserveContract from "../contracts/Reserve.json";
import tokenOracleContract from "../contracts/TokenOracle.json";
import Link from "next/link";
import { ConnectButton } from "web3uikit";
import { Button } from "grommet";

export default function Header() {
  const [borrowRate, setBorrowRate] = useState(0);
  const [nativeTokenPrice, setNativeTokenPrice] = useState(0);
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
      asset: addresses["WETH"].address,
    },
  });

  const { runContractFunction: getBorrowRate } = useWeb3Contract();
  const { runContractFunction: getNativeTokenPrice } = useWeb3Contract();

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

    console.log("New updated borrowRate:", updatedBorrowRate);
    setBorrowRate(updatedBorrowRate);

    const getNativeTokenPriceOptions = {
      abi: tokenOracleContract.abi,
      contractAddress: addresses.TokenOracle,
      functionName: "getTokenETHPrice",
      params: {
        tokenAddress: addresses.NativeToken,
      },
    };

    const updatedNativeTokenPrice = (
      await getNativeTokenPrice({
        onError: (error) => console.log(error),
        params: getNativeTokenPriceOptions,
      })
    ).toString();

    console.log("New LE price:", updatedNativeTokenPrice);
    setNativeTokenPrice(updatedNativeTokenPrice);
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
            <div className="mx-5 mt-5 mb-2 flex flex-row justify-between items-center">
              <div className="flex flex-col items-center justify-content">
                <h1 className="font-bold text-2xl">leNFT</h1>
              </div>
              <div className="flex flex-col ml-1 mb-4 items-center justify-content">
                <h1 className="text-2xl">.finance</h1>
              </div>
            </div>
          </a>
        </Link>
        <h1 className="font-bold text-xs">
          {isWeb3Enabled && (
            <div className="flex flex-col">
              <div className="flex flex-row items-center">
                Borrow Rate @ {borrowRate / 100}%
              </div>
              <div className="flex flex-row items-center">
                LE price @ {formatUnits(nativeTokenPrice, 18)} ETH
              </div>
            </div>
          )}
        </h1>
      </div>
      <div className="flex flex-col ml-12">
        <div className="flex flex-row">
          <div className="flex m-2">
            <Link href="/app">
              <Button size="medium" color="neutral-3" label="Home" />
            </Link>
          </div>
          <div className="flex m-2">
            <Link href="/collectionLoans">
              <Button
                size="medium"
                color="neutral-3"
                label="Collections' Loans"
              />
            </Link>
          </div>
          <div className="flex m-2">
            <Link href="/supply">
              <Button size="medium" color="neutral-3" label="Supply" />
            </Link>
          </div>
          <div className="flex m-2">
            <Link href="/stake">
              <Button size="medium" color="neutral-3" label="Stake" />
            </Link>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <ConnectButton moralisAuth={false} />
      </div>
    </div>
  );
}

import AutoConnectButton from "./AutoConnectButton";
import { useWeb3Contract, useMoralis } from "react-moralis";
import { useState, useEffect } from "react";
import contractAddresses from "../contractAddresses.json";
import loanCenterContract from "../contracts/LoanCenter.json";
import Link from "next/link";

export default function Header() {
  const [loansCount, setLoansCount] = useState(0);
  const { isWeb3Enabled, chainId } = useMoralis();
  const addresses =
    chainId in contractAddresses
      ? contractAddresses[chainId]
      : contractAddresses["0x1"];

  const { runContractFunction: getLoansCount } = useWeb3Contract({
    abi: loanCenterContract.abi,
    contractAddress: addresses.LoanCenter,
    functionName: "getLoansCount",
    params: {},
  });

  async function updateUI() {
    const updatedCount = (await getLoansCount()).toString();
    console.log("New updated count:", updatedCount);
    setLoansCount(updatedCount);
  }

  useEffect(() => {
    if (isWeb3Enabled) {
      console.log("chainId header", chainId);
      updateUI();
    }
  }, [isWeb3Enabled]);

  return (
    <nav className="p-5 border-b-2 flex flex-row justify-between items-center">
      <div className="flex flex-col items-center justify-content">
        <Link href="/">
          <a>
            <h1 className="py-4 px-4 font-bold text-3xl">leNFT</h1>
          </a>
        </Link>
        <h1 className="font-bold text-xs">
          <div className="flex flex-row items-center">
            Now with {loansCount} loans
          </div>
        </h1>
      </div>
      <div className="flex flex-row items-center">
        <Link href="/">
          {/* Home is going to be the recent listings page */}
          <a className="mr-4 p-6">Home</a>
        </Link>
        <Link href="/supply">
          <a className="mr-4 p-6">Supply</a>
        </Link>
        <AutoConnectButton />
      </div>
    </nav>
  );
}

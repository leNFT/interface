import AutoConnectButton from "./AutoConnectButton";
import { useWeb3Contract, useMoralis } from "react-moralis";
import { useState, useEffect } from "react";
import contractAddresses from "../contractAddresses.json";
import loanCenterContract from "../contracts/LoanCenter.json";
import Link from "next/link";
import { Button } from "web3uikit";

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
        <div className="flex m-2">
          <Link href="/">
            <Button
              id="test-button-outline"
              onClick={function noRefCheck() {}}
              text="Home"
              size="large"
              theme="outline"
              type="button"
            />
          </Link>
        </div>
        <div className="flex m-2">
          <Link href="/supply">
            <Button
              color="green"
              id="test-button-colored-green"
              onClick={function noRefCheck() {}}
              text="Supply"
              size="large"
              theme="colored"
              type="button"
            />
          </Link>
        </div>
        <div className="flex m-2">
          <AutoConnectButton />
        </div>
      </div>
    </nav>
  );
}

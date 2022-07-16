import styles from "../styles/Home.module.css";
import reserveContract from "../contracts/Reserve.json";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useMoralisWeb3Api, useMoralisWeb3ApiCall } from "react-moralis";

export default function Home() {
  const [borrowRate, setBorrowRate] = useState(0);
  const { native } = useMoralisWeb3Api();

  const options = {
    chain: "goerli",
    address: "0x9c837D4c3E7283C029Ce9F707A4831F0FEd3ba06",
    function_name: "getBorrowRate",
    abi: reserveContract.abi,
    params: {},
  };

  const { fetch, data, error, isLoading } = useMoralisWeb3ApiCall(
    native.runContractFunction,
    { ...options }
  );

  async function updateUI() {
    let updatedBorrowRate = await fetch();
    console.log("updatedBorrowRate", updatedBorrowRate);
    setBorrowRate(updatedBorrowRate);
  }

  useEffect(() => {
    updateUI();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.main}>
        <div className="flex flex-row">
          <div className="flex m-4">
            <a
              href="http://discord.gg/hWyBHrUDAk"
              target="_blank"
              rel="noopener noreferrer"
            >
              [discord
            </a>
          </div>
          <div className="flex m-4">
            <a
              href="https://twitter.com/lenftapp"
              target="_blank"
              rel="noopener noreferrer"
            >
              twitter
            </a>
          </div>
          <div className="flex m-4">
            <a
              href="https://github.com/leNFT"
              target="_blank"
              rel="noopener noreferrer"
            >
              github
            </a>
          </div>
          <div className="flex m-4">
            <a
              href="https://lenft.gitbook.io/lenft-docs/"
              target="_blank"
              rel="noopener noreferrer"
            >
              docs (soon™)]
            </a>
          </div>
        </div>
        <div className="flex flex-row mt-32">
          <Link href="/app">
            <a>
              <h1 className="font-bold text-3xl">go to app.</h1>
            </a>
          </Link>
        </div>
        <div className="flex flex-row mb-16">(goerli testnet)</div>
        <div className="flex flex-row m-16 max-w-lg">
          leNFT is a peer-to-pool NFT lending market. it allows you to get
          instant liquidity using your NFTs as collateral
        </div>
        <div className="flex flex-row m-16">
          current borrow rate is {borrowRate / 100} %
        </div>
      </div>
    </div>
  );
}

import { Button } from "@web3uikit/core";
import testNFTContract from "../contracts/test/TestNFT.json";
import styles from "../styles/Home.module.css";
import contractAddresses from "../contractAddresses.json";
import nativeTokenContract from "../contracts/NativeToken.json";
import { useState } from "react";
import { useWeb3Contract } from "react-moralis";
import { useAccount, useNetwork } from "wagmi";

export default function Test() {
  const [mintingLoading, setMintingLoading] = useState(false);
  const [nativeTokenLoading, setNativeTokenLoading] = useState(false);
  const { address } = useAccount();
  const { chain } = useNetwork();

  const addresses =
    chain && chain.id in contractAddresses
      ? contractAddresses[chain.id]
      : contractAddresses["0x1"];

  const { runContractFunction: mintNFT } = useWeb3Contract({
    abi: testNFTContract.abi,
    contractAddress: addresses.SupportedAssets[0].address,
    functionName: "mint",
    params: {
      owner: address,
    },
  });

  const { runContractFunction: mint10NativeToken } = useWeb3Contract({
    abi: nativeTokenContract.abi,
    contractAddress: addresses.NativeToken,
    functionName: "testMint",
    params: {
      account: address,
      amount: "10000000000000000000",
    },
  });
  return (
    <div className={styles.container}>
      <Button
        text="Mint Test NFT"
        isFullWidth
        isLoading={mintingLoading}
        loadingProps={{
          spinnerColor: "#000000",
        }}
        onClick={async function () {
          setMintingLoading(true);
          await mintNFT({
            onComplete: () => setMintingLoading(false),
            onError: (error) => console.log(error),
          });
        }}
      />
      <Button
        text="Mint 10 LE"
        isFullWidth
        isLoading={nativeTokenLoading}
        loadingProps={{
          spinnerColor: "#000000",
        }}
        onClick={async function () {
          setNativeTokenLoading(true);
          await mint10NativeToken({
            onComplete: () => setNativeTokenLoading(false),
            onError: (error) => console.log(error),
          });
        }}
      />
    </div>
  );
}

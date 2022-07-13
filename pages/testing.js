import { Button } from "web3uikit";
import testNFTContract from "../contracts/test/TestNFT.json";
import styles from "../styles/Home.module.css";
import contractAddresses from "../contractAddresses.json";
import { useState } from "react";
import { useWeb3Contract, useMoralis } from "react-moralis";

export default function Testing() {
  const [mintingLoading, setMintingLoading] = useState(false);
  const { chainId, account } = useMoralis();

  const addresses =
    chainId in contractAddresses
      ? contractAddresses[chainId]
      : contractAddresses["0x1"];

  const { runContractFunction: mintNFT } = useWeb3Contract({
    abi: testNFTContract.abi,
    contractAddress: addresses.SupportedAssets[0].address,
    functionName: "mint",
    params: {
      owner: account,
    },
  });

  const { runContractFunction: mintNFT2 } = useWeb3Contract({
    abi: testNFTContract.abi,
    contractAddress: addresses.SupportedAssets[1].address,
    functionName: "mint",
    params: {
      owner: account,
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
      ></Button>
      <Button
        text="Mint Test NFT2"
        isFullWidth
        isLoading={mintingLoading}
        loadingProps={{
          spinnerColor: "#000000",
        }}
        onClick={async function () {
          setMintingLoading(true);
          await mintNFT2({
            onComplete: () => setMintingLoading(false),
            onError: (error) => console.log(error),
          });
        }}
      ></Button>
    </div>
  );
}

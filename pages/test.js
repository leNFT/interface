import { Button } from "@web3uikit/core";
import testNFTContract from "../contracts/test/TestNFT.json";
import styles from "../styles/Home.module.css";
import contractAddresses from "../contractAddresses.json";
import nativeTokenContract from "../contracts/NativeToken.json";
import { useState } from "react";
import {
  useAccount,
  useNetwork,
  useContract,
  useProvider,
  useSigner,
} from "wagmi";
export default function Test() {
  const [mintingLoading, setMintingLoading] = useState(false);
  const [nativeTokenLoading, setNativeTokenLoading] = useState(false);
  const { address } = useAccount();
  const { chain } = useNetwork();
  const { data: signer } = useSigner();

  const addresses =
    chain && chain.id in contractAddresses
      ? contractAddresses[chain.id]
      : contractAddresses["1"];

  const testNFTSigner = useContract({
    contractInterface: testNFTContract.abi,
    addressOrName: addresses.SupportedAssets[0].address,
    signerOrProvider: signer,
  });

  const nativeTokenSigner = useContract({
    contractInterface: nativeTokenContract.abi,
    addressOrName: addresses.NativeToken,
    signerOrProvider: signer,
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
          try {
            setMintingLoading(true);
            await testNFTSigner.mint(address);
            setMintingLoading(false);
          } catch (error) {
            console.log(error);
          }
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
          try {
            setNativeTokenLoading(true);
            await nativeTokenSigner.testMint(address, "10000000000000000000");
            setNativeTokenLoading(false);
          } catch (error) {
            console.log(error);
          }
        }}
      />
    </div>
  );
}

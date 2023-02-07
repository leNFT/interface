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
  const { address, isConnected } = useAccount();
  const [mintingLoading, setMintingLoading] = useState(false);
  const [nativeTokenLoading, setNativeTokenLoading] = useState(false);

  const { chain } = useNetwork();
  const { data: signer } = useSigner();
  const testNFTAddress = "0x0171dB1e3Cc005d2A6E0BA531509D007a5B8C1a8";

  const addresses =
    isConnected && chain.id in contractAddresses
      ? contractAddresses[chain.id]
      : contractAddresses["5"];

  const testNFTSigner = useContract({
    contractInterface: testNFTContract.abi,
    addressOrName: testNFTAddress,
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
            const tx = await testNFTSigner.mint(address);
            await tx.wait(1);
          } catch (error) {
            console.log(error);
          } finally {
            setMintingLoading(false);
          }
        }}
      />
      <Button
        text="Mint 10,000 LE"
        isFullWidth
        isLoading={nativeTokenLoading}
        loadingProps={{
          spinnerColor: "#000000",
        }}
        onClick={async function () {
          try {
            setNativeTokenLoading(true);
            const tx = await nativeTokenSigner.mint(
              address,
              "10000000000000000000000"
            );
            await tx.wait(1);
          } catch (error) {
            console.log(error);
          } finally {
            setNativeTokenLoading(false);
          }
        }}
      />
    </div>
  );
}

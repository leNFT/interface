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
  const [rewardsLoading, setRewardsLoading] = useState(false);
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
      <Button
        text="Distribute Rewards"
        isFullWidth
        isLoading={rewardsLoading}
        loadingProps={{
          spinnerColor: "#000000",
        }}
        onClick={async function () {
          try {
            setRewardsLoading(true);
            const tx = await nativeTokenSigner.distributeRewards();
            await tx.wait(1);
          } catch (error) {
            console.log(error);
          } finally {
            setRewardsLoading(false);
          }
        }}
      />
    </div>
  );
}

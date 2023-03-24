import { Button } from "@web3uikit/core";
import testNFTContract from "../contracts/test/TestNFT.json";
import styles from "../styles/Home.module.css";
import contractAddresses from "../contractAddresses.json";
import nativeTokenContract from "../contracts/NativeToken.json";
import { useNotification } from "@web3uikit/core";
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
  const dispatch = useNotification();

  const { chain } = useNetwork();
  const { data: signer } = useSigner();
  const testNFTAddress = "0xa7540Eb784A17B9D704330B13F61E07D757010c2";

  var addresses = contractAddresses["11155111"];

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

  const handleMintTestNFTSuccess = async function () {
    dispatch({
      type: "success",
      message: "You minted the Test NFT.",
      title: "Mint Successful!",
      position: "bottomL",
    });
  };

  const handleMintTokenSuccess = async function () {
    dispatch({
      type: "success",
      message: "You minted 10,000 LE.",
      title: "Mint Successful!",
      position: "bottomL",
    });
  };

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
            handleMintTestNFTSuccess();
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
            handleMintTokenSuccess();
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

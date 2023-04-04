import { Button } from "@web3uikit/core";
import testNFTContract from "../contracts/test/TestNFT.json";
import styles from "../styles/Home.module.css";
import contractAddresses from "../contractAddresses.json";
import nativeTokenContract from "../contracts/NativeToken.json";
import { useNotification } from "@web3uikit/core";
import { useState } from "react";
import Link from "@mui/material/Link";
import { Box } from "@mui/material";
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
  const [minting2Loading, setMinting2Loading] = useState(false);
  const [nativeTokenLoading, setNativeTokenLoading] = useState(false);
  const dispatch = useNotification();

  const { chain } = useNetwork();
  const { data: signer } = useSigner();
  const testNFTAddress = "0xa7540Eb784A17B9D704330B13F61E07D757010c2";
  const testNFT2Address = "0x8e06B6b9d28C3dc3a296099525Bf58F0B3F2c0DD";

  var addresses = contractAddresses["11155111"];

  const testNFTSigner = useContract({
    contractInterface: testNFTContract.abi,
    addressOrName: testNFTAddress,
    signerOrProvider: signer,
  });

  const testNFT2Signer = useContract({
    contractInterface: testNFTContract.abi,
    addressOrName: testNFT2Address,
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

  const handleMintTestNFT2Success = async function () {
    dispatch({
      type: "success",
      message: "You minted the Test NFT 2.",
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
      <div className="flex flex-col justify-center text-center">
        <Box
          sx={{
            fontFamily: "Monospace",
            fontSize: "subtitle1.fontSize",
          }}
          className="mb-4"
        >
          Testing Guide:
        </Box>
        <Box
          sx={{
            fontFamily: "Monospace",
            fontSize: "caption.fontSize",
          }}
          className="mb-10"
        >
          <ol className="space-y-2 text-start">
            <li>- Mint some Test NFTs</li>
            <li>
              - Ask for some Sepolia LE tokens in our{" "}
              <Link
                href="https://discord.gg/B62BgWmGQT"
                underline="none"
                target="_blank"
                color={"blue"}
              >
                {"discord"}
              </Link>
            </li>
            <li>- Buy / Sell TestNFT for ETH using the TRADE page</li>
            <li>
              - Borrow ETH with the TEST NFT as collateral using the BORROW page
            </li>
            <li>
              - Lock your LE tokens for veLE in order to receive a share of the
              platform fees
            </li>
            <li>
              - Use your veLE to vote for the TEST NFT gauge in order to direct
              the LE inflation to the TEST NFT pool
            </li>
            <li>
              - Due to the unavailability of the deployable Balancer pool on the
              Sepolia testnet, the minting function for the Genesis NFT is
              currently non-functional.
            </li>
          </ol>
        </Box>
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
          text="Mint Test NFT 2"
          isFullWidth
          isLoading={minting2Loading}
          loadingProps={{
            spinnerColor: "#000000",
          }}
          onClick={async function () {
            try {
              setMinting2Loading(true);
              const tx = await testNFT2Signer.mint(address);
              await tx.wait(1);
              handleMintTestNFT2Success();
            } catch (error) {
              console.log(error);
            } finally {
              setMinting2Loading(false);
            }
          }}
        />

        <Box
          sx={{
            fontFamily: "Monospace",
            fontSize: "h6.fontSize",
          }}
          className="m-8"
        >
          Thank you for helping us test our platform!
        </Box>
      </div>
    </div>
  );
}

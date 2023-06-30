import { Button } from "grommet";
import { formatUnits, parseUnits } from "@ethersproject/units";
import testNFTContract from "../contracts/test/TestNFT.json";
import styles from "../styles/Home.module.css";
import contractAddresses from "../contractAddresses.json";
import nativeTokenFaucetContract from "../contracts/NativeTokenFaucet.json";
import nativeTokenContract from "../contracts/NativeToken.json";
import { useNotification } from "@web3uikit/core";
import { useEffect, useState } from "react";
import Link from "@mui/material/Link";
import { Box } from "@mui/material";
import {
  useAccount,
  useNetwork,
  useContract,
  useProvider,
  useSigner,
} from "wagmi";
import { ethers } from "ethers";
export default function Test() {
  const { address, isConnected } = useAccount();
  const [mintingLoading, setMintingLoading] = useState(false);
  const [minting2Loading, setMinting2Loading] = useState(false);
  const [nativeTokenLoading, setNativeTokenLoading] = useState(false);
  const [faucetBalance, setFaucetBalance] = useState("0");
  const dispatch = useNotification();
  const provider = useProvider();
  const { chain } = useNetwork();
  const { data: signer } = useSigner();
  const testNFTAddress = "0xa7540Eb784A17B9D704330B13F61E07D757010c2";
  const testNFT2Address = "0x8e06B6b9d28C3dc3a296099525Bf58F0B3F2c0DD";

  var addresses = contractAddresses[1];
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

  const nativeTokenFaucetSigner = useContract({
    contractInterface: nativeTokenFaucetContract.abi,
    addressOrName: addresses.NativeTokenFaucet,
    signerOrProvider: signer,
  });

  const nativeTokenProvider = useContract({
    contractInterface: nativeTokenContract.abi,
    addressOrName: addresses.NativeToken,
    signerOrProvider: provider,
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

  const handleDripTokenSuccess = async function () {
    dispatch({
      type: "success",
      message: "Faucet dripped 1000 LE to your wallet.",
      title: "Successful!",
      position: "bottomL",
    });
  };

  useEffect(() => {
    const getFaucetBalance = async () => {
      const nativeToken = new ethers.Contract(
        addresses.NativeToken,
        nativeTokenContract.abi,
        signer
      );
      console.log("Getting faucet balance");
      const balance = await nativeTokenProvider.balanceOf(
        addresses.NativeTokenFaucet
      );
      setFaucetBalance(balance.toString());
    };
    if (isConnected) {
      getFaucetBalance();
    }
  }, [isConnected, address]);

  return (
    <div className={styles.container}>
      <div className="flex flex-col justify-center items-center text-center">
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
            <li>
              - Get some Sepolia ETH from a{" "}
              <Link
                href="https://sepoliafaucet.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                faucet
              </Link>
            </li>

            <li>- Mint some Test NFTs using the buttons in this page</li>
            <li>- Mint some LE tokens using the faucet in this page</li>
            <li>- Buy / Sell TestNFT for ETH using the TRADE page</li>
            <li>
              - Borrow ETH with the TEST NFT as collateral using the BORROW page
            </li>
            <li>
              - Lock your LE tokens for veLE in order to receive a share of the
              fees collected by leNFT
            </li>
            <li>
              - Use your veLE to vote for the TEST NFT gauge in order to direct
              the LE inflation to the TEST NFT pool
            </li>
            <li>
              <Box sx={{ fontSize: "larger" }}>
                - Due to Balancer not being available on the Sepolia testnet
                yet, <strong>Genesis NFT minting is not available</strong> in
                the sepolia testing environment.
              </Box>
            </li>
          </ol>
        </Box>
        <div className="flex flex-col justify-center space-y-2 items-center text-center">
          <Button
            primary
            size="medium"
            label="Mint Test NFT"
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
            label="Mint Test NFT 2"
            primary
            size="medium"
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
          <Button
            label="Get 1000 LE from Faucet"
            primary
            size="medium"
            onClick={async function () {
              try {
                setNativeTokenLoading(true);
                const tx = await nativeTokenFaucetSigner.drip(address);
                await tx.wait(1);
                handleDripTokenSuccess();
              } catch (error) {
                console.log(error);
              } finally {
                setNativeTokenLoading(false);
              }
            }}
          />
          <Box sx={{ fontSize: "subtitle2.fontSize" }}>
            Faucet Balance: {formatUnits(faucetBalance, 18)} LE
          </Box>
        </div>
      </div>
    </div>
  );
}

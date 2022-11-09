import styles from "../styles/Home.module.css";
import contractAddresses from "../contractAddresses.json";
import { getAirdrop, getNewRequestID } from "../helpers/getAirdrop.js";
import { useState, useEffect } from "react";
import { Button, useNotification } from "@web3uikit/core";
import { BigNumber } from "@ethersproject/bignumber";
import Box from "@mui/material/Box";
import { ChevronLeft } from "@web3uikit/icons";
import Router from "next/router";
import { formatUnits } from "@ethersproject/units";
import {
  useContract,
  useSigner,
  useNetwork,
  useAccount,
  useProvider,
} from "wagmi";
import nativeTokenContract from "../contracts/NativeToken.json";

export default function Airdrop() {
  const [amount, setAmount] = useState("0");
  const [hasMinted, setHasMinted] = useState(false);
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const [mintingLoading, setMintingLoading] = useState(false);
  const { data: signer } = useSigner();
  const dispatch = useNotification();
  const provider = useProvider();

  const addresses =
    chain && chain.id in contractAddresses
      ? contractAddresses[chain.id]
      : contractAddresses["1"];

  const nativeTokenSigner = useContract({
    contractInterface: nativeTokenContract.abi,
    addressOrName: addresses.NativeToken,
    signerOrProvider: signer,
  });

  const nativeTokenProvider = useContract({
    contractInterface: nativeTokenContract.abi,
    addressOrName: addresses.NativeToken,
    signerOrProvider: provider,
  });

  async function updateAirdropInfo() {
    // Get supply
    const updatedAmount = await getAirdrop(address, chain.id);
    console.log("updatedAmount", updatedAmount.amount);
    setAmount(updatedAmount.amount);

    // Check if user already minted
    const updatedHasMinted = await nativeTokenProvider.hasMintedAirdrop(
      address
    );
    setHasMinted(updatedHasMinted);
    console.log("updatedHasMinted", updatedHasMinted);
  }

  async function updateUI() {
    updateAirdropInfo();
  }

  useEffect(() => {
    if (isConnected) {
      updateUI();
    }
  }, [isConnected]);

  const handleMintingSuccess = async function () {
    updateUI();
    dispatch({
      type: "success",
      message: "You just minted your airdrop tokens.",
      title: "Minting Successful!",
      position: "topR",
    });
  };

  return (
    <div className={styles.container}>
      <div className="flex flex-col items-center">
        <div className="flex flex-row mr-auto">
          <Button
            size="small"
            color="#eae5ea"
            iconLayout="icon-only"
            icon={<ChevronLeft fontSize="50px" />}
            onClick={async function () {
              Router.push({
                pathname: "/app",
              });
            }}
          />
        </div>

        <div className="flex flex-col rounded-3xl p-8 mt-4 items-center bg-black/5 shadow-lg max-w-3xl">
          <div className="flex flex-row">
            <Box
              sx={{
                fontFamily: "Monospace",
              }}
            >
              <div className="text-center break-all md:text-left text-lg">
                {address}
              </div>
            </Box>
          </div>
          <div className="flex flex-row m-8">
            <Box
              sx={{
                fontFamily: "Monospace",
                letterSpacing: 14,
              }}
            >
              <div className="text-2xl text-center break-all md:text-left">
                {"is eligible for"}
              </div>
            </Box>
          </div>
          <div className="flex flex-row">
            <Box
              sx={{
                fontFamily: "Monospace",
              }}
            >
              <div className="text-3xl text-center break-all">
                {formatUnits(amount, 18) + " LE"}
              </div>
            </Box>
          </div>
          <div className="flex flex-row mt-12 justify-center">
            {hasMinted ? (
              <Box
                sx={{
                  fontFamily: "Monospace",
                  fontSize: "h6.fontSize",
                  fontWeight: "bold",
                  letterSpacing: 2,
                }}
              >
                Already minted
              </Box>
            ) : (
              <Button
                loadingProps={{
                  spinnerColor: "#000000",
                  spinnerType: "loader",
                  direction: "right",
                  size: "24",
                }}
                loadingText=""
                disabled={!BigNumber.from(amount).gt(0)}
                isLoading={mintingLoading}
                customize={{
                  backgroundColor: "grey",
                  fontSize: 20,
                  textColor: "white",
                }}
                text="Mint Airdrop"
                theme="custom"
                size="large"
                radius="12"
                onClick={async function () {
                  try {
                    setMintingLoading(true);
                    const requestID = getNewRequestID();
                    const airdrop = await getAirdrop(
                      address,
                      chain.id,
                      requestID
                    );
                    const tx = await nativeTokenSigner.mintAirdropTokens(
                      requestID,
                      airdrop.sig
                    );
                    await tx.wait(1);
                    handleMintingSuccess();
                  } catch (error) {
                    console.log(error);
                  } finally {
                    setMintingLoading(false);
                  }
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

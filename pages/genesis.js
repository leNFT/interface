import styles from "../styles/Home.module.css";
import contractAddresses from "../contractAddresses.json";
import { Button, useNotification, Loading, Typography } from "@web3uikit/core";
import genesisNFTContract from "../contracts/GenesisNFT.json";
import { getAddressNFTs } from "../helpers/getAddressNFTs.js";
import { getGenesisMintCount } from "../helpers/getGenesisMintCount";
import LinearProgressWithLabel from "../components/LinearProgressWithLabel";
import { useState, useEffect } from "react";
import Image from "next/image";
import Box from "@mui/material/Box";
import GenesisMint from "../components/GenesisMint";
import GenesisBurn from "../components/GenesisBurn";
import StyledModal from "../components/StyledModal";
import {
  useContract,
  useProvider,
  useNetwork,
  useAccount,
  chainId,
} from "wagmi";
import { CardActionArea } from "@mui/material";
import Card from "@mui/material/Card";
import Link from "@mui/material/Link";
import CardContent from "@mui/material/CardContent";
import { BigNumber } from "@ethersproject/bignumber";
import { formatUnits, parseUnits } from "ethers/lib/utils";

export default function Genesis() {
  const [mintCount, setMintCount] = useState(0);
  const [selectedToken, setSelectedToken] = useState(0);
  const [cap, setCap] = useState(0);
  const [price, setPrice] = useState();
  const [visibleMintModal, setVisibleMintModal] = useState(false);
  const [visibleBurnModal, setVisibleBurnModal] = useState(false);
  const [userGenesisNFTs, setUserGenesisNFTs] = useState([]);
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const provider = useProvider();
  const dispatch = useNotification();
  var addresses = contractAddresses[1];

  const genesisNFTProvider = useContract({
    contractInterface: genesisNFTContract.abi,
    addressOrName: addresses.GenesisNFT,
    signerOrProvider: provider,
  });

  async function updateGenesisInfo() {
    setPrice(parseUnits("0.25", 18));
    // Get supply
    const updatedMintCount = await getGenesisMintCount(chain.id);
    console.log("MintCount", updatedMintCount);
    setMintCount(updatedMintCount);
    // Get cap
    setCap(1337);
  }

  async function updateGenesisWallet() {
    const updatedUserGenesisNFTs = await getAddressNFTs(
      address,
      addresses.GenesisNFT,
      chain.id
    );
    console.log("UserGenesisNFTs", updatedUserGenesisNFTs);
    setUserGenesisNFTs(updatedUserGenesisNFTs);
  }

  async function updateUI() {
    updateGenesisInfo();
    updateGenesisWallet();
  }

  useEffect(() => {
    if (isConnected) {
      updateUI();
    }
  }, [isConnected, address, chain]);

  return (
    <div className={styles.container}>
      <StyledModal
        hasFooter={false}
        title={"Mint Genesis NFT"}
        isVisible={visibleMintModal}
        onCloseButtonPressed={function () {
          setVisibleMintModal(false);
        }}
      >
        <GenesisMint
          setVisibility={setVisibleMintModal}
          mintCount={mintCount}
          price={price}
          updateUI={updateUI}
        />
      </StyledModal>
      <StyledModal
        hasFooter={false}
        title={"Burn Genesis NFT"}
        isVisible={visibleBurnModal}
        onCloseButtonPressed={function () {
          setVisibleBurnModal(false);
        }}
      >
        <GenesisBurn
          setVisibility={setVisibleBurnModal}
          tokenId={selectedToken}
          updateUI={updateUI}
        />
      </StyledModal>
      <div className="flex flex-col items-center">
        <div className="flex flex-col lg:flex-row w-full items-center lg:space-x-8 justify-center">
          <div className="flex flex-col w-full md:w-8/12 xl:w-4/12 items-center justify-center border-4 m-2 p-2 md:mt-8 rounded-3xl bg-black/5 shadow-lg">
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: "h5.fontSize",
                marginTop: 1,
                marginBottom: 3,
              }}
            >
              Mint Instructions
            </Box>
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: "subtitle2.fontSize",
                textAlign: "left",
                width: "90%",
              }}
            >
              <div className="my-1">
                - Connect your wallet to Ethereum Mainnet
              </div>
              <div className="my-1">
                - Click the &apos;Mint Genesis NFT&apos; button
              </div>

              <div className="my-1">- Choose a locktime</div>
              <div className="my-1">
                - Mint the NFT and confirm the transaction in your wallet
              </div>
              <div className="my-1">
                - Your NFT will now appear at the bottom of this page
              </div>
            </Box>
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: "subtitle2.fontSize",
                marginTop: 2,
              }}
            >
              <Link
                href="https://lenft.gitbook.io/lenft-docs/basics/genesis-mint"
                underline="hover"
                target="_blank"
              >
                {"Genesis Docs"}
              </Link>
            </Box>
          </div>
          <div className="flex flex-col w-full md:w-10/12 xl:w-6/12 items-center justify-center border-4 m-2 md:mt-8 rounded-3xl bg-black/5 shadow-lg">
            <div className="flex flex-col md:flex-row m-2 items-center">
              <div className="flex flex-row m-8 items-center space-x-4 justify-between rounded-2xl bg-black/5 shadow-lg p-4">
                <div className="flex flex-col w-6/12">
                  <div className="flex flex-row justify-center m-2">
                    <Box
                      sx={{
                        fontFamily: "Monospace",
                        fontSize: "h6.fontSize",
                        fontWeight: "bold",
                      }}
                    >
                      Price
                    </Box>
                  </div>
                  <div className="flex flex-col justify-center items-center text-center m-2">
                    {price ? (
                      <Box
                        sx={{
                          fontFamily: "Monospace",
                          fontSize: "h6.fontSize",
                        }}
                      >
                        {formatUnits(price ? price : "0", 18) + " ETH"}
                      </Box>
                    ) : (
                      <Loading
                        className="px-10"
                        size={25}
                        spinnerColor="#000000"
                      />
                    )}
                  </div>
                </div>
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "caption.fontSize",
                  }}
                  className="text-gray-600 w-6/12"
                >
                  Receive up to 0.1 ETH (in LE) + trading fees when you burn
                  your Genesis NFT.
                </Box>
              </div>
              <div className="flex flex-col justify-center text-center mt-2 mb-8 md:m-8 w-8/12 rounded-2xl bg-black/5 shadow-lg p-4">
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "h5.fontSize",
                  }}
                >
                  <div>{cap - mintCount}</div>
                  <div>{"remaining"}</div>
                </Box>
              </div>
            </div>
            <div className="flex flex-row justify-center mb-4">
              <Button
                customize={{
                  backgroundColor: "grey",
                  fontSize: 20,
                  textColor: "white",
                }}
                text={
                  isConnected ? "Mint Genesis NFT" : "Connect Wallet to Mint"
                }
                disabled={!isConnected}
                theme="custom"
                size="large"
                radius="12"
                onClick={async function () {
                  if (!isConnected) {
                    dispatch({
                      type: "warning",
                      message: "You need to connect your wallet first",
                      title: "Connect Wallet",
                      position: "bottomL",
                    });
                  } else {
                    setVisibleMintModal(true);
                  }
                }}
              />
            </div>
            {isConnected && chain?.id != 1 && (
              <div className="flex flex-row justify-center text-center mb-4 w-10/12">
                <Typography
                  variant="subtitle2"
                  color="#BF6958"
                  sx={{ fontFamily: "Monospace" }}
                >
                  {"This feature is only available on Ethereum Mainnet"}
                </Typography>
              </div>
            )}
          </div>
        </div>
        {isConnected && (
          <div className="flex flex-col border-4 m-2 mt-8 p-2 md:m-8 rounded-3xl bg-black/5 shadow-lg max-w-3xl">
            <div className="flex flex-row p-4 md:p-8">
              <Box
                sx={{
                  fontFamily: "Monospace",
                  letterSpacing: 18,
                }}
              >
                <div className="text-xl text-center lg:text-left lg:text-4xl">
                  Your Genesis NFTs
                </div>
              </Box>
            </div>
            {userGenesisNFTs.length != 0 ? (
              <div className="flex flex-row grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {userGenesisNFTs.map((nft) => (
                  <div
                    key={nft.tokenId}
                    className="flex m-4 items-center justify-center"
                  >
                    <Card
                      sx={{
                        borderRadius: 4,
                        background:
                          "linear-gradient(to right bottom, #eff2ff, #f0e5e9)",
                      }}
                    >
                      <CardActionArea
                        onClick={function () {
                          setSelectedToken(
                            BigNumber.from(nft.tokenId).toNumber()
                          );
                          setVisibleBurnModal(true);
                        }}
                      >
                        <CardContent>
                          {nft.media[0] ? (
                            <div className="flex flex-col items-center">
                              <Image
                                loader={() => nft.media[0].gateway}
                                alt="Supported Asset"
                                src={nft.media[0].gateway}
                                height="200"
                                width="200"
                                className="rounded-2xl"
                                loading="eager"
                              />
                            </div>
                          ) : (
                            <div className="flex flex-col w-[150px] h-[150px] text-center items-center justify-center">
                              <Box
                                sx={{
                                  fontFamily: "Monospace",
                                  fontSize: 12,
                                }}
                              >
                                No Image
                              </Box>
                            </div>
                          )}
                          <Box
                            sx={{
                              fontFamily: "Monospace",
                              fontSize: "subtitle1.fontSize",
                            }}
                          >
                            <div className="flex flex-col mt-2 items-center text-center">
                              {"#" + BigNumber.from(nft.tokenId).toNumber()}
                            </div>
                          </Box>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-row m-8 p-2">
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "subtitle1.fontSize",
                  }}
                >
                  No Genesis NFTs found.
                </Box>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

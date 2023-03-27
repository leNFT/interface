import styles from "../styles/Home.module.css";
import contractAddresses from "../contractAddresses.json";
import { Button, useNotification, Loading } from "@web3uikit/core";
import genesisNFTContract from "../contracts/GenesisNFT.json";
import { getAddressNFTs } from "../helpers/getAddressNFTs.js";
import LinearProgressWithLabel from "../components/LinearProgressWithLabel";
import { useState, useEffect } from "react";
import Image from "next/image";
import Box from "@mui/material/Box";
import GenesisMint from "../components/GenesisMint";
import GenesisBurn from "../components/GenesisBurn";
import StyledModal from "../components/StyledModal";
import { useContract, useProvider, useNetwork, useAccount } from "wagmi";
import { CardActionArea } from "@mui/material";
import Card from "@mui/material/Card";
import Link from "@mui/material/Link";
import CardContent from "@mui/material/CardContent";
import { BigNumber } from "@ethersproject/bignumber";
import { formatUnits } from "ethers/lib/utils";
import votingEscrowContract from "../contracts/VotingEscrow.json";

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
  const [hasLocked, setHasLocked] = useState(false);
  const provider = useProvider();
  const dispatch = useNotification();
  var addresses = contractAddresses["11155111"];

  const votingEscrowProvider = useContract({
    contractInterface: votingEscrowContract.abi,
    addressOrName: addresses.VotingEscrow,
    signerOrProvider: provider,
  });

  const genesisNFTProvider = useContract({
    contractInterface: genesisNFTContract.abi,
    addressOrName: addresses.GenesisNFT,
    signerOrProvider: provider,
  });

  async function getLocked() {
    const locked = await votingEscrowProvider.locked(address);
    if (locked.end > Date.now() / 1000 || BigNumber.from(locked.amount).gt(0)) {
      setHasLocked(true);
    }
  }

  async function updateGenesisInfo() {
    // Get supply
    const updatedMintCount = await genesisNFTProvider.mintCount();
    setMintCount(updatedMintCount.toNumber());
    console.log("updatedMintCount.toNumber()", updatedMintCount.toNumber());
    // Get cap
    const updatedCap = await genesisNFTProvider.getCap();
    setCap(updatedCap.toNumber());
    // Get price
    const updatedPrice = await genesisNFTProvider.getPrice();
    console.log("updatedPrice", updatedPrice);
    setPrice(updatedPrice.toString());
  }

  async function updateGenesisWallet() {
    // Get user NFT assets, special case for testnet sepolia

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
      getLocked();
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
        <div className="flex flex-col w-full md:w-8/12 xl:w-5/12 items-center justify-center border-4 m-2 md:mt-8 rounded-3xl bg-black/5 shadow-lg">
          <div className="flex flex-row mt-4">
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: "subtitle2.fontSize",
              }}
            >
              <Link
                href="https://lenft.gitbook.io/lenft-docs/basics/genesis-mint"
                underline="hover"
                target="_blank"
              >
                {"How does this work?"}
              </Link>
            </Box>
          </div>
          <div className="flex flex-col md:flex-row m-2">
            <div className="flex flex-col m-8 rounded-2xl bg-black/5 shadow-lg p-4">
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
              <div className="flex flex-row justify-center text-center m-2">
                {price ? (
                  <Box
                    sx={{
                      fontFamily: "Monospace",
                      fontSize: "h5.fontSize",
                    }}
                  >
                    {formatUnits(price ? price : "0", 18) + " ETH"}
                  </Box>
                ) : (
                  <Loading className="px-10" size={25} spinnerColor="#000000" />
                )}
              </div>
            </div>
            <div className="flex flex-col justify-center text-center m-8 rounded-2xl bg-black/5 shadow-lg p-4">
              <Box
                sx={{
                  fontFamily: "Monospace",
                  fontSize: "h5.fontSize",
                }}
              >
                <div>{mintCount + " of " + cap}</div>
                <div>{"minted"}</div>
              </Box>
              <div className="mt-4">
                <LinearProgressWithLabel
                  color="primary"
                  value={cap != 0 ? mintCount / cap : 0}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-row justify-center mb-4">
            <Button
              customize={{
                backgroundColor: "grey",
                fontSize: 20,
                textColor: "white",
              }}
              text={hasLocked ? "Minted." : "Mint"}
              disabled={hasLocked}
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
        </div>
        <div className="flex flex-col border-4 m-2 mt-8 p-2 md:m-8 rounded-3xl bg-black/5 shadow-lg max-w-3xl">
          <div className="flex flex-row p-4 md:p-8">
            <Box
              sx={{
                fontFamily: "Monospace",
                letterSpacing: 18,
              }}
            >
              <div className="text-xl text-center md:text-left md:text-4xl">
                Your Genesis NFTs
              </div>
            </Box>
          </div>
          {userGenesisNFTs.length != 0 ? (
            <div className="flex flex-row grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2">
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
                        {nft.media ? (
                          <div className="flex flex-col items-center">
                            <Image
                              loader={() => nft.media.mediaCollection.low.url}
                              alt="Supported Asset"
                              src={nft.media.mediaCollection.low.url}
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
      </div>
    </div>
  );
}

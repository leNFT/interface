import styles from "../styles/Home.module.css";
import { Button } from "@web3uikit/core";
import contractAddresses from "../contractAddresses.json";
import { getAddressNFTs } from "../helpers/getAddressNFTs.js";
import LinearProgressWithLabel from "../components/LinearProgressWithLabel";
import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import GenesisMint from "../components/GenesisMint";
import GenesisBurn from "../components/GenesisBurn";
import StyledModal from "../components/StyledModal";
import { useContract, useProvider, useNetwork, useAccount } from "wagmi";
import { CardActionArea } from "@mui/material";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import { BigNumber } from "@ethersproject/bignumber";
import { formatUnits } from "ethers/lib/utils";

export default function Stake() {
  const [mintCount, setMintCount] = useState(0);
  const [selectedToken, setSelectedToken] = useState(0);
  const [cap, setCap] = useState(0);
  const [price, setPrice] = useState("0");
  const [visibleMintModal, setVisibleMintModal] = useState(false);
  const [visibleBurnModal, setVisibleBurnModal] = useState(false);
  const [userGenesisNFTs, setUserGenesisNFTs] = useState([]);
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const provider = useProvider();

  const addresses =
    chain && chain.id in contractAddresses
      ? contractAddresses[chain.id]
      : contractAddresses["1"];

  const genesisNFTProvider = useContract({
    contractInterface: genesisNFTContract.abi,
    addressOrName: addresses.GenesisNFT,
    signerOrProvider: provider,
  });

  async function updateGenesisInfo() {
    // Get supply
    const updatedMintCount = await genesisNFTProvider.getMintCount();
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
    // Get user NFT assets, special case for testnet goerli
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
  }, [isConnected]);

  return (
    <div className={styles.container}>
      <StyledModal
        hasFooter={false}
        title={"Mint Genesis NFT"}
        isVisible={visibleMintModal}
        width="50%"
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
        width="50%"
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
        <div className="flex flex-col items-center justify-center border-4 m-2 md:m-8 rounded-3xl bg-black/5 shadow-lg">
          <div className="flex flex-col md:flex-row m-4">
            <div className="flex flex-col m-8 rounded-2xl bg-black/5 shadow-lg p-4">
              <div className="flex flex-row m-2">
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
              <div className="flex flex-row m-2">
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "h5.fontSize",
                  }}
                >
                  {formatUnits(price, 18) + " ETH"}
                </Box>
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
                  value={mintCount / cap}
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
              text="Mint"
              theme="custom"
              size="large"
              radius="12"
              onClick={async function () {
                setVisibleMintModal(true);
              }}
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col border-4 m-2 p-2 md:m-8 rounded-3xl bg-black/5 shadow-lg">
        <div className="flex flex-row p-8">
          <Box
            sx={{
              fontFamily: "Monospace",
              letterSpacing: 24,
            }}
          >
            <div className="text-xl md:text-4xl">Your Genesis NFTs</div>
          </Box>
        </div>
        {userGenesisNFTs.length != 0 ? (
          <div className="flex flex-row grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {userGenesisNFTs.map((nft) => (
              <div
                key={nft.id.tokenId}
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
                        BigNumber.from(nft.id.tokenId).toNumber()
                      );
                      setVisibleBurnModal(true);
                    }}
                  >
                    <CardContent>
                      <Box
                        sx={{
                          fontFamily: "Monospace",
                          fontSize: "h1.fontSize",
                        }}
                      >
                        <div className="flex flex-col mt-2 items-center text-center">
                          {"#" + BigNumber.from(nft.id.tokenId).toNumber()}
                        </div>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-row m-8 p-2">No Genesis NFTs found.</div>
        )}
      </div>
    </div>
  );
}

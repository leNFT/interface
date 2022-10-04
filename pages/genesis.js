import styles from "../styles/Home.module.css";
import { Button } from "@web3uikit/core";
import contractAddresses from "../contractAddresses.json";
import genesisNFTContract from "../contracts/GenesisNFT.json";
import { getNFTs } from "../helpers/getNFTs.js";
import LinearProgressWithLabel from "../components/LinearProgressWithLabel";
import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import {
  useContract,
  useProvider,
  useNetwork,
  useSigner,
  useAccount,
} from "wagmi";

export default function Stake() {
  const [supply, setSupply] = useState(0);
  const [cap, setCap] = useState(0);
  const [userGenesisNFTs, setUserGenesisNFTs] = useState([]);
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const provider = useProvider();
  const { data: signer } = useSigner();

  const addresses =
    chain && chain.id in contractAddresses
      ? contractAddresses[chain.id]
      : contractAddresses["1"];

  const genesisNFTProvider = useContract({
    contractInterface: genesisNFTContract.abi,
    addressOrName: addresses.GenesisNFT,
    signerOrProvider: provider,
  });

  const genesisNFTSigner = useContract({
    contractInterface: genesisNFTContract.abi,
    addressOrName: addresses.GenesisNFT,
    signerOrProvider: signer,
  });

  async function updateGenesisInfo() {
    // Get supply
    const updatedSupply = await genesisNFTProvider.getSupply();
    setSupply(updatedSupply.toNumber());
    // Get cap
    const updatedCap = await genesisNFTProvider.getCap();
    setCap(updatedCap.toNumber());
  }

  async function updateGenesisWallet() {
    // Get user NFT assets, special case for testnet goerli
    const updatedUserGenesisNFTs = await getNFTs(
      address,
      addresses.GenesisNFT,
      chain.id
    );
    console.log("UserGenesisNFTs", updatedUserGenesisNFTs);
    setUserGenesisNFTs(updatedUserGenesisNFTs);
  }

  useEffect(() => {
    if (isConnected) {
      updateGenesisInfo();
      updateGenesisWallet();
    }
  }, [isConnected]);

  return (
    <div className={styles.container}>
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
                  0.3 ETH
                </Box>
              </div>
            </div>
            <div className="flex flex-col justify-center m-8 rounded-2xl bg-black/5 shadow-lg p-4">
              <Box
                sx={{
                  fontFamily: "Monospace",
                  fontSize: "h5.fontSize",
                }}
              >
                <div>{"Minted " + supply}</div>
                <div>{"of " + cap}</div>
              </Box>
            </div>
          </div>
          <div className="flex flex-col justify-center m-4 min-w-[80%]">
            <LinearProgressWithLabel color="success" value={supply / cap} />
          </div>
          <div className="flex flex-row justify-center m-4">
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
              onClick={async function () {}}
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
                className="flex m-4 items-center justify-center max-w-[300px]"
              >
                <Card
                  sx={{
                    borderRadius: 4,
                    background:
                      "linear-gradient(to right bottom, #eff2ff, #f0e5e9)",
                  }}
                >
                  <CardContent>
                    {nft.token_uri ? (
                      <div className="flex flex-col items-center">
                        <Image
                          loader={() => nft.token_uri}
                          src={nft.token_uri}
                          height="200"
                          width="200"
                          unoptimized={true}
                          className="rounded-2xl"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <Illustration
                          height="180px"
                          logo="token"
                          width="100%"
                        />
                        Loading...
                      </div>
                    )}
                    <Box
                      sx={{
                        fontFamily: "Monospace",
                        fontSize: "subtitle1.fontSize",
                      }}
                    >
                      <div className="flex flex-col mt-2 items-center text-center">
                        <div>{nft.contractMetadata.name}</div>
                        <div>
                          {"#" + BigNumber.from(nft.id.tokenId).toNumber()}
                        </div>
                      </div>
                    </Box>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-row m-8 p-2">
            You don't own any Genesis NFTs yet.
          </div>
        )}
      </div>
    </div>
  );
}

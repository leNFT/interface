import styles from "../styles/Home.module.css";
import contractAddresses from "../contractAddresses.json";
import { getAssetPrice } from "../helpers/getAssetPrice.js";
import { getNFTImage } from "../helpers/getNFTImage.js";
import { getAddressNFTs } from "../helpers/getAddressNFTs.js";
import { getSupportedNFTs } from "../helpers/getSupportedNFTs.js";
import { formatUnits } from "@ethersproject/units";
import { useState, useEffect } from "react";
import { useNotification, Tooltip, Loading } from "@web3uikit/core";
import { HelpCircle } from "@web3uikit/icons";
import { BigNumber } from "@ethersproject/bignumber";
import Borrow from "../components/Borrow";
import RepayLoan from "../components/RepayLoan";
import Image from "next/image";
import nftOracleContract from "../contracts/NFTOracle.json";
import { getAddress } from "@ethersproject/address";
import loanCenterContract from "../contracts/LoanCenter.json";
import { calculateHealthLevel } from "../helpers/healthLevel.js";
import LinearProgressWithLabel from "../components/LinearProgressWithLabel";
import StyledModal from "../components/StyledModal";
import { Divider } from "@mui/material";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import { CardActionArea } from "@mui/material";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { useAccount, useNetwork, useContract, useProvider } from "wagmi";

export default function App() {
  const [loadingUI, setLoadingUI] = useState(true);
  const [count, setCount] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [loans, setLoans] = useState([]);
  const [supportedAssets, setSupportedAssets] = useState([]);
  const [unsupportedAssets, setUnsupportedAssets] = useState([]);
  const [visibleAssetModal, setVisibleAssetModal] = useState(false);
  const [visibleLoanModal, setVisibleLoanModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState();
  const [selectedLoan, setSelectedLoan] = useState();
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();

  const provider = useProvider();
  const dispatch = useNotification();
  const addresses =
    chain && chain.id in contractAddresses
      ? contractAddresses[chain.id]
      : contractAddresses["1"];

  const loanCenter = useContract({
    contractInterface: loanCenterContract.abi,
    addressOrName: addresses.LoanCenter,
    signerOrProvider: provider,
  });

  async function setupUI() {
    console.log("Setting up UI");
    setLoadingUI(true);

    // Get user NFT assetss
    const addressNFTs = await getAddressNFTs(address, "", chain.id);
    const supportedNFTs = await getSupportedNFTs(chain.id);
    console.log("supportedNFTs:", supportedNFTs);
    var updatedLoans = [];
    var updatedSupportedAssets = [];
    var updatedUnsupportedAssets = [];

    console.log("addressNFTs", addressNFTs);

    // Loop through all of tthe user NFTs
    console.log("Found " + addressNFTs.length + " NFTs for user " + address);
    setCount(addressNFTs.length);

    for (let i = 0; i < addressNFTs.length; i++) {
      if (
        getAddress(addressNFTs[i].contract.address) ==
        contractAddresses[chain.id].DebtToken
      ) {
        // Get loan details
        const loan = await loanCenter.getLoan(
          BigNumber.from(addressNFTs[i].id.tokenId).toNumber()
        );
        console.log("loan", loan);

        const debt = await loanCenter.getLoanDebt(
          BigNumber.from(addressNFTs[i].id.tokenId).toNumber()
        );

        console.log("debt", debt);

        const tokenURI = await getNFTImage(
          loan.nftAsset,
          loan.nftTokenId,
          chain.id
        );

        // Save relevant loan info
        updatedLoans.push({
          loanId: BigNumber.from(addressNFTs[i].id.tokenId).toNumber(),
          tokenName: addressNFTs[i].title,
          tokenAddress: loan.nftAsset,
          tokenId: loan.nftTokenId.toString(),
          tokenURI: tokenURI,
          amount: loan.amount,
          boost: loan.boost,
          debt: debt,
          tokenPrice: await getAssetPrice(loan.nftAsset, loan.nftTokenId),
          maxLTV: loan.maxLTV,
        });
      } else if (
        supportedNFTs[getAddress(addressNFTs[i].contract.address)] != undefined
      ) {
        // Get token price
        const tokenPrice = await getAssetPrice(
          getAddress(addressNFTs[i].contract.address),
          BigNumber.from(addressNFTs[i].id.tokenId).toNumber()
        );

        //Replace token URI
        addressNFTs[i].token_uri = await getNFTImage(
          addressNFTs[i].contract.address,
          BigNumber.from(addressNFTs[i].id.tokenId).toNumber(),
          chain.id
        );

        // Add asset to supported assets
        updatedSupportedAssets.push(addressNFTs[i]);
      } else {
        // Get max 5 unsupported assets
        if (updatedUnsupportedAssets.length < 5) {
          //Replace token URI
          addressNFTs[i].token_uri = await getNFTImage(
            addressNFTs[i].contract.address,
            BigNumber.from(addressNFTs[i].id.tokenId).toNumber(),
            chain.id
          );
          updatedUnsupportedAssets.push(addressNFTs[i]);
        }
      }

      setProcessedCount(i);
    }
    console.log("updatedLoans:", updatedLoans);
    console.log("updatedSupportedAssets:", updatedSupportedAssets);
    console.log("updatedUnsupportedAssets:", updatedUnsupportedAssets);

    setLoans(updatedLoans);
    setSupportedAssets(updatedSupportedAssets);
    setUnsupportedAssets(updatedUnsupportedAssets);

    setLoadingUI(false);
  }

  // Runs once
  useEffect(() => {
    if (isConnected) {
      setLoadingUI(true);
      console.log("Web3 Enabled, ChainId:", chain.id);
      setupUI();
    }
    console.log("useEffect called");
  }, [isConnected, address, chain]);

  const handleUnsupportedAssetClick = async function (assetName) {
    dispatch({
      type: "warning",
      message: assetName + " is not supported by leNFT.",
      title: "Unsupported Asset",
      position: "topR",
    });
  };

  return (
    <div className={styles.container}>
      {loadingUI ? (
        <div className="flex flex-col items-center justify-center m-16">
          <div className="flex flex-row m-2">
            <Typography variant="subtitle3">
              <Box
                sx={{
                  fontFamily: "Monospace",
                  letterSpacing: 24,
                }}
              >
                <div className="text-md md:text-2xl justify-center text-center">
                  {"Got " + processedCount + "/" + count + " assets"}
                </div>
              </Box>
            </Typography>
          </div>
          <div className="flex flex-row m-24">
            <Loading size={48} spinnerColor="#2E7DAF" spinnerType="loader" />
          </div>
        </div>
      ) : (
        <div>
          <div className="flex flex-col mb-8 rounded-3xl m-2 p-2 bg-black/5 shadow-lg">
            <div className="p-8">
              <Box
                sx={{
                  fontFamily: "Monospace",
                  letterSpacing: 24,
                }}
              >
                <div className="text-xl md:text-4xl">My Loans</div>
              </Box>
            </div>
            {loans.length == 0 ? (
              <div className="m-8">
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "subtitle1.fontSize",
                  }}
                >
                  No active loans found.
                </Box>
              </div>
            ) : (
              <div className="flex grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {loans.map((loan, _) => (
                  <div
                    key={loan.loanId}
                    className="flex m-4 items-center justify-center max-w-[300px]"
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
                          setSelectedLoan(loan);
                          setVisibleLoanModal(true);
                        }}
                      >
                        <CardContent>
                          {loan.tokenURI ? (
                            <Image
                              loader={() => loan.tokenURI}
                              src={loan.tokenURI}
                              height="200"
                              width="200"
                              className="rounded-3xl"
                            />
                          ) : (
                            <Box
                              sx={{
                                fontFamily: "Monospace",
                                fontSize: "caption",
                              }}
                            >
                              {"Can't load image"}.
                            </Box>
                          )}
                          <div className="flex flex-row mt-6">
                            <div className="flex flex-col">
                              <Box
                                sx={{
                                  fontFamily: "Monospace",
                                  fontSize: "caption",
                                }}
                              >
                                Health Level
                              </Box>
                            </div>
                            <div className="flex flex-col ml-1">
                              <Tooltip
                                content="Represents the relation between the debt and the collateral's value. When it reaches 0 the loan can be liquidated."
                                position="top"
                                minWidth={200}
                              >
                                <HelpCircle fontSize="14px" color="#000000" />
                              </Tooltip>
                            </div>
                          </div>
                          <div>
                            <LinearProgressWithLabel
                              color="success"
                              value={calculateHealthLevel(
                                loan.debt,
                                BigNumber.from(loan.maxLTV)
                                  .add(loan.boost)
                                  .mul(loan.tokenPrice)
                                  .div(10000)
                                  .toString()
                              )}
                            />
                          </div>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </div>
                ))}
                {selectedLoan && (
                  <StyledModal
                    hasFooter={false}
                    width="50%"
                    isVisible={visibleLoanModal}
                    onCloseButtonPressed={function () {
                      setVisibleLoanModal(false);
                    }}
                  >
                    <RepayLoan
                      setVisibility={setVisibleLoanModal}
                      loan_id={selectedLoan.loanId}
                      token_name={selectedLoan.tokenName}
                      token_address={selectedLoan.tokenAddress}
                      token_id={selectedLoan.tokenId}
                      token_uri={selectedLoan.tokenURI}
                      updateUI={setupUI}
                    />
                  </StyledModal>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col mt-8 rounded-3xl m-2 p-2 bg-black/5 shadow-lg">
            <div className="p-8">
              <div className="flex flex-row">
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    letterSpacing: 24,
                  }}
                >
                  <div className="text-xl md:text-4xl">NFT Wallet</div>
                </Box>
              </div>
              <div className="flex mb-0 flex-row mt-4">
                <Box
                  sx={{
                    fontFamily: "Monospace",
                  }}
                >
                  <div className="text-sm md:text-lg">
                    {supportedAssets.length + " supported NFTs"}
                  </div>
                </Box>
              </div>
            </div>
            {supportedAssets.length != 0 && (
              <div className="flex flex-row grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {supportedAssets.map((supportedAsset) => (
                  <div
                    key={
                      supportedAsset.id.tokenId +
                      supportedAsset.contract.address
                    }
                    className="flex m-4 items-center justify-center max-w-[300px]"
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
                          setSelectedAsset(supportedAsset);
                          setVisibleAssetModal(true);
                        }}
                      >
                        <CardContent>
                          {supportedAsset.token_uri ? (
                            <div className="flex flex-col items-center">
                              <Image
                                loader={() => supportedAsset.token_uri}
                                src={supportedAsset.token_uri}
                                height="200"
                                width="200"
                                className="rounded-2xl"
                              />
                            </div>
                          ) : (
                            <Box
                              sx={{
                                fontFamily: "Monospace",
                                fontSize: "caption",
                              }}
                            >
                              {"Can't load Image"}.
                            </Box>
                          )}
                          <Box
                            sx={{
                              fontFamily: "Monospace",
                              fontSize: "subtitle1.fontSize",
                            }}
                          >
                            <div className="flex flex-col mt-2 items-center text-center">
                              <div>{supportedAsset.contractMetadata.name}</div>
                              <div>
                                {"#" +
                                  BigNumber.from(
                                    supportedAsset.id.tokenId
                                  ).toNumber()}
                              </div>
                            </div>
                          </Box>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </div>
                ))}
              </div>
            )}
            {selectedAsset && (
              <StyledModal
                hasFooter={false}
                width="50%"
                isVisible={visibleAssetModal}
                onCloseButtonPressed={function () {
                  setVisibleAssetModal(false);
                }}
              >
                <Borrow
                  setVisibility={setVisibleAssetModal}
                  token_address={getAddress(selectedAsset.contract.address)}
                  token_id={BigNumber.from(selectedAsset.id.tokenId).toNumber()}
                  token_uri={selectedAsset.token_uri}
                  updateUI={setupUI}
                />
              </StyledModal>
            )}
            {supportedAssets.length != 0 && unsupportedAssets.length != 0 && (
              <div className="m-4 items-center justify-center">
                <Divider variant="middle" />
              </div>
            )}
            {unsupportedAssets.length != 0 && (
              <div className="flex flex-row grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {unsupportedAssets.map((unsupportedAsset, index) => (
                  <div
                    key={
                      unsupportedAsset.id.tokenId +
                      unsupportedAsset.contract.address
                    }
                    className="flex m-4 items-center justify-center max-w-[220px]"
                  >
                    {index == 4 && unsupportedAssets.length == 5 ? (
                      <div className="flex items-center p-6">
                        <Box
                          sx={{
                            fontFamily: "Monospace",
                            fontSize: "subtitle1.fontSize",
                          }}
                        >
                          ...and more unsupported NFTs
                        </Box>
                      </div>
                    ) : (
                      <Card
                        sx={{
                          borderRadius: 4,
                          background:
                            "linear-gradient(to right bottom, #eff2ff, #f0e5e9)",
                        }}
                      >
                        <CardActionArea
                          onClick={() =>
                            handleUnsupportedAssetClick(
                              unsupportedAsset.contractMetadata.name
                            )
                          }
                        >
                          <CardContent>
                            {unsupportedAsset.token_uri ? (
                              <div className="flex flex-col items-center">
                                <Image
                                  loader={() => unsupportedAsset.token_uri}
                                  src={unsupportedAsset.token_uri}
                                  height="120"
                                  width="120"
                                  className="rounded-2xl"
                                />
                              </div>
                            ) : (
                              <div className="flex flex-col h-28 text-center items-center justify-center">
                                <Typography variant="subtitle3" italic="true">
                                  Image Unavailable
                                </Typography>
                              </div>
                            )}
                            <Box
                              sx={{
                                fontFamily: "Monospace",
                                fontSize: "subtitle2.fontSize",
                              }}
                            >
                              <div className="flex flex-col mt-4 items-center text-center">
                                <div>
                                  {unsupportedAsset.contractMetadata.name}
                                </div>
                                <div>
                                  {"#" +
                                    BigNumber.from(
                                      unsupportedAsset.id.tokenId
                                    ).toNumber()}
                                </div>
                              </div>
                            </Box>
                          </CardContent>
                        </CardActionArea>
                      </Card>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import styles from "../styles/Home.module.css";
import contractAddresses from "../contractAddresses.json";
import { getAssetsPrice } from "../helpers/getAssetsPrice.js";
import { getNFTImage } from "../helpers/getNFTImage.js";
import { getAddressNFTs } from "../helpers/getAddressNFTs.js";
import { getLendingNFTCollections } from "../helpers/getLendingNFTCollections.js";
import { useState, useEffect } from "react";
import Pagination from "@mui/material/Pagination";
import { useNotification, Tooltip, Loading, Input } from "@web3uikit/core";
import { HelpCircle, Search } from "@web3uikit/icons";
import { BigNumber } from "@ethersproject/bignumber";
import CreateLoan from "../components/lending/CreateLoan";
import RepayLoan from "../components/lending/RepayLoan";
import Image from "next/image";
import { Button } from "grommet";
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

export default function Borrow() {
  const SEARCH_PAGE_SIZE = 9;
  const [loadingUI, setLoadingUI] = useState(false);
  const [loans, setLoans] = useState([]);
  const [supportedAssets, setSupportedAssets] = useState([]);
  const [searchPage, setSearchPage] = useState(0);
  const [searchResults, setSearchResults] = useState([]);
  const [searchPageData, setSearchPageData] = useState([]);
  const [searchInputString, setSearchInputString] = useState("");
  const [unsupportedAssets, setUnsupportedAssets] = useState([]);
  const [visibleCreateLoanModal, setVisibleCreateLoanModal] = useState(false);
  const [visibleLoanModal, setVisibleLoanModal] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState();
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [selectedAssetsImages, setSelectedAssetsImages] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState();
  const [supportedNFTs, setSupportedNFTs] = useState([]);
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();

  const provider = useProvider();
  const dispatch = useNotification();
  var addresses = contractAddresses["11155111"];

  const loanCenter = useContract({
    contractInterface: loanCenterContract.abi,
    addressOrName: addresses.LoanCenter,
    signerOrProvider: provider,
  });

  async function setupUI() {
    console.log("Setting up UI");
    setLoadingUI(true);
    setSelectedAssets([]);

    // Get user NFT assets
    const addressNFTs = await getAddressNFTs(address, "", chain.id);
    const updatedSupportedNFTs = await getLendingNFTCollections(chain.id);
    setSupportedNFTs(updatedSupportedNFTs);

    console.log("supportedNFTs:", updatedSupportedNFTs);
    var updatedLoans = [];
    var updatedSupportedAssets = [];
    var updatedUnsupportedAssets = [];

    console.log("addressNFTs", addressNFTs);

    // Loop through all of tthe user NFTs
    console.log("Found " + addressNFTs.length + " NFTs for user " + address);

    for (let i = 0; i < addressNFTs.length; i++) {
      if (
        getAddress(addressNFTs[i].contract.address) ==
        contractAddresses[chain.id].DebtToken
      ) {
        // Get loan details
        const loan = await loanCenter.getLoan(
          BigNumber.from(addressNFTs[i].tokenId).toNumber()
        );
        console.log("loan", loan);

        const debt = await loanCenter.getLoanDebt(
          BigNumber.from(addressNFTs[i].tokenId).toNumber()
        );

        console.log("debt", debt);

        // Get NFT images
        var tokenImages = [];
        for (let j = 0; j < loan.nftTokenIds.length; j++) {
          tokenImages.push(
            await getNFTImage(loan.nftAsset, loan.nftTokenIds[j], chain.id)
          );
        }

        // Get the max debt for the loan
        const tokenPrice = (
          await getAssetsPrice(loan.nftAsset, loan.nftTokenIds, chain.id)
        ).price;
        const maxDebt = await loanCenter.getLoanMaxDebt(
          BigNumber.from(addressNFTs[i].tokenId).toNumber(),
          tokenPrice
        );

        // Save relevant loan info
        updatedLoans.push({
          loanId: BigNumber.from(addressNFTs[i].tokenId).toNumber(),
          tokenName: addressNFTs[i].title,
          tokenAddress: loan.nftAsset,
          tokenIds: loan.nftTokenIds,
          tokenImages: tokenImages,
          amount: loan.amount,
          debt: debt,
          tokenPrice: tokenPrice,
          maxDebt: maxDebt,
        });
      } else if (
        updatedSupportedNFTs[getAddress(addressNFTs[i].contract.address)] !=
        undefined
      ) {
        // Add asset to supported assets
        updatedSupportedAssets.push(addressNFTs[i]);
      } else {
        // Get max 5 unsupported assets
        if (updatedUnsupportedAssets.length < 5) {
          updatedUnsupportedAssets.push(addressNFTs[i]);
        }
      }
    }
    console.log("updatedLoans:", updatedLoans);
    console.log("updatedSupportedAssets:", updatedSupportedAssets);
    console.log("updatedUnsupportedAssets:", updatedUnsupportedAssets);

    setLoans(updatedLoans);
    setSupportedAssets(updatedSupportedAssets);
    setUnsupportedAssets(updatedUnsupportedAssets);
    setSearchResults(updatedSupportedAssets);
    setSearchPageData(updatedSupportedAssets.slice(0, SEARCH_PAGE_SIZE));

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

  useEffect(() => {
    async function getSelectedCollectionNFTs() {
      var selectedCollectionNFTs = [];
      const addressCollectionNFTs = await getAddressNFTs(
        address,
        selectedCollection,
        chain.id
      );

      console.log("addressCollectionNFTs", addressCollectionNFTs);
      console.log("selectedCollection", selectedCollection);

      if (selectedCollection == "") {
        for (let i = 0; i < addressCollectionNFTs.length; i++) {
          if (
            supportedNFTs[
              getAddress(addressCollectionNFTs[i].contract.address)
            ] != undefined
          ) {
            selectedCollectionNFTs.push(addressCollectionNFTs[i]);
          }
        }
      } else {
        selectedCollectionNFTs = addressCollectionNFTs;
      }

      setSupportedAssets(selectedCollectionNFTs);
      setSearchResults(selectedCollectionNFTs);
      setSearchPageData(selectedCollectionNFTs.slice(0, SEARCH_PAGE_SIZE));
    }
    if (selectedCollection != undefined) {
      getSelectedCollectionNFTs();
    }
  }, [selectedCollection]);

  const handleUnsupportedAssetClick = async function (assetName) {
    dispatch({
      type: "warning",
      message: assetName + " is not supported by leNFT.",
      title: "Unsupported Asset",
      position: "bottomL",
    });
  };

  const handleSearchPageChange = (_event, value) => {
    console.log("setSearchPage", value);
    setSearchPage(value);
    setSearchPageData(
      searchResults.slice(
        SEARCH_PAGE_SIZE * (value - 1),
        SEARCH_PAGE_SIZE * value
      )
    );
  };

  function handleSearchInputChange(e) {
    console.log("search input:", e.target.value);
    setSearchInputString(e.target.value);

    function searchFilter(asset) {
      const stringToMatch =
        asset.name + " " + BigNumber.from(asset.tokenId).toString();

      console.log("stringToMatch", stringToMatch);

      return stringToMatch.toLowerCase().includes(e.target.value.toLowerCase());
    }

    const updatedSearchResults = supportedAssets.filter(searchFilter);
    console.log("updatedSearchResults", updatedSearchResults);
    setSearchResults(updatedSearchResults);
    setSearchPageData(updatedSearchResults.slice(0, SEARCH_PAGE_SIZE));
    setSearchPage(1);
  }

  return (
    <div>
      {loadingUI ? (
        <div className="flex flex-col items-center justify-center m-16">
          <div className="flex flex-row m-2">
            <Typography variant="subtitle3">
              <Box
                sx={{
                  fontFamily: "Monospace",
                }}
              >
                <div className="text-md md:text-2xl justify-center text-center">
                  {"Loading your wallet & loans..."}
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
          <div className="flex flex-col m-4 sm:m-8 md:mx-16 rounded-3xl p-2 bg-black/5 shadow-lg">
            <div className="p-8">
              <Box
                sx={{
                  fontFamily: "Monospace",
                  letterSpacing: 14,
                }}
              >
                <div className="text-xl text-center md:text-left md:text-4xl">
                  My Loans
                </div>
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
                  {isConnected
                    ? "No active loans found."
                    : "Connect wallet to view loans."}
                </Box>
              </div>
            ) : (
              <div className="flex grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
                          {loan.tokenImages[0] ? (
                            <Image
                              loader={() => loan.tokenImages[0]}
                              src={loan.tokenImages[0]}
                              height="200"
                              width="200"
                              className="rounded-3xl"
                            />
                          ) : (
                            <div className="flex flex-col w-[100px] h-[100px] text-center items-center justify-center">
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
                                content={
                                  <Box
                                    sx={{
                                      fontFamily: "Monospace",
                                      fontSize: "caption",
                                    }}
                                  >
                                    {
                                      "The relation between the debt and the collateral's value. When it reaches 0 the loan can be liquidated."
                                    }
                                  </Box>
                                }
                                position="left"
                                maxWidth={100}
                                arrowSize={1}
                                move={80}
                                moveBody={-110}
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
                                loan.maxDebt
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
                      token_ids={selectedLoan.tokenIds}
                      token_images={selectedLoan.tokenImages}
                      updateUI={setupUI}
                    />
                  </StyledModal>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col m-4 mt-8 sm:m-8 md:mx-16 rounded-3xl p-2 bg-black/5 shadow-lg">
            <div className="flex flex-col md:flex-row justify-between p-8 pb-0">
              {selectedAssets.length == 0 ? (
                <div className="flex flex-col">
                  <Box
                    sx={{
                      fontFamily: "Monospace",
                      letterSpacing: 14,
                    }}
                  >
                    <div className="text-xl text-center md:text-left md:text-4xl">
                      Wallet
                    </div>
                  </Box>
                  <div className="mt-4">
                    <Box
                      sx={{
                        fontFamily: "Monospace",
                      }}
                    >
                      <div className="text-sm text-center md:text-left md:text-md">
                        {isConnected
                          ? "You can use " +
                            supportedAssets.length +
                            " of your NFTs to borrow." +
                            (supportedAssets.length > 0 &&
                              "Just click on them!")
                          : "Connect wallet to view your NFTs."}
                      </div>
                    </Box>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col">
                  <Box
                    sx={{
                      fontFamily: "Monospace",
                    }}
                    className="mt-4"
                  >
                    <div className="text-xl text-center md:text-left md:text-2xl">
                      {"Selected " +
                        selectedAssets.length +
                        " " +
                        supportedAssets.find(
                          (element) =>
                            element.contract.address == selectedCollection
                        ).contract.name +
                        "s"}
                    </div>
                  </Box>
                  <Button
                    onClick={function () {
                      setSelectedAssets([]);
                      setSelectedCollection("");
                    }}
                  >
                    <Box
                      sx={{
                        fontFamily: "Monospace",
                      }}
                      className="mt-1 text-center md:text-left"
                    >
                      {"(unselect all)"}
                    </Box>
                  </Button>
                </div>
              )}
              <div className="flex flex-col m-4 items-center justify-center">
                <Input
                  onBlur={function noRefCheck() {}}
                  onChange={handleSearchInputChange}
                  prefixIcon={<Search />}
                  type="text"
                />
                <div className="m-2">
                  <Box
                    sx={{
                      color: "gray",
                      fontFamily: "Monospace",
                    }}
                  >
                    <div className="text-sm text-center h-[20px]">
                      {searchInputString != "" &&
                        searchResults.length +
                          " results for '" +
                          searchInputString +
                          "'"}
                    </div>
                  </Box>
                </div>
              </div>
            </div>
            {selectedAssets.length != 0 && (
              <div className="flex flex-row m-4 mt-0 md:mt-4">
                <Button
                  primary
                  fill="horizontal"
                  size="large"
                  color="#063970"
                  onClick={async function () {
                    setVisibleCreateLoanModal(true);
                  }}
                  label={
                    <div className="flex justify-center">
                      <Box
                        sx={{
                          fontFamily: "Monospace",
                          fontSize: "subtitle2.fontSize",
                          fontWeight: "bold",
                          letterSpacing: 2,
                        }}
                      >
                        {"Borrow with " + selectedAssets.length + " NFTs"}
                      </Box>
                    </div>
                  }
                />
              </div>
            )}
            {searchPageData.length != 0 && (
              <div>
                <div className="flex flex-row grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {searchPageData.map((data) => (
                    <div
                      key={data.tokenId + data.contract.address}
                      className="flex m-4 items-center justify-center max-w-[300px]"
                    >
                      <Card
                        sx={{
                          borderRadius: 4,
                          background: selectedAssets.includes(
                            BigNumber.from(data.tokenId).toNumber()
                          )
                            ? "linear-gradient(to right bottom, #fccb90 0%, #d57eeb 100%)"
                            : "linear-gradient(to right bottom, #eff2ff, #f0e5e9)",
                        }}
                      >
                        <CardActionArea
                          onClick={function () {
                            var newSelectedAssets = selectedAssets.slice();
                            var newSelectedAssetsImages =
                              selectedAssetsImages.slice();
                            console.log(
                              "newSelectedAssets1: ",
                              newSelectedAssets
                            );
                            // If the asset is already selected, remove it from the array
                            if (
                              selectedAssets.includes(
                                BigNumber.from(data.tokenId).toNumber()
                              )
                            ) {
                              const index = newSelectedAssets.indexOf(
                                BigNumber.from(data.tokenId).toNumber()
                              );
                              newSelectedAssets.splice(index, 1);
                              newSelectedAssetsImages.splice(index, 1);

                              if (newSelectedAssets.length == 0) {
                                setSelectedCollection("");
                              }
                            } else {
                              if (selectedAssets.length == 0) {
                                setSelectedCollection(data.contract.address);
                              }

                              // If the asset is not selected, add it to the array
                              newSelectedAssets.push(
                                BigNumber.from(data.tokenId).toNumber()
                              );
                              newSelectedAssetsImages.push(
                                data.media[0] ? data.media[0].gateway : ""
                              );
                            }
                            console.log(
                              "newSelectedAssets2: ",
                              newSelectedAssets
                            );
                            setSelectedAssetsImages(newSelectedAssetsImages);
                            setSelectedAssets(newSelectedAssets);
                          }}
                        >
                          <CardContent>
                            {data.tokenUri ? (
                              <div className="flex flex-col items-center">
                                <Image
                                  loader={() => data.tokenUri.gateway}
                                  alt="Supported Asset"
                                  src={data.tokenUri.gateway}
                                  height="200"
                                  width="200"
                                  className="rounded-2xl"
                                  loading="eager"
                                />
                              </div>
                            ) : (
                              <div className="flex flex-col w-[130px] h-[130px] text-center items-center justify-center">
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
                                fontWeight: "bold",
                              }}
                            >
                              <div className="flex flex-col mt-2 items-center text-center">
                                <div>
                                  {data.contract.symbol
                                    ? data.contract.symbol
                                    : "No Name Found"}
                                </div>
                                <div>
                                  {"#" +
                                    BigNumber.from(data.tokenId).toNumber()}
                                </div>
                              </div>
                            </Box>
                          </CardContent>
                        </CardActionArea>
                      </Card>
                    </div>
                  ))}
                </div>
                <div className="flex flex-row justify-center my-2">
                  <Pagination
                    count={Math.ceil(searchResults.length / SEARCH_PAGE_SIZE)}
                    page={searchPage}
                    onChange={handleSearchPageChange}
                  />
                </div>
              </div>
            )}
            <StyledModal
              hasFooter={false}
              isVisible={visibleCreateLoanModal}
              onCloseButtonPressed={function () {
                setVisibleCreateLoanModal(false);
              }}
            >
              <CreateLoan
                setVisibility={setVisibleCreateLoanModal}
                token_address={selectedCollection}
                token_ids={selectedAssets}
                token_images={selectedAssetsImages}
                updateUI={setupUI}
              />
            </StyledModal>
            {supportedAssets.length != 0 && unsupportedAssets.length != 0 && (
              <div className="m-4 items-center justify-center">
                <Divider variant="middle" />
              </div>
            )}
            {unsupportedAssets.length != 0 && (
              <div className="flex flex-row grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1">
                {unsupportedAssets.map((unsupportedAsset, index) => (
                  <div
                    key={
                      unsupportedAsset.tokenId +
                      unsupportedAsset.contract.address
                    }
                    className="flex m-4 items-center justify-center max-w-[120px]"
                  >
                    {index == 4 && unsupportedAssets.length == 5 ? (
                      <div className="flex items-center">
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
                            handleUnsupportedAssetClick(unsupportedAsset.name)
                          }
                        >
                          <CardContent>
                            {unsupportedAsset.media[0] ? (
                              <div className="flex flex-col items-center">
                                <Image
                                  loader={() =>
                                    unsupportedAsset.media[0].gateway
                                  }
                                  src={unsupportedAsset.media[0].gateway}
                                  height="120"
                                  width="120"
                                  className="rounded-2xl"
                                />
                              </div>
                            ) : (
                              <Box
                                sx={{
                                  fontFamily: "Monospace",
                                  fontSize: 12,
                                }}
                                className="flex flex-col w-[120px] py-8"
                              >
                                No Image
                              </Box>
                            )}
                            <Box
                              sx={{
                                fontFamily: "Monospace",
                                fontSize: "subtitle2.fontSize",
                                fontWeight: "bold",
                              }}
                            >
                              <div className="flex flex-col mt-4 items-center text-center">
                                <div>{unsupportedAsset.contract.symbol}</div>
                                <div>
                                  {"#" +
                                    BigNumber.from(
                                      unsupportedAsset.tokenId
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

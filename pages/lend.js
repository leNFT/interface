import styles from "../styles/Home.module.css";
import contractAddresses from "../contractAddresses.json";
import { getAssetPrice } from "../helpers/getAssetPrice.js";
import { getNFTImage } from "../helpers/getNFTImage.js";
import { getAddressNFTs } from "../helpers/getAddressNFTs.js";
import { getLendingNFTCollections } from "../helpers/getLendingNFTCollections.js";
import { useState, useEffect } from "react";
import Pagination from "@mui/material/Pagination";
import { useNotification, Tooltip, Loading, Input } from "@web3uikit/core";
import { HelpCircle, Search } from "@web3uikit/icons";
import { BigNumber } from "@ethersproject/bignumber";
import Borrow from "../components/lending/Borrow";
import RepayLoan from "../components/lending/RepayLoan";
import Image from "next/image";
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

export default function Lend() {
  const SEARCH_PAGE_SIZE = 8;
  const [loadingUI, setLoadingUI] = useState(true);
  const [loans, setLoans] = useState([]);
  const [supportedAssets, setSupportedAssets] = useState([]);
  const [searchPage, setSearchPage] = useState(0);
  const [searchResults, setSearchResults] = useState([]);
  const [searchPageData, setSearchPageData] = useState([]);
  const [searchInputString, setSearchInputString] = useState("");
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

    // Get user NFT assets
    const addressNFTs = await getAddressNFTs(address, "", chain.id);
    const supportedNFTs = await getLendingNFTCollections(chain.id);
    console.log("supportedNFTs:", supportedNFTs);
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
          BigNumber.from(addressNFTs[i].id.tokenId).toNumber()
        );
        console.log("loan", loan);

        const debt = await loanCenter.getLoanDebt(
          BigNumber.from(addressNFTs[i].id.tokenId).toNumber()
        );

        console.log("debt", debt);

        const tokenImage = await getNFTImage(
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
          tokenImage: tokenImage,
          amount: loan.amount,
          boost: loan.boost,
          debt: debt,
          tokenPrice: (
            await getAssetPrice(loan.nftAsset, loan.nftTokenId, chain.id)
          ).price,
          maxLTV: loan.maxLTV,
        });
      } else if (
        supportedNFTs[getAddress(addressNFTs[i].contract.address)] != undefined
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
        asset.contractMetadata.name +
        " " +
        BigNumber.from(asset.id.tokenId).toString();

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
    <div className={styles.container}>
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
                  {"Loading loans and NFTs..."}
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
                          {loan.tokenImage ? (
                            <Image
                              loader={() => loan.tokenImage}
                              src={loan.tokenImage}
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
                                content="The relation between the debt and the collateral's value. When it reaches 0 the loan can be liquidated."
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
                      token_image={selectedLoan.tokenImage}
                      updateUI={setupUI}
                    />
                  </StyledModal>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col mt-8 rounded-3xl m-2 p-2 bg-black/5 shadow-lg">
            <div className="flex flex-col md:flex-row justify-between p-8 pb-4">
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
                      {"You can use " +
                        supportedAssets.length +
                        " of your NFTs to borrow."}
                    </div>
                  </Box>
                </div>
              </div>
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
            {searchPageData.length != 0 && (
              <div>
                <div className="flex flex-row grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {searchPageData.map((data) => (
                    <div
                      key={data.id.tokenId + data.contract.address}
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
                            setSelectedAsset(data);
                            setVisibleAssetModal(true);
                          }}
                        >
                          <CardContent>
                            {data.metadata.image ? (
                              <div className="flex flex-col items-center">
                                <Image
                                  loader={() => data.media[0].gateway}
                                  alt="Supported Asset"
                                  src={data.media[0].gateway}
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
                                    fontSize: "caption.fontSize",
                                  }}
                                >
                                  Image Unavailable
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
                                <div>{data.contractMetadata.name}</div>
                                <div>
                                  {"#" +
                                    BigNumber.from(data.id.tokenId).toNumber()}
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
            {selectedAsset && (
              <StyledModal
                hasFooter={false}
                isVisible={visibleAssetModal}
                onCloseButtonPressed={function () {
                  setVisibleAssetModal(false);
                }}
              >
                <Borrow
                  setVisibility={setVisibleAssetModal}
                  token_address={getAddress(selectedAsset.contract.address)}
                  token_id={BigNumber.from(selectedAsset.id.tokenId).toNumber()}
                  token_image={selectedAsset.metadata.image}
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
                            {unsupportedAsset.metadata.image ? (
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
                              <div className="flex flex-col w-[120px] h-[120px] text-center items-center justify-center">
                                <Box
                                  sx={{
                                    fontFamily: "Monospace",
                                    fontSize: "caption.fontSize",
                                  }}
                                >
                                  Image Unavailable
                                </Box>
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

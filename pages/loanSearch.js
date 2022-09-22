import styles from "../styles/Home.module.css";
import { getAssetPrice } from "../helpers/getAssetPrice.js";
import { getNFTImage } from "../helpers/getNFTImage.js";
import { getNFTs } from "../helpers/getNFTs.js";
import contractAddresses from "../contractAddresses.json";
import { BigNumber } from "@ethersproject/bignumber";
import { getAddress } from "@ethersproject/address";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import loanCenterContract from "../contracts/LoanCenter.json";
import nftOracleContract from "../contracts/NFTOracle.json";
import { useState, useEffect } from "react";
import { useAccount, useNetwork } from "wagmi";
import { calculateHealthLevel } from "../helpers/healthLevel";
import { Illustration, Loading, Typography, Tooltip } from "@web3uikit/core";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import CardContent from "@mui/material/CardContent";
import { CardActionArea } from "@mui/material";
import { HelpCircle } from "@web3uikit/icons";
import Image from "next/image";
import LinearProgressWithLabel from "../components/LinearProgressWithLabel";
import Divider from "@mui/material/Divider";
import Liquidate from "../components/Liquidate";
import { useContract, useProvider } from "wagmi";
import StyledModal from "../components/StyledModal";

export default function LoanSearch() {
  const [collectionLoans, setCollectionLoans] = useState([]);
  const [maxCollateralization, setMaxCollateralization] = useState("0");
  const [loadingCollectionLoans, setLoadingCollectionLoans] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState();
  const [visibleLiquidateModal, setVisibleLiquidateModal] = useState(false);
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const provider = useProvider();
  const addresses =
    chain && chain.id in contractAddresses
      ? contractAddresses[chain.id]
      : contractAddresses["1"];
  const [collections, setCollections] = useState([]);

  const loanCenter = useContract({
    contractInterface: loanCenterContract.abi,
    addressOrName: addresses.LoanCenter,
    signerOrProvider: provider,
  });

  const nftOracle = useContract({
    contractInterface: nftOracleContract.abi,
    addressOrName: addresses.NFTOracle,
    signerOrProvider: provider,
  });

  // Get active loans for the selected collection
  async function getCollectionLoans(selectedCollection) {
    console.log("Getting collection loans...", selectedCollection);
    var updatedCollectionLoans = [];

    //Get the max collaterization for the collection
    const updatedMaxCollateralization =
      await nftOracle.getCollectionMaxCollaterization(selectedCollection);
    setMaxCollateralization(updatedMaxCollateralization.toString());
    console.log("maxCollateralization", updatedMaxCollateralization.toString());

    // Get the token ids for the selected collection
    const collectionNFTs = await getNFTs(
      addresses.LoanCenter,
      selectedCollection,
      chain.id
    );

    console.log("collectionNFTs", collectionNFTs);

    for (let i = 0; i < collectionNFTs.length; i++) {
      // Get the loan ID of each NFT
      const loanId = await loanCenter.getNFTLoanId(
        collectionNFTs[i].contract.address,
        BigNumber.from(collectionNFTs[i].id.tokenId).toNumber()
      );

      // Get the debt associated with this loan
      const loanDebt = (await loanCenter.getLoanDebt(loanId)).toString();

      // Get loan details
      const loan = await loanCenter.getLoan(loanId);
      console.log("loan", loan);

      // Get checksumed token address
      collectionNFTs[i].contract.address = getAddress(
        collectionNFTs[i].contract.address
      );

      // Find the valuation given by the protocol to this specific asset
      const assetPrice = await getAssetPrice(
        contractAddresses[chain.id].SupportedAssets.find(
          (collection) =>
            collection.address == collectionNFTs[i].contract.address
        ).address,
        BigNumber.from(collectionNFTs[i].id.tokenId).toNumber()
      );

      //Get token URI for image
      const tokenURI = await getNFTImage(
        collectionNFTs[i].contract.address,
        BigNumber.from(collectionNFTs[i].id.tokenId).toNumber(),
        chain.id
      );

      // Add new loan to update array
      updatedCollectionLoans.push({
        loanId: loanId,
        debt: loanDebt,
        maxLTV: loan.maxLTV,
        boost: loan.boost,
        tokenAddress: collectionNFTs[i].contract.address,
        tokenId: BigNumber.from(collectionNFTs[i].id.tokenId).toNumber(),
        tokenURI: tokenURI,
        price: assetPrice,
      });
    }
    // Update active loans state array
    console.log("updatedCollectionLoans", updatedCollectionLoans);
    setCollectionLoans(updatedCollectionLoans);
    setLoadingCollectionLoans(false);
  }

  // Runs once
  useEffect(() => {
    if (isConnected) {
      setLoadingCollectionLoans(true);
      //Fill the collections with the supported assets
      var updatedCollections = [];
      console.log("SupportedAssets", addresses.SupportedAssets);
      for (var asset in addresses.SupportedAssets) {
        updatedCollections.push({
          label: addresses.SupportedAssets[asset].name,
          address: addresses.SupportedAssets[asset].address,
        });
        console.log("asset", asset);
      }
      console.log("updatedCollections", updatedCollections);
      setCollections(updatedCollections);

      // Get the default collection loans
      if (collections.length > 0) {
        getCollectionLoans(updatedCollections[0].address);
      } else {
        setLoadingCollectionLoans(false);
      }
    }
  }, [isConnected, address, chain]);

  function handleCollectionChange(_event, value) {
    const collectionAddress = collections.find(
      (collection) => collection.label == value
    );
    if (collectionAddress) {
      setLoadingCollectionLoans(true);
      getCollectionLoans(collectionAddress.address);
    } else {
      setCollectionLoans([]);
      setMaxCollateralization("0");
    }
  }

  return (
    <div className={styles.container}>
      <StyledModal
        hasFooter={false}
        isVisible={visibleLiquidateModal}
        width="50%"
        onCloseButtonPressed={function () {
          setVisibleLiquidateModal(false);
        }}
      >
        <Liquidate
          setVisibility={setVisibleLiquidateModal}
          loan={selectedLoan}
          maxCollateralization={maxCollateralization}
        />
      </StyledModal>
      <div className="flex flex-col md:flex-row items-center justify-center">
        <div className="flex flex-col items-center justify-center">
          <Autocomplete
            disablePortal
            ListboxProps={{
              style: {
                backgroundColor: "rgb(253, 241, 244)",
                fontFamily: "Monospace",
              },
            }}
            options={collections}
            sx={{ minWidth: 380 }}
            isOptionEqualToValue={(option, value) =>
              option.address === value.address
            }
            onInputChange={handleCollectionChange}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search NFT Collections"
                sx={{
                  "& label": {
                    paddingLeft: (theme) => theme.spacing(2),
                    fontFamily: "Monospace",
                  },
                  "& input": {
                    paddingLeft: (theme) => theme.spacing(3.5),
                    fontFamily: "Monospace",
                  },
                  "& fieldset": {
                    paddingLeft: (theme) => theme.spacing(2.5),
                    borderRadius: "25px",
                    fontFamily: "Monospace",
                  },
                }}
              />
            )}
          />
        </div>
        <div className="flex flex-col border-2 rounded-3xl my-8 md:my-0 md:ml-8 p-1">
          <div className="flex flex-row">
            <div className="flex flex-col m-4">
              <div className="flex flex-row">
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "subtitle1.fontSize",
                    fontWeight: "bold",
                  }}
                >
                  Max LTV
                </Box>
              </div>
              <div className="flex flex-row">
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "subtitle1.fontSize",
                  }}
                >
                  {maxCollateralization / 100}%
                </Box>
              </div>
            </div>
            <Divider orientation="vertical" variant="middle" flexItem />
            <div className="flex flex-col m-4">
              <div className="flex flex-row">
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "subtitle1.fontSize",
                    fontWeight: "bold",
                  }}
                >
                  Active Loans
                </Box>
              </div>
              <div className="flex flex-row">
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "subtitle1.fontSize",
                  }}
                >
                  {collectionLoans.length}
                </Box>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center">
        {loadingCollectionLoans ? (
          <div className="flex m-36">
            <Loading size={42} spinnerColor="#2E7DAF" spinnerType="loader" />
          </div>
        ) : collectionLoans.length != 0 ? (
          <div className="flex flex-col rounded-3xl m-2 p-2 bg-black/5 shadow-lg">
            <div className="flex flex-row grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {collectionLoans.map((collectionLoan) => (
                <div
                  key={collectionLoan.loanId}
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
                        setSelectedLoan(collectionLoan);
                        setVisibleLiquidateModal(true);
                      }}
                    >
                      <CardContent>
                        {collectionLoan.tokenURI ? (
                          <div className="flex flex-col items-center">
                            <Image
                              loader={() => collectionLoan.tokenURI}
                              src={collectionLoan.tokenURI}
                              height="200"
                              width="200"
                              unoptimized={true}
                              className="rounded-3xl"
                            />
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center">
                            <Illustration
                              height="140px"
                              logo="chest"
                              width="100%"
                            />
                            Loading...
                          </div>
                        )}
                        <div className="flex flex-row mt-8">
                          <Typography variant="caption14">Asset ID</Typography>
                        </div>
                        <div className="flex flex-row  items-center">
                          <Typography variant="caption16">
                            #{collectionLoan.tokenId}
                          </Typography>
                        </div>
                        <div className="flex flex-row mt-6">
                          <div className="flex flex-col">
                            <Typography variant="caption14">
                              Health Level
                            </Typography>
                          </div>
                          <div className="flex flex-col ml-1">
                            <Tooltip
                              content="Represents the relation between the debt and the collateral's value. When it reaches 0 the loan can be liquidated."
                              position="top"
                              minWidth={300}
                            >
                              <HelpCircle fontSize="14px" color="#000000" />
                            </Tooltip>
                          </div>
                        </div>
                        <div>
                          <LinearProgressWithLabel
                            color="success"
                            value={calculateHealthLevel(
                              collectionLoan.debt,
                              BigNumber.from(collectionLoan.maxLTV)
                                .add(collectionLoan.boost)
                                .mul(collectionLoan.price)
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
            </div>
          </div>
        ) : (
          <div className="flex mb-32 mt-16 items-center justify-center">
            {collections.length != 0 ? (
              <Box
                sx={{
                  fontFamily: "Monospace",
                  fontSize: "h6.fontSize",
                }}
              >
                Please select a supported collection with active loans.
              </Box>
            ) : (
              <Box
                sx={{
                  fontFamily: "Monospace",
                  fontSize: "h6.fontSize",
                }}
              >
                leNFT does not support any NFT collections (yet).
              </Box>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import styles from "../styles/Home.module.css";
import { getTokenPrice } from "../helpers/getTokenPrice.js";
import { getNFTImage } from "../helpers/getNFTImage.js";
import {
  getNewRequestID,
  getTokenPriceSig,
} from "../helpers/getTokenPriceSig.js";
import contractAddresses from "../contractAddresses.json";
import { formatUnits } from "@ethersproject/units";
import { BigNumber } from "@ethersproject/bignumber";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import loanCenterContract from "../contracts/LoanCenter.json";
import marketContract from "../contracts/Market.json";
import nftOracleContract from "../contracts/NFTOracle.json";
import { useMoralisWeb3Api, useWeb3Contract, useMoralis } from "react-moralis";
import { useState, useEffect } from "react";
import { calculateHealthLevel } from "../helpers/healthLevel";
import {
  useNotification,
  Illustration,
  Loading,
  Typography,
  Button,
  Tooltip,
} from "@web3uikit/core";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import CardContent from "@mui/material/CardContent";
import { HelpCircle } from "@web3uikit/icons";
import Image from "next/image";
import erc20 from "../contracts/erc20.json";
import LinearProgressWithLabel from "../components/LinearProgressWithLabel";

function isLoanLiquidatable(debt, maxCollateralization, price) {
  return BigNumber.from(debt).lt(
    BigNumber.from(maxCollateralization).mul(price).div(10000)
  );
}

export default function LoanSearch() {
  const [collectionLoans, setCollectionLoans] = useState([]);
  const [allowance, setAllowance] = useState("0");
  const [maxCollateralization, setMaxCollateralization] = useState("0");
  const [loadingCollectionLoans, setLoadingCollectionLoans] = useState(true);
  const { isWeb3Enabled, chainId, account } = useMoralis();
  const dispatch = useNotification();
  const addresses =
    chainId in contractAddresses
      ? contractAddresses[chainId]
      : contractAddresses["0x1"];
  const [collections, setCollections] = useState([]);
  const Web3Api = useMoralisWeb3Api();

  const { runContractFunction: getLoanDebt } = useWeb3Contract();
  const { runContractFunction: getNFTLoanId } = useWeb3Contract();
  const { runContractFunction: getCollectionMaxCollateralization } =
    useWeb3Contract();
  const { runContractFunction: liquidate } = useWeb3Contract();
  const { runContractFunction: getAllowance } = useWeb3Contract();
  const { runContractFunction: approve } = useWeb3Contract();

  // Get active loans for the selected collection
  async function getCollectionLoans(selectedCollection) {
    console.log("Getting collection loans...", selectedCollection);
    var collectionNFTs;
    var updatedCollectionLoans = [];

    //Get the max collaterization for the collection
    const getMaxCollateralizationOptions = {
      abi: nftOracleContract.abi,
      contractAddress: addresses.NFTOracle,
      functionName: "getCollectionMaxCollaterization",
      params: {
        collection: selectedCollection,
      },
    };
    const updatedMaxCollateralization = await getCollectionMaxCollateralization(
      {
        onError: (error) => console.log(error),
        params: getMaxCollateralizationOptions,
      }
    );
    setMaxCollateralization(updatedMaxCollateralization.toString());
    console.log("maxCollateralization", updatedMaxCollateralization.toString());

    // Get the token ids for the selected collection
    const options = {
      chain: chainId,
      address: addresses.LoanCenter,
      token_address: selectedCollection,
      limit: 10,
    };
    const collectionNFTsResponse = await Web3Api.account.getNFTsForContract(
      options
    );
    collectionNFTs = collectionNFTsResponse.result;

    for (let i = 0; i < collectionNFTs.length; i++) {
      // Get the loan ID of each NFT
      const getLoanIdOptions = {
        abi: loanCenterContract.abi,
        contractAddress: addresses.LoanCenter,
        functionName: "getNFTLoanId",
        params: {
          nftAddress: collectionNFTs[i].token_address,
          nftTokenID: collectionNFTs[i].token_id,
        },
      };
      const loanId = await getNFTLoanId({
        onError: (error) => console.log(error),
        params: getLoanIdOptions,
      });

      const getLoanDebtOptions = {
        abi: loanCenterContract.abi,
        contractAddress: addresses.LoanCenter,
        functionName: "getLoanDebt",
        params: {
          loanId: loanId,
        },
      };
      const debt = await getLoanDebt({
        onError: (error) => console.log(error),
        params: getLoanDebtOptions,
      });

      const tokenPrice = await getTokenPrice(
        // Get checksumed token adress
        contractAddresses[chainId].SupportedAssets.find(
          (collection) =>
            collection.address.toLowerCase() == collectionNFTs[i].token_address
        ).address,
        collectionNFTs[i].token_id
      );

      //Get token URI for image
      const tokenURI = await getNFTImage(
        collectionNFTs[i].token_address,
        collectionNFTs[i].token_id,
        chainId
      );

      // Add new loan to update array
      updatedCollectionLoans.push({
        loanId: loanId,
        debt: debt.toString(),
        tokenAddress: collectionNFTs[i].token_address,
        tokenId: collectionNFTs[i].token_id,
        tokenURI: tokenURI,
        price: tokenPrice,
      });
    }
    // Update active loans state array
    setCollectionLoans(updatedCollectionLoans);
    setLoadingCollectionLoans(false);
  }

  async function getWETHAllowance() {
    const getAllowanceOptions = {
      abi: erc20,
      contractAddress: addresses["WETH"].address,
      functionName: "allowance",
      params: {
        _owner: account,
        _spender: addresses.Market,
      },
    };

    const allowance = await getAllowance({
      onError: (error) => console.log(error),
      params: getAllowanceOptions,
    });

    console.log("Got allowance:", allowance);

    setAllowance(allowance.toString());
  }

  // Runs once
  useEffect(() => {
    if (isWeb3Enabled) {
      getWETHAllowance();
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
  }, [isWeb3Enabled, account, chainId]);

  function handleCollectionChange(_event, value) {
    console.log("value", value);
    console.log("collections", collections);
    const collectionAddress = collections.find(
      (collection) => collection.label == value
    );
    if (collectionAddress) {
      setLoadingCollectionLoans(true);
      getCollectionLoans(collectionAddress.address);
    }
  }

  const handleLiquidateSuccess = async function () {
    dispatch({
      type: "success",
      message: "Please wait for transaction confirmation.",
      title: "Liquidation Successful",
      position: "topR",
    });
  };

  const handleApprovalSuccess = async function () {
    dispatch({
      type: "success",
      message: "Please wait for transaction confirmation.",
      title: "Approval Successful!",
      position: "topR",
    });
  };

  return (
    <div className={styles.container}>
      <div className="flex flex-row items-center justify-center">
        <div className="flex flex-col items-center justify-center">
          <Autocomplete
            disablePortal
            options={collections}
            sx={{ minWidth: 400 }}
            isOptionEqualToValue={(option, value) =>
              option.address === value.address
            }
            onInputChange={handleCollectionChange}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search NFT Collections"
                sx={{
                  "& label": { paddingLeft: (theme) => theme.spacing(2) },
                  "& input": { paddingLeft: (theme) => theme.spacing(3.5) },
                  "& fieldset": {
                    paddingLeft: (theme) => theme.spacing(2.5),
                    borderRadius: "25px",
                  },
                }}
              />
            )}
          />
        </div>
        <div className="flex flex-col border-2 rounded-lg m-2 ml-8 p-1">
          <div className="flex flex-row">
            <div className="flex flex-col m-2">
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
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center">
        {loadingCollectionLoans ? (
          <div className="flex m-8">
            <Loading size={16} spinnerColor="#2E7DAF" spinnerType="wave" />
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
                          {collectionLoan.tokenId}
                        </Typography>
                      </div>
                      <div className="flex flex-row mt-2">
                        <Typography variant="caption14">Debt</Typography>
                      </div>
                      <div className="flex flex-row  items-center">
                        <Typography variant="caption16">
                          {formatUnits(collectionLoan.debt, 18)} WETH
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
                            BigNumber.from(maxCollateralization)
                              .mul(collectionLoan.price)
                              .div(10000)
                              .toString()
                          )}
                        />
                      </div>
                      <div className="flex flex-row m-4 items-center justify-center">
                        <div className="flex flex-col">
                          {BigNumber.from(collectionLoan.price)
                            .mul(BigNumber.from(82))
                            .div(BigNumber.from(100))
                            .lt(BigNumber.from(allowance)) ? (
                            <Button
                              disabled={isLoanLiquidatable(
                                collectionLoan.debt,
                                maxCollateralization,
                                collectionLoan.price
                              )}
                              text="Liquidate"
                              theme="colored"
                              type="button"
                              size="small"
                              color="red"
                              radius="5"
                              onClick={async function () {
                                const requestId = getNewRequestID();
                                const priceSig = await getTokenPriceSig(
                                  requestId,
                                  collectionLoan.tokenAddress,
                                  collectionLoan.tokenId,
                                  chainId
                                );
                                const getLiquidateOptions = {
                                  abi: marketContract.abi,
                                  contractAddress: addresses.Market,
                                  functionName: "liquidate",
                                  params: {
                                    loanId: collectionLoan.loanId,
                                    request: requestId,
                                    packet: priceSig,
                                  },
                                };
                                console.log("Liquidation loan", collectionLoan);
                                await liquidate({
                                  onError: (error) => console.log(error),
                                  onSuccess: handleLiquidateSuccess,
                                  params: getLiquidateOptions,
                                });
                              }}
                            />
                          ) : (
                            <Button
                              text="Approve WETH for Liquidation"
                              theme="colored"
                              type="button"
                              size="small"
                              color="red"
                              radius="5"
                              disabled={isLoanLiquidatable(
                                collectionLoan.debt,
                                maxCollateralization,
                                collectionLoan.price
                              )}
                              loadingProps={{
                                spinnerColor: "#000000",
                              }}
                              loadingText="Confirming Approval"
                              onClick={async function () {
                                const approveOptions = {
                                  abi: erc20,
                                  contractAddress: addresses["WETH"].address,
                                  functionName: "approve",
                                  params: {
                                    _spender: addresses.Market,
                                    _value: collectionLoan.price,
                                  },
                                };

                                await approve({
                                  onSuccess: handleApprovalSuccess,
                                  onError: (error) => console.log(error),
                                  params: approveOptions,
                                });
                              }}
                            ></Button>
                          )}
                          {isLoanLiquidatable(
                            collectionLoan.debt,
                            maxCollateralization,
                            collectionLoan.price
                          ) && (
                            <div className="flex justify-center">
                              <Typography variant="caption14">
                                Liquidation condtitions not met
                              </Typography>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
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

import styles from "../styles/Home.module.css";
import contractAddresses from "../contractAddresses.json";
import { formatUnits, parseUnits } from "@ethersproject/units";
import { BigNumber } from "@ethersproject/bignumber";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import loanCenterContract from "../contracts/LoanCenter.json";
import nftOracleContract from "../contracts/NFTOracle.json";
import erc721 from "../contracts/erc721.json";
import { useMoralisWeb3Api, useWeb3Contract, useMoralis } from "react-moralis";
import { useState, useEffect } from "react";
import { Card, Illustration, Loading, Typography, Button } from "web3uikit";
import Image from "next/image";
import LinearProgressWithLabel from "../components/LinearProgressWithLabel";

export default function ActiveLoans() {
  const [collectionLoans, setCollectionLoans] = useState([]);
  const [floorPrice, setFloorPrice] = useState("0");
  const [maxCollateralization, setMaxCollateralization] = useState("0");
  const [loadingCollectionLoans, setLoadingCollectionLoans] = useState(true);
  const { isWeb3Enabled, chainId } = useMoralis();
  const addresses =
    chainId in contractAddresses
      ? contractAddresses[chainId]
      : contractAddresses["0x1"];
  const [collections, setCollections] = useState([
    {
      label: addresses.SupportedAssets[0].name,
      address: addresses.SupportedAssets[0].address,
    },
  ]);
  const Web3Api = useMoralisWeb3Api();

  const { runContractFunction: getLoanDebt } = useWeb3Contract();
  const { runContractFunction: getNFTLoanId } = useWeb3Contract();
  const { runContractFunction: getMaxCollateralization } = useWeb3Contract();
  const { runContractFunction: getFloorPrice } = useWeb3Contract();

  // Get active loans for the selected collection
  async function getCollectionLoans(selectedCollection) {
    console.log("Getting collection loans...");
    var collectionNFTs;
    var updatedCollectionLoans = [];

    //Get the max collaterization for the collection
    const getMaxCollateralizationOptions = {
      abi: nftOracleContract.abi,
      contractAddress: addresses.NFTOracle,
      functionName: "getCollectionMaxCollateralization",
      params: {
        collection: selectedCollection,
      },
    };
    const maxCollateralization = await getMaxCollateralization({
      onError: (error) => console.log(error),
      params: getMaxCollateralizationOptions,
    });
    setMaxCollateralization(maxCollateralization.toString());
    console.log("maxCollateralization", maxCollateralization.toString());

    //Get the max collaterization for the collection
    const getFloorPriceOptions = {
      abi: nftOracleContract.abi,
      contractAddress: addresses.NFTOracle,
      functionName: "getCollectionFloorPrice",
      params: {
        collection: selectedCollection,
      },
    };
    const floorPrice = await getFloorPrice({
      onError: (error) => console.log(error),
      params: getFloorPriceOptions,
    });
    console.log("floorPrice", floorPrice.toString());
    setFloorPrice(floorPrice.toString());

    console.log(
      "ltv",
      formatUnits(
        BigNumber.from(maxCollateralization)
          .mul(BigNumber.from(100))
          .div(BigNumber.from(floorPrice))
      ),
      18
    );

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

    console.log("collectionNFTs:", collectionNFTs);

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

      // Add new loan to update array
      console.log(debt.toString());
      console.log(maxCollateralization.toString());
      updatedCollectionLoans.push({
        loanId: loanId,
        debt: debt.toString(),
        maxCollateralization: maxCollateralization.toString(),
        tokenAddress: collectionNFTs[i].token_address,
        tokenId: collectionNFTs[i].token_id,
        tokenURI: collectionNFTs[i].token_uri,
      });
    }
    // Update active loans state array
    setCollectionLoans(updatedCollectionLoans);
    setLoadingCollectionLoans(false);
  }

  // Runs once
  useEffect(() => {
    if (isWeb3Enabled) {
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
      //setCollections(updatedCollections);
      console.log("updatedCollections", updatedCollections);
      setCollections(updatedCollections);

      // Get the default collection loans
      getCollectionLoans(updatedCollections[0].address);
    }
  }, [isWeb3Enabled]);

  function handleCollectionChange(event, value) {
    console.log("value", value);
    console.log("collections", collections);
    const collectionAddress = collections.find(
      (collection) => collection.label == value
    );
    if (collectionAddress) {
      getCollectionLoans(collectionAddress.address);
    }
  }

  function calculateHealthLevel(debtString, maxCollateralizationString) {
    const maxCollateralization = BigNumber.from(maxCollateralizationString);
    const debt = BigNumber.from(debtString);

    console.log(
      "calculateHealthLevel",
      (maxCollateralization - debt) / maxCollateralization
    );
    return maxCollateralization
      .sub(debt)
      .mul(BigNumber.from(100))
      .div(maxCollateralization)
      .toString();
  }

  return (
    <div className={styles.container}>
      <div className="flex flex-row m-8 items-center justify-center">
        <div className="flex flex-col items-center justify-center">
          <Autocomplete
            disablePortal
            options={collections}
            defaultValue={collections[0]}
            sx={{ width: 500 }}
            isOptionEqualToValue={(option, value) =>
              option.address === value.address
            }
            onInputChange={handleCollectionChange}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Supported Collections"
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
        <div className="flex flex-col border-4 rounded-lg m-8 items-center justify-center">
          <div className="flex flex-row m-2 items-center justify-center">
            floor price: {formatUnits(floorPrice, 18)} wETH
          </div>
          <div className="flex flex-row m-2 items-center justify-center">
            LTV:{" "}
            {floorPrice != "0" &&
              BigNumber.from(maxCollateralization)
                .mul(BigNumber.from(100))
                .div(BigNumber.from(floorPrice))
                .toString()}
            %
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center">
        {loadingCollectionLoans ? (
          <div className="flex m-16">
            <Loading size={16} spinnerColor="#2E7DAF" spinnerType="wave" />
          </div>
        ) : collectionLoans.length != 0 ? (
          <div id="collectionLoansContainer" className="flex p-2">
            {collectionLoans.map((collectionLoan) => (
              <div key={collectionLoan.loanId} className="m-4">
                <Card title={"Loan #" + collectionLoan.loanId}>
                  <div className="flex flex-row p-2">
                    {collectionLoan.tokenURI ? (
                      <div className="flex flex-col items-end gap-2">
                        <Image
                          loader={() => collectionLoan.tokenURI}
                          src={collectionLoan.tokenURI}
                          height="140"
                          width="140"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <Illustration
                          height="140px"
                          logo="chest"
                          width="100%"
                        />
                        Loading...
                      </div>
                    )}
                  </div>
                  <div className="flex flex-row mt-6">
                    <Typography variant="caption12">Health Level</Typography>
                  </div>
                  <div className="justify-center">
                    <LinearProgressWithLabel
                      color="success"
                      value={calculateHealthLevel(
                        collectionLoan.debt,
                        collectionLoan.maxCollateralization
                      )}
                    />
                  </div>
                  <div className="flex flex-row m-6 items-center justify-center">
                    <Button
                      disabled={BigNumber.from(collectionLoan.debt).lt(
                        BigNumber.from(collectionLoan.maxCollateralization)
                      )}
                      text="Liquidate"
                      theme="colored"
                      type="button"
                      size="small"
                      color="red"
                      radius="5"
                      onClick={async function () {}}
                    />
                  </div>
                </Card>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex mb-16 items-center justify-center">
            <Typography variant="body18">
              No active loans in this collection.
            </Typography>
          </div>
        )}
      </div>
    </div>
  );
}

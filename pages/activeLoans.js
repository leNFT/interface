import styles from "../styles/Home.module.css";
import contractAddresses from "../contractAddresses.json";
import { formatUnits, parseUnits } from "@ethersproject/units";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import loanCenterContract from "../contracts/LoanCenter.json";
import erc721 from "../contracts/erc721.json";
import { useMoralisWeb3Api, useWeb3Contract, useMoralis } from "react-moralis";
import { useState, useEffect } from "react";
import { Card, Input, Illustration, Loading, Typography } from "web3uikit";
import Image from "next/image";

export default function ActiveLoans() {
  const [collections, setCollections] = useState([]);
  const [collectionLoans, setCollectionLoans] = useState([]);
  const [loadingCollectionLoans, setLoadingCollectionLoans] = useState(true);
  const { isWeb3Enabled, chainId, account } = useMoralis();
  const addresses =
    chainId in contractAddresses
      ? contractAddresses[chainId]
      : contractAddresses["0x1"];
  const Web3Api = useMoralisWeb3Api();

  const { runContractFunction: getLoanDebt } = useWeb3Contract();
  const { runContractFunction: getNFTLoanId } = useWeb3Contract();

  // Get active loans for the selected collection
  async function getCollectionLoans(selectedCollection) {
    var collectionNFTs;
    var updatedCollectionLoans = [];

    // The user hasnt selected a collection so we just get some (limit) token Ids
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
      updatedCollectionLoans.push({
        loanId: loanId,
        debt: debt.toString(),
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

      // GEt the default collection loans
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

  return (
    <div className={styles.container}>
      <div className="flex m-8 items-center justify-center">
        <Autocomplete
          disablePortal
          options={collections}
          defaultValue={collections[0]}
          getOptionLabel={(option) => option.label}
          sx={{ width: 500 }}
          onInputChange={handleCollectionChange}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Collection"
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
      <div className="flex items-center justify-center">
        {loadingCollectionLoans ? (
          <div className="flex m-16">
            <Loading size={16} spinnerColor="#2E7DAF" spinnerType="wave" />
          </div>
        ) : (
          collectionLoans.length != 0 && (
            <div id="collectionLoansContainer" className="flex m-2 p-2">
              {collectionLoans.map((collectionLoan) => (
                <div key={collectionLoan.loanId} className="m-4">
                  <Card title={"Loan #" + collectionLoan.loanId}>
                    <div className="p-2">
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
                  </Card>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

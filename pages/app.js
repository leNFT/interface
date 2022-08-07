import styles from "../styles/Home.module.css";
import contractAddresses from "../contractAddresses.json";
import { getTokenPrice } from "../helpers/getTokenPrice.js";
import { formatUnits } from "@ethersproject/units";
import { useMoralisWeb3Api, useWeb3Contract, useMoralis } from "react-moralis";
import { useState, useEffect } from "react";
import erc721 from "../contracts/erc721.json";
import {
  Card,
  Tooltip,
  Illustration,
  Typography,
  Loading,
} from "@web3uikit/core";
import { HelpCircle } from "@web3uikit/icons";
import { BigNumber } from "@ethersproject/bignumber";
import Borrow from "../components/Borrow";
import RepayLoan from "../components/RepayLoan";
import Image from "next/image";
import nftOracleContract from "../contracts/NFTOracle.json";
import loanCenterContract from "../contracts/LoanCenter.json";
import { calculateHealthLevel } from "../helpers/healthLevel";
import LinearProgressWithLabel from "../components/LinearProgressWithLabel";
import StyledModal from "../components/StyledModal";

export default function App() {
  const [loadingUI, setLoadingUI] = useState(true);
  const [loans, setLoans] = useState([]);
  const [supportedAssets, setSupportedAssets] = useState([]);
  const [unsupportedAssets, setUnsupportedAssets] = useState([]);
  const [visibleAssetModal, setVisibleAssetModal] = useState(false);
  const [visibleLoanModal, setVisibleLoanModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState();
  const [selectedLoan, setSelectedLoan] = useState();
  const [walletMaxBorrowable, setWalletMaxBorrowable] = useState("0");
  const { isWeb3Enabled, chainId, account } = useMoralis();
  const addresses =
    chainId in contractAddresses
      ? contractAddresses[chainId]
      : contractAddresses["0x1"];
  const Web3Api = useMoralisWeb3Api();

  const { runContractFunction: getLoanDebt } = useWeb3Contract();
  const { runContractFunction: getLoan } = useWeb3Contract();
  const { runContractFunction: getCollectionMaxCollateralization } =
    useWeb3Contract();
  const { runContractFunction: getTokenURI } = useWeb3Contract();

  async function setupUI() {
    console.log("Setting up UI");

    // Get user NFT assets
    const options = { chain: chainId, address: account };
    const userNFTsResponse = await Web3Api.account.getNFTs(options);
    const userNFTs = userNFTsResponse.result;
    console.log("userNFTs:", userNFTs);
    console.log("supportedAssets:", contractAddresses[chainId].SupportedAssets);
    var updatedLoans = [];
    var updatedSupportedAssets = [];
    var updatedUnsupportedAssets = [];

    // Loop through all of tthe user NFTs
    for (let i = 0; i < userNFTs.length; i++) {
      if (
        userNFTs[i].token_address ==
        contractAddresses[chainId].DebtToken.toLowerCase()
      ) {
        // Get loan details
        const getLoanOptions = {
          abi: loanCenterContract.abi,
          contractAddress: addresses.LoanCenter,
          functionName: "getLoan",
          params: {
            loanId: userNFTs[i].token_id,
          },
        };
        const loan = await getLoan({
          onError: (error) => console.log(error),
          params: getLoanOptions,
        });

        console.log("got loan", loan);

        // Get loan debt
        const getLoanDebtOptions = {
          abi: loanCenterContract.abi,
          contractAddress: addresses.LoanCenter,
          functionName: "getLoanDebt",
          params: {
            loanId: userNFTs[i].token_id,
          },
        };
        const debt = await getLoanDebt({
          onError: (error) => console.log(error),
          params: getLoanDebtOptions,
        });

        // Get token price
        const tokenPrice = await getTokenPrice(loan.nftAsset, loan.nftTokenId);

        // Get max LTV of collection
        const getCollectionMaxCollateralizationOptions = {
          abi: nftOracleContract.abi,
          contractAddress: addresses.NFTOracle,
          functionName: "getCollectionMaxCollaterization",
          params: {
            collection: loan.nftAsset,
          },
        };

        const maxLTV = await getCollectionMaxCollateralization({
          onError: (error) => console.log(error),
          params: getCollectionMaxCollateralizationOptions,
        });

        //Get token URI
        const getTokenURIOptions = {
          abi: erc721,
          contractAddress: loan.nftAsset,
          functionName: "tokenURI",
          params: {
            tokenId: loan.nftTokenId,
          },
        };

        const tokenURI = await getTokenURI({
          onError: (error) => console.log(error),
          params: getTokenURIOptions,
        });

        //Find token name
        const tokenName = addresses.SupportedAssets.find(
          (collection) => collection.address == loan.nftAsset
        ).name;

        // Save relevant loan info
        updatedLoans.push({
          loanId: userNFTs[i].token_id,
          tokenName: tokenName,
          tokenAddress: loan.nftAsset,
          tokenId: loan.nftTokenId.toString(),
          tokenURI: tokenURI,
          amount: loan.amount,
          debt: debt,
          tokenPrice: tokenPrice,
          maxLTV: maxLTV,
        });
      } else if (
        contractAddresses[chainId].SupportedAssets.find(
          (collection) =>
            collection.address.toLowerCase() == userNFTs[i].token_address
        )
      ) {
        // Get token price
        const tokenPrice = await getTokenPrice(
          contractAddresses[chainId].SupportedAssets.find(
            (collection) =>
              collection.address.toLowerCase() == userNFTs[i].token_address
          ).address,
          userNFTs[i].token_id
        );

        // Get max LTV of collection
        const getCollectionMaxCollateralizationOptions = {
          abi: nftOracleContract.abi,
          contractAddress: addresses.NFTOracle,
          functionName: "getCollectionMaxCollaterization",
          params: {
            collection: userNFTs[i].token_address,
          },
        };

        const maxLTV = await getCollectionMaxCollateralization({
          onError: (error) => console.log(error),
          params: getCollectionMaxCollateralizationOptions,
        });

        //Update wallet max borrowable
        const assetMaxCollateral = BigNumber.from(maxLTV)
          .mul(tokenPrice)
          .div(10000);
        const updatedWalletMaxBorrowable =
          BigNumber.from(walletMaxBorrowable).add(assetMaxCollateral);
        setWalletMaxBorrowable(updatedWalletMaxBorrowable.toString());

        // Add asset to supported assets
        updatedSupportedAssets.push(userNFTs[i]);
      } else {
        // Get max 9 unsupported assets
        if (updatedUnsupportedAssets.length < 9) {
          updatedUnsupportedAssets.push(userNFTs[i]);
        }
      }
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
    if (isWeb3Enabled) {
      console.log("Web3 Enabled, ChainId:", chainId);
      setupUI();
    }
    console.log("useEffect called");
  }, [isWeb3Enabled, account]);

  return (
    <div className={styles.container}>
      <div className={styles.main}>
        {loans.length > 0 && <Typography variant="h1">Loans</Typography>}
        <div className="flex mb-4">
          {loans.map((loan, _) => (
            <div key={loan.loanId} className="m-4">
              <Card
                title={"Loan #" + loan.loanId}
                onClick={function () {
                  setSelectedLoan(loan);
                  setVisibleLoanModal(true);
                }}
              >
                <div className="flex flex-col p-2">
                  <div className="flex flex-row items-end gap-2">
                    {loan.tokenURI ? (
                      <Image
                        loader={() => loan.tokenURI}
                        src={loan.tokenURI}
                        height="200"
                        width="200"
                        unoptimized={true}
                      />
                    ) : (
                      <Illustration height="180px" logo="chest" width="100%" />
                    )}
                  </div>
                  <div className="flex flex-row mt-6">
                    <div className="flex flex-col">
                      <Typography variant="caption12">Health Level</Typography>
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
                        loan.debt,
                        BigNumber.from(loan.maxLTV)
                          .mul(loan.tokenPrice)
                          .div(10000)
                          .toString()
                      )}
                    />
                  </div>
                </div>
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
              />
            </StyledModal>
          )}
        </div>
        {supportedAssets.length == 0 && unsupportedAssets.length == 0 ? (
          loadingUI ? (
            <Loading size={16} spinnerColor="#2E7DAF" spinnerType="wave" />
          ) : (
            <Typography variant="body18">No NFT assets found :/</Typography>
          )
        ) : (
          <div className="flex flex-col mt-4">
            <div className="flex flex-row justify-center mt-4">
              <Typography variant="h1">
                Wallet: {supportedAssets.length} supported assets
              </Typography>
            </div>
            <div className="flex flex-row justify-center my-2">
              <Typography variant="subtitle3">
                You can borrow up to{" "}
                {formatUnits(BigNumber.from(walletMaxBorrowable).div(2), 18)}{" "}
                WETH
              </Typography>
            </div>
          </div>
        )}
        {supportedAssets.length != 0 && (
          <div className="flex border-8 rounded-3xl m-2 p-2">
            {supportedAssets.map((supportedAsset) => (
              <div key={supportedAsset.token_hash} className="m-4">
                <Card
                  title={supportedAsset.name + " #" + supportedAsset.token_id}
                  onClick={function () {
                    setSelectedAsset(supportedAsset);
                    setVisibleAssetModal(true);
                  }}
                  tooltipText={
                    <span style={{ width: 160 }}>
                      Click on the NFT to use as loan collateral
                    </span>
                  }
                >
                  <div className="p-6">
                    {supportedAsset.token_uri ? (
                      <div className="flex flex-col items-end gap-2">
                        <Image
                          loader={() => supportedAsset.token_uri}
                          src={supportedAsset.token_uri}
                          height="200"
                          width="200"
                          unoptimized={true}
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <Illustration
                          height="180px"
                          logo="token"
                          width="100%"
                        />
                        Loading...
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            ))}
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
                  token_address={
                    // Get checksumed token adress
                    contractAddresses[chainId].SupportedAssets.find(
                      (collection) =>
                        collection.address.toLowerCase() ==
                        selectedAsset.token_address
                    ).address
                  }
                  token_id={selectedAsset.token_id}
                  token_uri={selectedAsset.token_uri}
                />
              </StyledModal>
            )}
          </div>
        )}
        {unsupportedAssets.length != 0 && (
          <div
            id="unsupportedAssetsContainer"
            className="flex border-2 rounded-3xl m-2 p-2"
          >
            {unsupportedAssets.map((unsupportedAsset, index) => (
              <div
                key={unsupportedAsset.token_hash}
                className="flex m-4 items-center"
              >
                {index == 8 && unsupportedAssets.length == 9 ? (
                  <div>... and some more.</div>
                ) : (
                  <Card
                    title={
                      unsupportedAsset.name + " #" + unsupportedAsset.token_id
                    }
                    tooltipText={
                      <span style={{ width: 215 }}>
                        Asset not supported by leNFT
                      </span>
                    }
                  >
                    <div className="p-6">
                      {unsupportedAsset.token_uri ? (
                        <div className="flex flex-col items-end">
                          <Image
                            loader={() => unsupportedAsset.token_uri}
                            src={unsupportedAsset.token_uri}
                            height="140"
                            width="140"
                            unoptimized={true}
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <Illustration
                            height="140px"
                            logo="lazyNft"
                            width="100%"
                          />
                          Loading...
                        </div>
                      )}
                    </div>
                  </Card>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

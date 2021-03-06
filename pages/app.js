import styles from "../styles/Home.module.css";
import { formatUnits, parseUnits } from "@ethersproject/units";
import loanCenterContract from "../contracts/LoanCenter.json";
import contractAddresses from "../contractAddresses.json";
import { useMoralisWeb3Api, useMoralis, useWeb3Contract } from "react-moralis";
import { useState, useEffect } from "react";
import {
  Card,
  Tooltip,
  Illustration,
  Modal,
  Typography,
  Loading,
} from "web3uikit";
import Borrow from "../components/Borrow";
import RepayLoan from "../components/RepayLoan";
import Image from "next/image";

export default function App() {
  const [loadingUI, setLoadingUI] = useState(true);
  const [loans, setLoans] = useState([]);
  const [supportedAssets, setSupportedAssets] = useState([]);
  const [unsupportedAssets, setUnsupportedAssets] = useState([]);
  const [visibleAssetModal, setVisibleAssetModal] = useState(false);
  const [visibleLoanModal, setVisibleLoanModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState();
  const [selectedLoan, setSelectedLoan] = useState();
  const { isWeb3Enabled, chainId, account } = useMoralis();
  const addresses =
    chainId in contractAddresses
      ? contractAddresses[chainId]
      : contractAddresses["0x1"];
  const Web3Api = useMoralisWeb3Api();

  async function setupUI() {
    console.log("Setting up UI");

    // Get user NFT assets
    const options = { chain: chainId, address: account };
    const userNFTsResponse = await Web3Api.account.getNFTs(options);
    const userNFTs = userNFTsResponse.result;
    console.log("userNFTs:", userNFTs);
    console.log("supportedAssets:", contractAddresses[chainId].SupportedAssets);
    var updatedLoans = [];
    var updatedLoansDebt = [];
    var updatedSupportedAssets = [];
    var updatedUnsupportedAssets = [];

    for (let i = 0; i < userNFTs.length; i++) {
      if (userNFTs[i].token_address == contractAddresses[chainId].DebtToken) {
        updatedLoans.push(userNFTs[i]);
      } else if (
        contractAddresses[chainId].SupportedAssets.find(
          (collection) => collection.address == userNFTs[i].token_address
        )
      ) {
        updatedSupportedAssets.push(userNFTs[i]);
      } else {
        // Get max 5 unsupported assets
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
  }, [isWeb3Enabled]);

  return (
    <div className={styles.container}>
      <div className={styles.main}>
        {loans.length > 0 && <Typography variant="h1">Loans:</Typography>}
        <div className="flex">
          {loans.map((loan, index) => (
            <div key={loan.token_id} className="m-4">
              <Card
                title={"Loan #" + loan.token_id}
                onClick={function () {
                  console.log("CLICK");
                  setSelectedLoan(loan);
                  setVisibleLoanModal(true);
                }}
              >
                <div className="p-2">
                  {loan.token_uri ? (
                    <div className="flex flex-col items-end gap-2">
                      <Image
                        loader={() => loan.token_uri}
                        src={loan.token_uri}
                        height="200"
                        width="200"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <Illustration height="180px" logo="chest" width="100%" />
                    </div>
                  )}
                </div>
              </Card>
            </div>
          ))}
          {selectedLoan && (
            <Modal
              hasFooter={false}
              width="50%"
              isVisible={visibleLoanModal}
              onCloseButtonPressed={function () {
                setVisibleLoanModal(false);
              }}
            >
              <RepayLoan
                setVisibility={setVisibleLoanModal}
                loan_id={selectedLoan.token_id}
              />
            </Modal>
          )}
        </div>

        {supportedAssets.length == 0 && unsupportedAssets.length == 0 ? (
          loadingUI ? (
            <Loading size={16} spinnerColor="#2E7DAF" spinnerType="wave" />
          ) : (
            <Typography variant="body18">No NFT assets found :/</Typography>
          )
        ) : (
          <div className="flex mt-8">
            <Typography variant="h1">Assets:</Typography>
          </div>
        )}
        {supportedAssets.length != 0 && (
          <div className="flex border-8 rounded-3xl m-2 p-2">
            {supportedAssets.map((supportedAsset) => (
              <div key={supportedAsset.token_hash} className="m-4">
                <Card
                  title={supportedAsset.name + " #" + supportedAsset.token_id}
                  onClick={function () {
                    console.log("CLICK");
                    setSelectedAsset(supportedAsset);
                    setVisibleAssetModal(true);
                  }}
                >
                  <Tooltip content="Use as collateral!" position="top">
                    <div className="p-2">
                      {supportedAsset.token_uri ? (
                        <div className="flex flex-col items-end gap-2">
                          <Image
                            loader={() => supportedAsset.token_uri}
                            src={supportedAsset.token_uri}
                            height="200"
                            width="200"
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
                  </Tooltip>
                </Card>
              </div>
            ))}
            {selectedAsset && (
              <Modal
                hasFooter={false}
                width="50%"
                isVisible={visibleAssetModal}
                onCloseButtonPressed={function () {
                  setVisibleAssetModal(false);
                }}
              >
                <Borrow
                  setVisibility={setVisibleAssetModal}
                  token_address={selectedAsset.token_address}
                  token_id={selectedAsset.token_id}
                  token_uri={selectedAsset.token_uri}
                />
              </Modal>
            )}
          </div>
        )}
        {unsupportedAssets.length != 0 && (
          <div
            id="unsupportedAssetsContainer"
            className="flex border-2 rounded-3xl m-2 p-2"
          >
            {unsupportedAssets.map((unsupportedAsset) => (
              <div key={unsupportedAsset.token_hash} className="m-4">
                <Card
                  title={
                    unsupportedAsset.name + " #" + unsupportedAsset.token_id
                  }
                  isDisabled={true}
                >
                  <Tooltip content="Coming Soon!" position="top">
                    <div className="p-2">
                      {unsupportedAsset.token_uri ? (
                        <div className="flex flex-col items-end gap-2">
                          <Image
                            loader={() => unsupportedAsset.token_uri}
                            src={unsupportedAsset.token_uri}
                            height="140"
                            width="140"
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
                  </Tooltip>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

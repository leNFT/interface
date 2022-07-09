import styles from "../styles/Home.module.css";
import { formatUnits, parseUnits } from "@ethersproject/units";
import loanCenterContract from "../contracts/LoanCenter.json";
import contractAddresses from "../contractAddresses.json";
import { useMoralisWeb3Api, useMoralis, useWeb3Contract } from "react-moralis";
import { useState, useEffect } from "react";
import { Card, Tooltip, Illustration, Modal, Typography } from "web3uikit";
import Borrow from "../components/Borrow";
import RepayLoan from "../components/RepayLoan";
import Image from "next/image";

export default function App() {
  const [loans, setLoans] = useState([]);
  const [loansDebt, setLoansDebt] = useState([]);
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

  const { runContractFunction: getLoanDebt } = useWeb3Contract();

  async function setupUI() {
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

        // Get the debt for each loan
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
        updatedLoansDebt.push(debt.toString());
      } else if (
        contractAddresses[chainId].SupportedAssets.includes(
          userNFTs[i].token_address
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
    setLoansDebt(updatedLoansDebt);
    setSupportedAssets(updatedSupportedAssets);
    setUnsupportedAssets(updatedUnsupportedAssets);
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
        {isWeb3Enabled ? (
          <div>
            {loans.length > 0 && (
              <Typography variant="subtitle1">Loans:</Typography>
            )}
            <ul className="flex">
              {loans.map((loan, index) => (
                <li key={loan.token_id} className="m-4">
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
                          <Illustration
                            height="180px"
                            logo="chest"
                            width="100%"
                          />
                          Debt: {formatUnits(loansDebt[index], 18)} wETH
                        </div>
                      )}
                    </div>
                  </Card>
                </li>
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
            </ul>
            {supportedAssets.length == 0 && unsupportedAssets.length == 0 ? (
              <Typography variant="body18">No NFT assets found :/</Typography>
            ) : (
              <Typography variant="subtitle1">Assets:</Typography>
            )}
            <div className="flex border-8 rounded-3xl m-2 p-2">
              {supportedAssets.map((supportedAsset) => (
                <div key={supportedAsset.token_hash} className="m-4">
                  <Card
                    title={supportedAsset.name}
                    description={supportedAsset.token_id}
                    onClick={function () {
                      console.log("CLICK");
                      setSelectedAsset(supportedAsset);
                      setVisibleAssetModal(true);
                    }}
                  >
                    <Tooltip content="Supported Asset" position="top">
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
            <div
              id="unsupportedAssetsContainer"
              className="flex border-2 rounded-3xl m-2 p-2"
            >
              {unsupportedAssets.map((unsupportedAsset) => (
                <div key={unsupportedAsset.token_hash} className="m-4">
                  <Card
                    title={unsupportedAsset.name}
                    description={unsupportedAsset.token_id}
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
          </div>
        ) : (
          <Typography variant="body18">
            Please connect a Web 3 wallet.
          </Typography>
        )}
      </div>
    </div>
  );
}

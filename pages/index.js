import styles from "../styles/Home.module.css";
import contractAddresses from "../contractAddresses.json";
import { useMoralisWeb3Api, useMoralis } from "react-moralis";
import { useState, useEffect } from "react";
import { Card, Tooltip, Illustration, Modal } from "web3uikit";
import Borrow from "../components/Borrow";
import RepayLoan from "../components/RepayLoan";
import Image from "next/image";

export default function Home() {
  const [loans, setLoans] = useState([]);
  const [supportedAssets, setSupportedAssets] = useState([]);
  const [unsupportedAssets, setUnsupportedAssets] = useState([]);
  const [visibleAssetModal, setVisibleAssetModal] = useState(false);
  const [visibleLoanModal, setVisibleLoanModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState();
  const [selectedLoan, setSelectedLoan] = useState();

  const { isWeb3Enabled, chainId, account } = useMoralis();
  const Web3Api = useMoralisWeb3Api();

  async function setupUI() {
    // Get user NFT assets
    const options = { chain: chainId, address: account };
    const userNFTsResponse = await Web3Api.account.getNFTs(options);
    const userNFTs = userNFTsResponse.result;
    console.log("userNFTs:", userNFTs);
    console.log("supportedAssets:", contractAddresses[chainId].SupportedAssets);
    var updatedLoans = [];
    var updatedSupportedAssets = [];
    var updatedUnsupportedAssets = [];

    for (let i = 0; i < userNFTs.length; i++) {
      if (userNFTs[i].token_address == contractAddresses[chainId].DebtToken) {
        updatedLoans.push(userNFTs[i]);
      } else if (
        contractAddresses[chainId].SupportedAssets.includes(
          userNFTs[i].token_address
        )
      ) {
        updatedSupportedAssets.push(userNFTs[i]);
      } else {
        // Get max 5 unsupported assets
        if (updatedUnsupportedAssets.length < 5) {
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
  }

  // Runs once
  useEffect(() => {
    if (isWeb3Enabled) {
      console.log("WEB3 Enabled, ChainId:", chainId);
      setupUI();
    }
    console.log("useEffect called");
  }, [isWeb3Enabled]);

  return (
    <div className={styles.container}>
      <div className={styles.main}>
        {isWeb3Enabled ? (
          <div>
            {loans.length > 0 && <div>Loans:</div>}
            <ul className="flex">
              {loans.map((loan) => (
                <li key={loan.token_id} className="m-4">
                  <Card
                    title="Loan"
                    description={loan.token_id}
                    onClick={function () {
                      console.log("CLICK");
                      setSelectedLoan(loan);
                      setVisibleLoanModal(true);
                    }}
                  >
                    <Tooltip content="Loan" position="top">
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
                            Loading...
                          </div>
                        )}
                      </div>
                    </Tooltip>
                  </Card>
                </li>
              ))}
              {selectedLoan && (
                <Modal
                  hasFooter={false}
                  isVisible={visibleLoanModal}
                  onCloseButtonPressed={function () {
                    setVisibleLoanModal(false);
                  }}
                >
                  <RepayLoan loan_id={selectedLoan.token_id} />
                </Modal>
              )}
            </ul>
            Assets:
            <ul className="flex">
              {supportedAssets.map((supportedAsset) => (
                <li key={supportedAsset.token_hash} className="m-4">
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
                </li>
              ))}
              {selectedAsset && (
                <Modal
                  hasFooter={false}
                  isVisible={visibleAssetModal}
                  onCloseButtonPressed={function () {
                    setVisibleAssetModal(false);
                  }}
                >
                  <Borrow
                    token_address={selectedAsset.token_address}
                    token_id={selectedAsset.token_id}
                  />
                </Modal>
              )}
            </ul>
            <div id="unsupportedAssetsContainer" className="container">
              {unsupportedAssets.map((unsupportedAsset) => (
                <div key={unsupportedAsset.token_hash} className="m-4">
                  <Card
                    title={unsupportedAsset.name}
                    description={unsupportedAsset.token_id}
                    isDisabled={true}
                  >
                    <Tooltip content="Coming Soon!" position="top">
                      <div className="p-2">
                        <div className="flex flex-col items-center gap-1">
                          <Illustration height="180px" logo="lazyNft" />
                          Unsupported Asset
                        </div>
                      </div>
                    </Tooltip>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>Please connect a Web 3 wallet.</div>
        )}
      </div>
    </div>
  );
}

import styles from "../styles/Home.module.css";
import contractAddresses from "../contractAddresses.json";
import { formatUnits, parseUnits } from "@ethersproject/units";
import loanCenterContract from "../contracts/LoanCenter.json";
import erc721 from "../contracts/erc721.json";
import { useMoralisWeb3Api, useWeb3Contract, useMoralis } from "react-moralis";
import { useState, useEffect } from "react";
import { Card, Tooltip, Illustration, Loading, Typography } from "web3uikit";
import Image from "next/image";

export default function ActiveLoans() {
  const [activeLoans, setActiveLoans] = useState([]);
  const [loadingActiveLoans, setLoadingActiveLoans] = useState(true);
  const { isWeb3Enabled, chainId, account } = useMoralis();
  const addresses =
    chainId in contractAddresses
      ? contractAddresses[chainId]
      : contractAddresses["0x1"];
  const Web3Api = useMoralisWeb3Api();

  const { runContractFunction: getLoanDebt } = useWeb3Contract();
  const { runContractFunction: getLoanTokenId } = useWeb3Contract();
  const { runContractFunction: getLoanTokenAddress } = useWeb3Contract();
  const { runContractFunction: getLoanTokenURI } = useWeb3Contract();

  async function setupUI() {
    // Get user active loans
    const options = { chain: chainId, address: addresses.DebtToken };
    const activeLoansResponse = await Web3Api.token.getAllTokenIds(options);
    const activeLoans = activeLoansResponse.result;
    console.log("Active Loans:", activeLoans);
    var updatedActiveLoans = [];

    for (let i = 0; i < activeLoans.length; i++) {
      // Get the debt for each loan
      const getLoanDebtOptions = {
        abi: loanCenterContract.abi,
        contractAddress: addresses.LoanCenter,
        functionName: "getLoanDebt",
        params: {
          loanId: activeLoans[i].token_id,
        },
      };
      const debt = await getLoanDebt({
        onError: (error) => console.log(error),
        params: getLoanDebtOptions,
      });

      // Get the collaterals token id for each loan
      const getLoanTokenIdOptions = {
        abi: loanCenterContract.abi,
        contractAddress: addresses.LoanCenter,
        functionName: "getLoanTokenId",
        params: {
          loanId: activeLoans[i].token_id,
        },
      };
      const loanTokenId = await getLoanTokenId({
        onError: (error) => console.log(error),
        params: getLoanTokenIdOptions,
      });

      // Get the collaterals token address for each loan
      const getLoanTokenAddressOptions = {
        abi: loanCenterContract.abi,
        contractAddress: addresses.LoanCenter,
        functionName: "getLoanTokenAddress",
        params: {
          loanId: activeLoans[i].token_id,
        },
      };
      const loanTokenAddress = await getLoanTokenAddress({
        onError: (error) => console.log(error),
        params: getLoanTokenAddressOptions,
      });

      // Get the collaterals token uri for each loan
      const getLoanTokenURIOptions = {
        abi: erc721,
        contractAddress: loanTokenAddress,
        functionName: "tokenURI",
        params: {
          tokenId: activeLoans[i].token_id,
        },
      };
      const loanTokenURI = await getLoanTokenURI({
        onError: (error) => console.log(error),
        params: getLoanTokenURIOptions,
      });

      console.log("loanTokenURI", loanTokenURI);

      // Add new loan to update array
      updatedActiveLoans.push({
        loanId: activeLoans[i].token_id,
        debt: debt.toString(),
        tokenAddress: loanTokenAddress,
        tokenId: loanTokenId.toString(),
        tokenURI: loanTokenURI,
      });
    }
    // Update active loans state array
    setActiveLoans(updatedActiveLoans);
    setLoadingActiveLoans(false);
  }

  // Runs once
  useEffect(() => {
    if (isWeb3Enabled) {
      setupUI();
    }
    console.log("useEffect called");
  }, [isWeb3Enabled]);

  return (
    <div className={styles.container}>
      <div className="flex flex-row items-center justify-center">
        {loadingActiveLoans ? (
          <div className="flex m-16">
            <Loading size={16} spinnerColor="#2E7DAF" spinnerType="wave" />
          </div>
        ) : (
          activeLoans.length != 0 && (
            <div id="activeLoansContainer" className="flex m-2 p-2">
              {activeLoans.map((activeLoan) => (
                <div key={activeLoan.loanId} className="m-4">
                  <Card title={"#" + activeLoan.loanId}>
                    <div className="p-2">
                      {activeLoan.tokenURI ? (
                        <div className="flex flex-col items-end gap-2">
                          <Image
                            loader={() => activeLoan.tokenURI}
                            src={activeLoan.tokenURI}
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

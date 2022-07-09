import styles from "../styles/Home.module.css";
import contractAddresses from "../contractAddresses.json";
import { formatUnits, parseUnits } from "@ethersproject/units";
import { useMoralisWeb3Api, useWeb3Contract, useMoralis } from "react-moralis";
import { useState, useEffect } from "react";
import { Card, Tooltip, Illustration, Modal, Typography } from "web3uikit";

export default function ActiveLoans() {
  const [activeLoans, setActiveLoans] = useState([]);
  const { isWeb3Enabled, chainId, account } = useMoralis();
  const addresses =
    chainId in contractAddresses
      ? contractAddresses[chainId]
      : contractAddresses["0x1"];
  const Web3Api = useMoralisWeb3Api();

  const { runContractFunction: getLoanDebt } = useWeb3Contract();

  async function setupUI() {
    // Get user active loans
    const options = { chain: chainId, address: addresses.DebtToken };
    const activeLoansResponse = await Web3Api.token.getAllTokenIds(options);
    const activeLoans = activeLoansResponse.result;
    console.log("Active Loans:", activeLoans);
    var updatedLoans = [];

    for (let i = 0; i < activeLoans.length; i++) {
      // Get the debt for each loan
      const getLoanDebtOptions = {
        abi: loanCenterContract.abi,
        contractAddress: addresses.LoanCenter,
        functionName: "getLoanDebt",
        params: {
          loanId: activeLoans[i],
        },
      };
      const debt = await getLoanDebt({
        onError: (error) => console.log(error),
        params: getLoanDebtOptions,
      });
      updatedLoans.push(debt.toString());
    }
    setActiveLoans(updatedLoans);
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
        {activeLoans.length != 0 && (
          <div
            id="activeLoansContainer"
            className="flex border-2 rounded-3xl m-2 p-2"
          >
            {activeLoans.map((activeLoan) => (
              <div key={activeLoan.token_hash} className="m-4">
                <Card
                  title={activeLoan.name + " #" + activeLoan.token_id}
                  isDisabled={true}
                >
                  <Tooltip content="Coming Soon!" position="top">
                    <div className="p-2">
                      {activeLoan.token_uri ? (
                        <div className="flex flex-col items-end gap-2">
                          <Image
                            loader={() => activeLoan.token_uri}
                            src={activeLoan.token_uri}
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

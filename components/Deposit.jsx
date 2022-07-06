import { BigNumber } from "@ethersproject/bignumber";
import { formatUnits, parseUnits } from "@ethersproject/units";
import { useNotification, Button } from "web3uikit";
import styles from "../styles/Home.module.css";
import contractAddresses from "../contractAddresses.json";
import { useWeb3Contract, useMoralis } from "react-moralis";
import { useState, useEffect } from "react";
import marketContract from "../contracts/Market.json";
import erc20 from "../contracts/erc20.json";

export default function Deposit() {
  const { isWeb3Enabled, chainId, account } = useMoralis();
  const [amount, setAmount] = useState("0");
  const [balance, setBalance] = useState("0");
  const [approved, setApproved] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [depositLoading, setDepositLoading] = useState(false);
  const [reserveAddress, setReserveAddress] = useState("");

  const addresses =
    chainId in contractAddresses
      ? contractAddresses[chainId]
      : contractAddresses["0x1"];

  const dispatch = useNotification();

  const { runContractFunction: getReserveAddress } = useWeb3Contract({
    abi: marketContract.abi,
    contractAddress: addresses.Market,
    functionName: "getReserveAddress",
    params: {
      asset: addresses.WETH,
    },
  });

  const { runContractFunction: deposit } = useWeb3Contract({
    abi: marketContract.abi,
    contractAddress: addresses.Market,
    functionName: "deposit",
    params: {
      asset: addresses.WETH,
      amount: amount,
    },
  });

  const { runContractFunction: getBalance } = useWeb3Contract({
    abi: erc20,
    contractAddress: addresses.WETH,
    functionName: "balanceOf",
    params: {
      _owner: account,
    },
  });

  const { runContractFunction: getAllowance } = useWeb3Contract();

  const { runContractFunction: approve } = useWeb3Contract();

  async function updateTokenBalance() {
    const updatedBalance = await getBalance({
      onError: (error) => console.log(error),
    });
    console.log("Updated Balance:", updatedBalance);
    setBalance(updatedBalance.toString());
  }

  async function getTokenAllowance() {
    const getAllowanceOptions = {
      abi: erc20,
      contractAddress: addresses.WETH,
      functionName: "allowance",
      params: {
        _owner: account,
        _spender: reserveAddress,
      },
    };

    const allowance = await getAllowance({
      onError: (error) => console.log(error),
      params: getAllowanceOptions,
    });

    console.log("Got allowance:", allowance);

    if (!allowance.eq(BigNumber.from(0))) {
      setApproved(true);
    }
  }

  async function getReserve() {
    const updatedReserveAddress = (
      await getReserveAddress({
        onError: (error) => console.log(error),
      })
    ).toString();
    setReserveAddress(updatedReserveAddress);
    console.log("updatedReserveAddress", updatedReserveAddress);
  }

  useEffect(() => {
    if (isWeb3Enabled) {
      getReserve();
    }
  }, [isWeb3Enabled]);

  // Set the rest of the UI when we receive the reserve address
  useEffect(() => {
    if (reserveAddress) {
      console.log("Got reserve address, setting the rest...", reserveAddress);
      getTokenAllowance();
      updateTokenBalance();
    }
  }, [reserveAddress]);

  const handleDepositSuccess = async function () {
    console.log("Deposited", amount);
    updateTokenBalance();
    dispatch({
      type: "info",
      message: "Deposit Successful!",
      title: "Notification",
      position: "topR",
      icon: "bell",
    });
  };

  const handleApprovalSuccess = async function () {
    setApproved(true);
    dispatch({
      type: "info",
      message: "Approval Successful!",
      title: "Notification",
      position: "topR",
      icon: "bell",
    });
  };

  function handleInputChange(e) {
    if (e.target.value != "") {
      setAmount(parseUnits(e.target.value, 18).toString());
    } else {
      setAmount("0");
    }
  }

  return (
    <div className={styles.container}>
      <div className="flex">
        Maximum deposit amount is {formatUnits(balance, 18)} WETH
      </div>
      <input
        className="flex"
        type="number"
        defaultValue="0"
        onChange={handleInputChange}
      />
      {approved ? (
        <div className="m-8">
          <Button
            text="Deposit"
            isFullWidth
            loadingProps={{
              spinnerColor: "#000000",
            }}
            loadingText="Confirming Deposit"
            isLoading={depositLoading}
            onClick={async function () {
              if (BigNumber.from(amount).lte(BigNumber.from(balance))) {
                setDepositLoading(true);
                await deposit({
                  onComplete: () => setDepositLoading(false),
                  onSuccess: handleDepositSuccess,
                  onError: (error) => console.log(error),
                });
              } else {
                dispatch({
                  type: "info",
                  message: "Amount is bigger than balance",
                  title: "Notification",
                  position: "topR",
                  icon: "bell",
                });
              }
            }}
          ></Button>
        </div>
      ) : (
        <div className="m-8">
          <Button
            text="Approve"
            isFullWidth
            loadingProps={{
              spinnerColor: "#000000",
            }}
            loadingText="Confirming Approval"
            isLoading={approvalLoading}
            onClick={async function () {
              setApprovalLoading(true);
              const approveOptions = {
                abi: erc20,
                contractAddress: addresses.WETH,
                functionName: "approve",
                params: {
                  _spender: reserveAddress,
                  _value:
                    "115792089237316195423570985008687907853269984665640564039457584007913129639935",
                },
              };

              await approve({
                onComplete: () => setApprovalLoading(false),
                onSuccess: handleApprovalSuccess,
                onError: (error) => setconsole.log(error),
                params: approveOptions,
              });
            }}
          ></Button>
        </div>
      )}
    </div>
  );
}

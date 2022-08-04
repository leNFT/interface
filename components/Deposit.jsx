import { BigNumber } from "@ethersproject/bignumber";
import { formatUnits, parseUnits } from "@ethersproject/units";
import { useNotification, Button, Input, Typography } from "@web3uikit/core";
import styles from "../styles/Home.module.css";
import contractAddresses from "../contractAddresses.json";
import { useWeb3Contract, useMoralis } from "react-moralis";
import { useState, useEffect } from "react";
import Link from "next/link";
import marketContract from "../contracts/Market.json";
import erc20 from "../contracts/erc20.json";

export default function Deposit(props) {
  const { isWeb3Enabled, chainId, account } = useMoralis();
  const [amount, setAmount] = useState("0");
  const [balance, setBalance] = useState("0");
  const [approved, setApproved] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [depositLoading, setDepositLoading] = useState(false);
  const [reserveAddress, setReserveAddress] = useState("");
  const dispatch = useNotification();
  const addresses =
    chainId in contractAddresses
      ? contractAddresses[chainId]
      : contractAddresses["0x1"];

  const { runContractFunction: getReserveAddress } = useWeb3Contract({
    abi: marketContract.abi,
    contractAddress: addresses.Market,
    functionName: "getReserveAddress",
    params: {
      asset: addresses[props.asset].address,
    },
  });

  const { runContractFunction: deposit } = useWeb3Contract({
    abi: marketContract.abi,
    contractAddress: addresses.Market,
    functionName: "deposit",
    params: {
      asset: addresses[props.asset].address,
      amount: amount,
    },
  });

  const { runContractFunction: getBalance } = useWeb3Contract({
    abi: erc20,
    contractAddress: addresses[props.asset].address,
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
      contractAddress: addresses[props.asset].address,
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
    } else {
      setApproved(false);
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
    if (isWeb3Enabled && props.asset) {
      getReserve();
    }
  }, [isWeb3Enabled, props.asset]);

  // Set the rest of the UI when we receive the reserve address
  useEffect(() => {
    if (reserveAddress && props.asset) {
      console.log("Got reserve address, setting the rest...", reserveAddress);
      getTokenAllowance();
      updateTokenBalance();
    }
  }, [reserveAddress, props.asset]);

  const handleDepositSuccess = async function () {
    console.log("Deposited", amount);
    props.setVisibility(false);
    updateTokenBalance();
    dispatch({
      type: "info",
      message: "Deposit Successful! Please wait for transaction confirmation.",
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
      setAmount(
        parseUnits(e.target.value, addresses[props.asset].decimals).toString()
      );
    } else {
      setAmount("0");
    }
  }

  return (
    <div className={styles.container}>
      <div className="flex flex-row items-center justify-center">
        <div className="flex flex-col">
          <Typography variant="h4">My Balance</Typography>
          <Typography variant="body16">
            {formatUnits(balance, addresses[props.asset].decimals) +
              " " +
              props.asset}
          </Typography>
        </div>
        {BigNumber.from(0).eq(parseUnits(balance)) &&
          addresses[props.asset].decimals == "WETH" && (
            <div className="flex flex-col ml-4">
              <Link
                href={
                  "https://app.uniswap.org/#/swap?inputCurrency=ETH&outputCurrency=" +
                  addresses.WETH
                }
              >
                <a target="_blank" rel="noopener noreferrer">
                  <Button
                    text="Wrap ETH"
                    theme="ghost"
                    type="button"
                    size="small"
                  />
                </a>
              </Link>
            </div>
          )}
      </div>
      <div className="flex flex-row items-center justify-center m-8">
        <Input
          label="Amount"
          type="number"
          step="any"
          validation={{
            numberMax: Number(
              formatUnits(balance, addresses[props.asset].decimals)
            ),
            numberMin: 0,
          }}
          disabled={!approved}
          onChange={handleInputChange}
        />
      </div>
      {approved ? (
        <div className="mt-16 mb-8">
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
                console.log("Depositing", amount);
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
        <div className="mt-16 mb-8">
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
                contractAddress: addresses[props.asset].address,
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
                onError: (error) => console.log(error),
                params: approveOptions,
              });
            }}
          ></Button>
        </div>
      )}
    </div>
  );
}

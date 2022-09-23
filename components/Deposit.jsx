import {
  useAccount,
  useNetwork,
  useContract,
  useProvider,
  useSigner,
} from "wagmi";
import { BigNumber } from "@ethersproject/bignumber";
import { formatUnits, parseUnits } from "@ethersproject/units";
import { useNotification, Button, Input, Typography } from "@web3uikit/core";
import styles from "../styles/Home.module.css";
import contractAddresses from "../contractAddresses.json";
import { useState, useEffect } from "react";
import Link from "next/link";
import marketContract from "../contracts/Market.json";
import erc20 from "../contracts/erc20.json";

export default function Deposit(props) {
  const [amount, setAmount] = useState("0");
  const [balance, setBalance] = useState("0");
  const [approved, setApproved] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [depositLoading, setDepositLoading] = useState(false);
  const [reserveAddress, setReserveAddress] = useState("");
  const dispatch = useNotification();
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const { data: signer } = useSigner();
  const provider = useProvider();
  const addresses =
    chain && chain.id in contractAddresses
      ? contractAddresses[chain.id]
      : contractAddresses["1"];

  const marketSigner = useContract({
    contractInterface: marketContract.abi,
    addressOrName: addresses.Market,
    signerOrProvider: signer,
  });

  const marketProvider = useContract({
    contractInterface: marketContract.abi,
    addressOrName: addresses.Market,
    signerOrProvider: provider,
  });

  const tokenSigner = useContract({
    contractInterface: erc20,
    addressOrName: addresses[props.asset].address,
    signerOrProvider: signer,
  });

  const tokenProvider = useContract({
    contractInterface: erc20,
    addressOrName: addresses[props.asset].address,
    signerOrProvider: provider,
  });

  async function updateTokenBalance() {
    const updatedBalance = await tokenProvider.balanceOf(address);
    console.log("Updated Balance:", updatedBalance);
    setBalance(updatedBalance.toString());
  }

  async function getTokenAllowance() {
    const allowance = await tokenProvider.allowance(address, reserveAddress);

    console.log("Got allowance:", allowance);

    if (!allowance.eq(BigNumber.from(0))) {
      setApproved(true);
    } else {
      setApproved(false);
    }
  }

  async function getReserve() {
    const updatedReserveAddress = await marketProvider.getReserveAddress(
      addresses[props.asset].address
    );

    setReserveAddress(updatedReserveAddress);
    console.log("updatedReserveAddress", updatedReserveAddress);
  }

  useEffect(() => {
    if (isConnected && props.asset) {
      getReserve();
    }
  }, [isConnected, props.asset]);

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
    props.updateUI();
    props.setVisibility(false);
    updateTokenBalance();
    dispatch({
      type: "success",
      message: "Your tokens were deposited into the reserve.",
      title: "Deposit Successful!",
      position: "topR",
    });
  };

  const handleApprovalSuccess = async function () {
    setApproved(true);
    dispatch({
      type: "success",
      message: "You can now deposit.",
      title: "Approval Successful!",
      position: "topR",
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
          <Typography variant="subtitle2">My Balance</Typography>
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
            theme="secondary"
            isFullWidth
            loadingProps={{
              spinnerColor: "#000000",
              spinnerType: "loader",
              direction: "right",
              size: "24",
            }}
            loadingText=""
            isLoading={depositLoading}
            onClick={async function () {
              if (BigNumber.from(amount).lte(BigNumber.from(balance))) {
                try {
                  setDepositLoading(true);
                  const tx = await marketSigner.deposit(
                    addresses[props.asset].address,
                    amount
                  );
                  await tx.wait(1);
                  handleDepositSuccess();
                } catch (error) {
                  console.log(error);
                } finally {
                  setDepositLoading(false);
                }
              } else {
                dispatch({
                  type: "error",
                  message: "Amount is bigger than balance",
                  title: "Error",
                  position: "topR",
                });
              }
            }}
          ></Button>
        </div>
      ) : (
        <div className="mt-16 mb-8">
          <Button
            text="Approve"
            theme="secondary"
            isFullWidth
            loadingProps={{
              spinnerColor: "#000000",
              spinnerType: "loader",
              direction: "right",
              size: "24",
            }}
            loadingText=""
            isLoading={approvalLoading}
            onClick={async function () {
              try {
                setApprovalLoading(true);
                const tx = await tokenSigner.approve(
                  reserveAddress,
                  "115792089237316195423570985008687907853269984665640564039457584007913129639935"
                );
                await tx.wait(1);
                handleApprovalSuccess();
              } catch (error) {
                console.log(error);
              } finally {
                setApprovalLoading(false);
              }
            }}
          ></Button>
        </div>
      )}
    </div>
  );
}

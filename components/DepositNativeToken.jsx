import { BigNumber } from "@ethersproject/bignumber";
import {
  useAccount,
  useNetwork,
  useContract,
  useProvider,
  useSigner,
} from "wagmi";
import { formatUnits, parseUnits } from "@ethersproject/units";
import { useNotification, Button, Input, Typography } from "@web3uikit/core";
import styles from "../styles/Home.module.css";
import contractAddresses from "../contractAddresses.json";
import { useState, useEffect } from "react";
import nativeTokenVaultContract from "../contracts/NativeTokenVault.json";
import nativeTokenContract from "../contracts/NativeToken.json";

export default function DepositNativeToken(props) {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const provider = useProvider();
  const { data: signer } = useSigner();
  const [amount, setAmount] = useState("0");
  const [balance, setBalance] = useState("0");
  const [approved, setApproved] = useState(false);
  const [depositLoading, setDepositLoading] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);

  const dispatch = useNotification();
  const addresses =
    chain && chain.id in contractAddresses
      ? contractAddresses[chain.id]
      : contractAddresses["1"];

  const nativeTokenVaultSigner = useContract({
    contractInterface: nativeTokenVaultContract.abi,
    addressOrName: addresses.NativeTokenVault,
    signerOrProvider: signer,
  });

  const nativeTokenProvider = useContract({
    contractInterface: nativeTokenContract.abi,
    addressOrName: addresses.NativeToken,
    signerOrProvider: provider,
  });

  const nativeTokenSigner = useContract({
    contractInterface: nativeTokenContract.abi,
    addressOrName: addresses.NativeToken,
    signerOrProvider: signer,
  });

  async function updateTokenBalance() {
    const updatedBalance = await nativeTokenProvider.balanceOf(address);
    console.log("Updated Balance:", updatedBalance);
    setBalance(updatedBalance.toString());
  }

  async function getTokenAllowance() {
    const allowance = await nativeTokenProvider.allowance(
      address,
      addresses.NativeTokenVault
    );
    console.log("Got allowance:", allowance);

    if (!allowance.eq(BigNumber.from(0))) {
      setApproved(true);
    }
  }

  useEffect(() => {
    if (isConnected) {
      getTokenAllowance();
      updateTokenBalance();
    }
  }, [isConnected]);

  const handleDepositSuccess = async function () {
    console.log("Deposited", amount);
    props.setVisibility(false);
    updateTokenBalance();
    dispatch({
      type: "success",
      message: "Your LE tokens were deposited into the vault.",
      title: "Deposit Successful!",
      position: "topR",
    });
  };

  const handleApprovalSuccess = async function () {
    setApproved(true);
    dispatch({
      type: "success",
      message: "You can now deposit into the vault.",
      title: "Approval Successful!",
      position: "topR",
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
      <div className="flex flex-row items-center justify-center">
        <div className="flex flex-col">
          <Typography variant="subtitle2">My Balance</Typography>
          <Typography variant="body16">
            {formatUnits(balance, 18)} LE
          </Typography>
        </div>
      </div>
      <div className="flex flex-row items-center text-center justify-center m-2">
        <Typography variant="caption14">
          Deposits are subject to a 7-day withdrawal period.
        </Typography>
      </div>
      <div className="flex flex-row items-center justify-center m-8">
        <Input
          labelBgColor="rgb(241, 242, 251)"
          label="Amount"
          type="number"
          step="any"
          validation={{
            numberMax: Number(formatUnits(balance, 18)),
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
                  const tx = await nativeTokenVaultSigner.deposit(amount);
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
                const tx = await nativeTokenSigner.approve(
                  addresses.NativeTokenVault,
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

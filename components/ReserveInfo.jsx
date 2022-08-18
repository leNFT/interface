import { Button, Tooltip, Loading } from "@web3uikit/core";
import { HelpCircle } from "@web3uikit/icons";
import styles from "../styles/Home.module.css";
import StyledModal from "../components/StyledModal";
import { formatUnits } from "@ethersproject/units";
import contractAddresses from "../contractAddresses.json";
import { useState, useEffect } from "react";
import { useMoralis, useWeb3Contract } from "react-moralis";
import marketContract from "../contracts/Market.json";
import tokenOracleContract from "../contracts/TokenOracle.json";
import reserveContract from "../contracts/Reserve.json";
import LinearProgressWithLabel from "./LinearProgressWithLabel";
import Deposit from "./Deposit";
import Withdraw from "./Withdraw";
import Box from "@mui/material/Box";

export default function ReserveInfo(props) {
  const { isWeb3Enabled, chainId, account } = useMoralis();
  const [debt, setDebt] = useState("0");
  const [visibleDepositModal, setVisibleDepositModal] = useState(false);
  const [visibleWithdrawalModal, setVisibleWithdrawalModal] = useState(false);
  const [maxAmount, setMaxAmount] = useState("0");
  const [underlyingBalance, setUnderlyingBalance] = useState("0");
  const [supplyRate, setSupplyRate] = useState(0);
  const [borrowRate, setBorrowRate] = useState(0);
  const [utilizationRate, setUtilizationRate] = useState(0);
  const [reserveAddress, setReserveAddress] = useState("");
  const [ethPrice, setETHPrice] = useState("0");
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [loadingReserve, setLoadingReserve] = useState(false);

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

  const { runContractFunction: getUnderlyingBalance } = useWeb3Contract({
    abi: reserveContract.abi,
    contractAddress: reserveAddress,
    functionName: "getUnderlyingBalance",
    params: {},
  });

  const { runContractFunction: getDebt } = useWeb3Contract({
    abi: reserveContract.abi,
    contractAddress: reserveAddress,
    functionName: "getDebt",
    params: {},
  });

  const { runContractFunction: getUtilizationRate } = useWeb3Contract({
    abi: reserveContract.abi,
    contractAddress: reserveAddress,
    functionName: "getUtilizationRate",
    params: {},
  });

  const { runContractFunction: getSupplyRate } = useWeb3Contract({
    abi: reserveContract.abi,
    contractAddress: reserveAddress,
    functionName: "getSupplyRate",
    params: {},
  });

  const { runContractFunction: getBorrowRate } = useWeb3Contract({
    abi: reserveContract.abi,
    contractAddress: reserveAddress,
    functionName: "getBorrowRate",
    params: {},
  });

  const { runContractFunction: getMaximumWithdrawalAmount } = useWeb3Contract({
    abi: reserveContract.abi,
    contractAddress: reserveAddress,
    functionName: "getMaximumWithdrawalAmount",
    params: {
      to: account,
    },
  });

  const { runContractFunction: getTokenETHPrice } = useWeb3Contract();

  async function updateAssetETHPrice() {
    const updatedAssetETHPriceOptions = {
      abi: tokenOracleContract.abi,
      contractAddress: addresses.TokenOracle,
      functionName: "getTokenETHPrice",
      params: {
        token: addresses[props.asset].address,
      },
    };

    const updatedAssetETHPrice = (
      await getTokenETHPrice({
        onError: (error) => console.log(error),
        params: updatedAssetETHPriceOptions,
      })
    ).toString();
    setETHPrice(updatedAssetETHPrice);
    console.log("updatedAssetETHPrice", updatedAssetETHPrice);

    //Stop loading
    setLoadingPrice(false);
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

  async function getReserveDetails() {
    const updatedDebt = await getDebt({
      onError: (error) => console.log(error),
    });
    console.log("Updated Debt:", updatedDebt);
    setDebt(updatedDebt.toString());

    const updatedUnderlyingBalance = await getUnderlyingBalance({
      onError: (error) => console.log(error),
    });
    console.log("Updated Underlying Balance:", updatedUnderlyingBalance);
    setUnderlyingBalance(updatedUnderlyingBalance.toString());

    const updatedUtilizationRate = await getUtilizationRate({
      onError: (error) => console.log(error),
    });
    console.log("Updated Utilization Rate:", updatedUtilizationRate);
    setUtilizationRate(updatedUtilizationRate.toNumber());

    const updatedSupplyRate = await getSupplyRate({
      onError: (error) => console.log(error),
    });
    console.log("Updated Supply Rate:", updatedSupplyRate);
    setSupplyRate(updatedSupplyRate.toNumber());

    const updatedBorrowRate = await getBorrowRate({
      onError: (error) => console.log(error),
    });
    console.log("Updated Borrow Rate:", updatedBorrowRate);
    setBorrowRate(updatedBorrowRate.toNumber());

    const updatedMaxAmount = await getMaximumWithdrawalAmount({
      onError: (error) => console.log(error),
    });
    console.log("Updated Max Withdrawal Amount:", updatedMaxAmount);
    setMaxAmount(updatedMaxAmount.toString());

    //Stop loading
    setLoadingReserve(false);
  }

  useEffect(() => {
    if (isWeb3Enabled && props.asset) {
      console.log("props.asset", props.asset);
      setLoadingPrice(true);
      setLoadingReserve(true);
      getReserve();
      updateAssetETHPrice();
    }
  }, [isWeb3Enabled, account, props.asset]);

  // Set the rest of the UI when we receive the reserve address
  useEffect(() => {
    if (reserveAddress) {
      console.log("Got reserve address, setting the rest...", reserveAddress);
      getReserveDetails();
    }
  }, [reserveAddress, account]);

  return (
    <div>
      <StyledModal
        hasFooter={false}
        title={"Deposit " + props.asset}
        isVisible={visibleDepositModal}
        width="50%"
        onCloseButtonPressed={function () {
          setVisibleDepositModal(false);
        }}
      >
        <Deposit setVisibility={setVisibleDepositModal} asset={props.asset} />
      </StyledModal>
      <StyledModal
        hasFooter={false}
        title={"Withdraw " + props.asset}
        width="50%"
        isVisible={visibleWithdrawalModal}
        onCloseButtonPressed={function () {
          setVisibleWithdrawalModal(false);
        }}
      >
        <Withdraw
          setVisibility={setVisibleWithdrawalModal}
          asset={props.asset}
        />
      </StyledModal>
      <div className="flex justify-center">
        {loadingPrice ? (
          <div className="flex m-4">
            <Loading size={12} spinnerColor="#000000" />
          </div>
        ) : (
          <div className="my-2">
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: "body2.fontSize",
              }}
            >
              {"1 " + props.asset + " = " + formatUnits(ethPrice, 18) + " ETH"}
            </Box>
          </div>
        )}
      </div>
      <div className="flex flex-col md:flex-row items-center justify-center py-8">
        <div className="flex flex-col items-center p-4 rounded-3xl m-8 md:m-16 bg-black/5 shadow-lg">
          <div className="flex flex-col m-4 rounded-2xl">
            <div className="flex flex-row m-2">
              <div className="flex flex-col">
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "h6.fontSize",
                    fontWeight: "bold",
                  }}
                >
                  <div className="text-black">My Reserve Balance</div>
                </Box>
              </div>
              <div className="flex flex-col ml-1">
                <Tooltip
                  content="Deposits + interest accrued by the protocol"
                  position="top"
                  minWidth={200}
                >
                  <HelpCircle fontSize="20px" color="#000000" />
                </Tooltip>
              </div>
            </div>
            <div className="flex flex-row mx-2 mb-2">
              {loadingReserve ? (
                <Loading size={12} spinnerColor="#000000" />
              ) : (
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "body16.fontSize",
                  }}
                >
                  {formatUnits(maxAmount, addresses[props.asset].decimals) +
                    " " +
                    props.asset}
                </Box>
              )}
            </div>
          </div>
          <div className="flex flex-row">
            <div className="m-4">
              <Button
                customize={{
                  backgroundColor: "grey",
                  fontSize: 20,
                  textColor: "white",
                }}
                text="Deposit"
                theme="custom"
                size="large"
                radius="12"
                onClick={async function () {
                  setVisibleDepositModal(true);
                }}
              />
            </div>
            <div className="m-4">
              <Button
                customize={{
                  backgroundColor: "grey",
                  fontSize: 20,
                  textColor: "white",
                }}
                text="Withdraw"
                theme="custom"
                size="large"
                radius="12"
                onClick={async function () {
                  setVisibleWithdrawalModal(true);
                }}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col my-16 md:mx-16">
          <div className="mb-8">
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: "h4.fontSize",
                fontWeight: "bold",
                lineHeight: 1,
              }}
            >
              <div>Supply Rate: {supplyRate / 100}%</div>
            </Box>
          </div>
          <div>
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: "body1.fontSize",
              }}
            >
              Utilization Rate:
            </Box>
            <LinearProgressWithLabel value={utilizationRate / 100} />
          </div>
          {loadingReserve ? (
            <div className="flex m-4">
              <Loading size={12} spinnerColor="#000000" />
            </div>
          ) : (
            <div>
              <div className="my-2">
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "body1.fontSize",
                  }}
                >
                  Borrow Rate: {borrowRate / 100}%
                </Box>
              </div>
              <div className="my-2">
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "body1.fontSize",
                  }}
                >
                  Underlying:{" "}
                  {formatUnits(
                    underlyingBalance,
                    addresses[props.asset].decimals
                  ) +
                    " " +
                    props.asset}
                </Box>
              </div>
              <div className="my-2">
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "body1.fontSize",
                  }}
                >
                  Debt:{" "}
                  {formatUnits(debt, addresses[props.asset].decimals) +
                    " " +
                    props.asset}
                </Box>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

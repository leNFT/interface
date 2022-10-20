import { useAccount, useNetwork, useContract, useProvider } from "wagmi";
import { Button, Tooltip, Loading } from "@web3uikit/core";
import { HelpCircle } from "@web3uikit/icons";
import StyledModal from "../../components/StyledModal";
import { formatUnits } from "@ethersproject/units";
import contractAddresses from "../../contractAddresses.json";
import { useState, useEffect } from "react";
import marketContract from "../../contracts/Market.json";
import tokenOracleContract from "../../contracts/TokenOracle.json";
import reserveContract from "../../contracts/Reserve.json";
import LinearProgressWithLabel from "../../components/LinearProgressWithLabel";
import Deposit from "../../components/Deposit";
import Withdraw from "../../components/Withdraw";
import Box from "@mui/material/Box";
import erc20 from "../../contracts/erc20.json";
import { ethers } from "ethers";
import Router from "next/router";
import { useRouter } from "next/router";
import { ChevronLeft } from "@web3uikit/icons";

export default function Reserve() {
  const router = useRouter();
  const [debt, setDebt] = useState("0");
  const [asset, setAsset] = useState("");
  const [assetSymbol, setAssetSymbol] = useState("");
  const [visibleDepositModal, setVisibleDepositModal] = useState(false);
  const [visibleWithdrawalModal, setVisibleWithdrawalModal] = useState(false);
  const [maxAmount, setMaxAmount] = useState("0");
  const [underlyingBalance, setUnderlyingBalance] = useState("0");
  const [supplyRate, setSupplyRate] = useState(0);
  const [borrowRate, setBorrowRate] = useState(0);
  const [utilizationRate, setUtilizationRate] = useState(0);
  const [ethPrice, setETHPrice] = useState("0");
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [loadingReserve, setLoadingReserve] = useState(false);
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();

  const provider = useProvider();

  const addresses =
    chain && chain.id in contractAddresses
      ? contractAddresses[chain.id]
      : contractAddresses["1"];

  const market = useContract({
    contractInterface: marketContract.abi,
    addressOrName: addresses.Market,
    signerOrProvider: provider,
  });

  const tokenOracle = useContract({
    contractInterface: tokenOracleContract.abi,
    addressOrName: addresses.TokenOracle,
    signerOrProvider: provider,
  });

  const reserve = useContract({
    contractInterface: reserveContract.abi,
    addressOrName: router.query.address,
    signerOrProvider: provider,
  });

  async function updateAssetETHPrice() {
    const updatedAssetETHPrice = (
      await tokenOracle.getTokenETHPrice(asset)
    ).toString();
    setETHPrice(updatedAssetETHPrice);
    console.log("updatedAssetETHPrice", updatedAssetETHPrice);

    //Stop loading
    setLoadingPrice(false);
  }

  async function getReserveDetails() {
    const updatedDebt = await reserve.getDebt();
    console.log("Updated Debt:", updatedDebt);
    setDebt(updatedDebt.toString());

    const updatedAsset = await reserve.getAsset();
    console.log("Updated Asset:", updatedAsset);
    setAsset(updatedAsset.toString());

    const assetContract = new ethers.Contract(updatedAsset, erc20, provider);
    const updatedAssetSymbol = await assetContract.symbol();
    console.log("Updated Asset Symbol:", updatedAssetSymbol);
    setAssetSymbol(
      updatedAssetSymbol.toString() == "WETH"
        ? "ETH"
        : updatedAssetSymbol.toString()
    );

    const updatedUnderlyingBalance = await reserve.getUnderlyingBalance();
    console.log("Updated Underlying Balance:", updatedUnderlyingBalance);
    setUnderlyingBalance(updatedUnderlyingBalance.toString());

    const updatedUtilizationRate = await reserve.getUtilizationRate();
    console.log("Updated Utilization Rate:", updatedUtilizationRate);
    setUtilizationRate(updatedUtilizationRate.toNumber());

    const updatedSupplyRate = await reserve.getSupplyRate();
    console.log("Updated Supply Rate:", updatedSupplyRate);
    setSupplyRate(updatedSupplyRate.toNumber());

    const updatedBorrowRate = await reserve.getBorrowRate();
    console.log("Updated Borrow Rate:", updatedBorrowRate);
    setBorrowRate(updatedBorrowRate.toNumber());

    const updatedMaxAmount = await reserve.getMaximumWithdrawalAmount(address);
    console.log("Updated Max Withdrawal Amount:", updatedMaxAmount);
    setMaxAmount(updatedMaxAmount.toString());

    //Stop loading
    setLoadingReserve(false);
  }

  useEffect(() => {
    if (isConnected && asset) {
      console.log("router.query.address", router.query.address);
      setLoadingPrice(true);
      setLoadingReserve(true);
      updateAssetETHPrice();
    }
  }, [isConnected, address, chain]);

  // Set the rest of the UI when we receive the reserve address
  useEffect(() => {
    console.log("router", router.query);
    if (router.query != undefined) {
      console.log(
        "Got reserve address, setting the rest...",
        router.query.address
      );
      getReserveDetails();
    }
  }, [address, router.query.address]);

  return (
    <div>
      <StyledModal
        hasFooter={false}
        title={"Deposit " + assetSymbol}
        isVisible={visibleDepositModal}
        width="50%"
        onCloseButtonPressed={function () {
          setVisibleDepositModal(false);
        }}
      >
        <Deposit
          setVisibility={setVisibleDepositModal}
          reserve={router.query.address}
          assetSymbol={assetSymbol}
          asset={asset}
          updateUI={getReserveDetails}
        />
      </StyledModal>
      <StyledModal
        hasFooter={false}
        title={"Withdraw " + assetSymbol}
        width="50%"
        isVisible={visibleWithdrawalModal}
        onCloseButtonPressed={function () {
          setVisibleWithdrawalModal(false);
        }}
      >
        <Withdraw
          setVisibility={setVisibleWithdrawalModal}
          reserve={router.query.address}
          assetSymbol={assetSymbol}
          asset={asset}
          updateUI={getReserveDetails}
        />
      </StyledModal>
      <div className="flex flex-row justify-left pl-8">
        <Button
          size="small"
          color="#eae5ea"
          iconLayout="icon-only"
          icon={<ChevronLeft fontSize="50px" />}
          onClick={async function () {
            Router.push({
              pathname: "/reserves",
            });
          }}
        />
      </div>
      <div className="flex flex-row justify-center">
        {loadingPrice ? (
          <Loading size={12} spinnerColor="#000000" />
        ) : (
          <Box
            sx={{
              fontFamily: "Monospace",
              fontSize: "body2.fontSize",
            }}
          >
            {"1 " + assetSymbol + " = " + formatUnits(ethPrice, 18) + " ETH"}
          </Box>
        )}
      </div>
      <div className="flex flex-col-reverse md:flex-row items-center justify-center p-4 rounded-3xl m-8 lg:m-16 !mt-8 bg-black/5 shadow-lg">
        <div className="flex flex-col items-center p-4 rounded-3xl m-8 lg:m-16 bg-black/5 shadow-lg">
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
                  {formatUnits(maxAmount, 18) + " " + assetSymbol}
                </Box>
              )}
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center ">
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
        <div className="flex flex-col m-8 lg:my-16 lg:mx-16">
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
                  {formatUnits(underlyingBalance, 18) + " " + assetSymbol}
                </Box>
              </div>
              <div className="my-2">
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "body1.fontSize",
                  }}
                >
                  Debt: {formatUnits(debt, 18) + " " + assetSymbol}
                </Box>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

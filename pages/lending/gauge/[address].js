import { useState, useEffect } from "react";
import { Button, Tooltip, Loading, Typography } from "@web3uikit/core";
import { HelpCircle } from "@web3uikit/icons";
import { BigNumber } from "@ethersproject/bignumber";
import StyledModal from "../../../components/StyledModal";
import { formatUnits } from "@ethersproject/units";
import contractAddresses from "../../../contractAddresses.json";
import lendingGaugeContract from "../../../contracts/LendingGauge.json";
import StakeLendingGauge from "../../../components/gauges/StakeLendingGauge";
import UnstakeLendingGauge from "../../../components/gauges/UnstakeLendingGauge";
import Box from "@mui/material/Box";
import { ethers } from "ethers";
import {
  useAccount,
  useNetwork,
  useContract,
  useProvider,
  useSigner,
} from "wagmi";
import Router from "next/router";
import { useRouter } from "next/router";
import { ChevronLeft } from "@web3uikit/icons";
import { ExternalLink } from "@web3uikit/icons";

export default function TradingPoolGauge() {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const router = useRouter();
  const { data: signer } = useSigner();
  const [lpToken, setLPToken] = useState("");
  const [boost, setBoost] = useState(0);
  const [claimableRewards, setClaimableRewards] = useState("0");
  const [visibleStakeModal, setVisibleStakeModal] = useState(false);
  const [visibleUnstakeModal, setVisibleUnstakeModal] = useState(false);
  const [loadingGauge, setLoadingGauge] = useState(false);
  const [clamingLoading, setClaimingLoading] = useState(false);

  const provider = useProvider();
  const addresses =
    chain && chain.id in contractAddresses
      ? contractAddresses[chain.id]
      : contractAddresses["1"];

  const gaugeProvider = useContract({
    contractInterface: lendingGaugeContract.abi,
    addressOrName: router.query.address,
    signerOrProvider: provider,
  });

  const gaugeSigner = useContract({
    contractInterface: lendingGaugeContract.abi,
    addressOrName: router.query.address,
    signerOrProvider: signer,
  });

  // Update the UI
  async function updateUI() {
    // Set gauge details
    const lpTokenResponse = await gaugeProvider.lpToken();
    setLPToken(lpTokenResponse.toString());

    const boostResponse = await gaugeProvider.userBoost(address);
    setBoost(boostResponse.toNumber());

    const stakedLPsBalanceResponse = await gaugeProvider.balanceOf(address);
    const stakedLPsAmount = stakedLPsBalanceResponse.toNumber();

    // Get staked lp positions
    const newStakedLps = [];

    for (let i = 0; i < stakedLPsAmount; i++) {
      const stakedLPResponse = await gaugeProvider.lpOfOwnerByIndex(address, i);
      const stakedLP = stakedLPResponse.toNumber();

      newStakedLps.push(stakedLP);
    }

    setStakedLPs(newStakedLps);

    // Get the claimable rewards
    const updatedClaimableRewards = await gaugeProvider.callStatic.claim({
      from: address,
    });
    console.log("updatedClaimableRewards", updatedClaimableRewards);
    setClaimableRewards(updatedClaimableRewards.toString());
  }

  // Set the rest of the UI when we receive the reserve address
  useEffect(() => {
    console.log("router", router.query.address);
    if (router.query.address != undefined && isConnected && address) {
      updateUI();
    }
  }, [isConnected, router.query.address, address]);

  const handleClaimingSuccess = async function () {
    dispatch({
      type: "success",
      message: "You have claimed your rewards.",
      title: "Claim Successful!",
      position: "topR",
    });
  };

  return (
    <div>
      <StyledModal
        hasFooter={false}
        title={"Stake LP"}
        isVisible={visibleStakeModal}
        width="50%"
        onCloseButtonPressed={function () {
          setVisibleStakeModal(false);
        }}
      >
        <StakeLendingGauge
          setVisibility={setVisibleStakeModal}
          gauge={router.query.address}
          lpToken={lpToken}
          updateUI={updateUI}
        />
      </StyledModal>
      <StyledModal
        hasFooter={false}
        title={"Unstake LP"}
        width="50%"
        isVisible={visibleUnstakeModal}
        onCloseButtonPressed={function () {
          setVisibleUnstakeModal(false);
        }}
      >
        <UnstakeLendingGauge
          setVisibility={setVisibleUnstakeModal}
          gauge={router.query.address}
          lpToken={lpToken}
          updateUI={updateUI}
        />
      </StyledModal>
      <div className="flex flex-row justify-center">
        <div className="flex flex-col justify-center mr-auto ml-4">
          <Button
            size="small"
            color="#eae5ea"
            iconLayout="icon-only"
            icon={<ChevronLeft fontSize="50px" />}
            onClick={async function () {
              Router.push({
                pathname: "/tradingPools",
              });
            }}
          />
        </div>
        <div className="flex flex-col justify-center break-all ml-4">
          <Box
            sx={{
              fontFamily: "Monospace",
              fontSize: "body2.fontSize",
            }}
          >
            {router.query.address}
          </Box>
        </div>
        <div className="flex flex-col justify-center pb-1 mr-auto">
          <Button
            size="large"
            color="#eae5ea"
            iconLayout="icon-only"
            icon={<ExternalLink fontSize="20px" />}
            onClick={async function (_event) {
              if (chain.id == 1) {
                window.open(
                  "https://etherscan.io/address/" + router.query.address,
                  "_blank"
                );
              } else if (chain.id == 5) {
                window.open(
                  "https://goerli.etherscan.io/address/" + router.query.address,
                  "_blank"
                );
              }
            }}
          />
        </div>
      </div>
      <div className="flex flex-col md:flex-row items-center justify-center p-4 rounded-3xl m-8 lg:m-16 !mt-8 bg-black/5 shadow-lg">
        <div className="flex flex-col m-8 lg:mx-16">
          <div className="flex flex-col items-center p-4 rounded-3xl min-w-[280px] m-2 bg-black/5 shadow-lg">
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
                    My Gauge Info
                  </Box>
                </div>
                <div className="flex flex-col ml-1">
                  <Tooltip
                    content="The sum of all your LPs in this pool"
                    position="top"
                    minWidth={200}
                  >
                    <HelpCircle fontSize="20px" color="#000000" />
                  </Tooltip>
                </div>
              </div>
              <div className="flex flex-row m-2">
                <div className="flex flex-col">
                  <Box
                    sx={{
                      fontFamily: "Monospace",
                      fontSize: "h5.fontSize",
                      fontWeight: "bold",
                    }}
                  >
                    {"Staked Amount: "}
                  </Box>
                </div>
              </div>
              <div className="flex flex-row m-2">
                <div className="flex flex-col">
                  <Box
                    sx={{
                      fontFamily: "Monospace",
                      fontSize: "h5.fontSize",
                      fontWeight: "bold",
                    }}
                  >
                    {boost / 10000 + "x Boost"}
                  </Box>
                </div>
              </div>
            </div>
            <div className="flex flex-row items-center ">
              <div className="m-4">
                <Button
                  customize={{
                    backgroundColor: "grey",
                    fontSize: 20,
                    textColor: "white",
                  }}
                  text="Stake in Gauge"
                  theme="custom"
                  size="large"
                  radius="12"
                  onClick={async function () {
                    setVisibleStakeModal(true);
                  }}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center rounded-3xl m-2 bg-black/5 shadow-lg">
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
                    Claimable:
                  </Box>
                </div>
                <div className="flex flex-col ml-1">
                  <Tooltip
                    content="The amount available to claim from this gauge"
                    position="top"
                    minWidth={200}
                  >
                    <HelpCircle fontSize="20px" color="#000000" />
                  </Tooltip>
                </div>
              </div>
              <div className="flex flex-row m-2">
                <div className="flex flex-col">
                  <Box
                    sx={{
                      fontFamily: "Monospace",
                      fontSize: "h6.fontSize",
                      fontWeight: "bold",
                    }}
                  >
                    {formatUnits(claimableRewards, 18) + " LE"}
                  </Box>
                </div>
              </div>
            </div>
            <div className="flex flex-row items-center ">
              <div className="mb-4">
                <Button
                  customize={{
                    backgroundColor: "grey",
                    fontSize: 20,
                    textColor: "white",
                  }}
                  text="Claim"
                  theme="custom"
                  size="large"
                  radius="12"
                  loadingProps={{
                    spinnerColor: "#000000",
                    spinnerType: "loader",
                    direction: "right",
                    size: "24",
                  }}
                  disabled={BigNumber.from(claimableRewards).eq(0)}
                  loadingText=""
                  isLoading={clamingLoading}
                  onClick={async function () {
                    try {
                      setClaimingLoading(true);
                      console.log("signer.", signer);
                      const tx = await gaugeSigner.claim();
                      await tx.wait(1);
                      handleClaimingSuccess();
                    } catch (error) {
                      console.log(error);
                    } finally {
                      setClaimingLoading(false);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Button, Tooltip, Loading, Typography } from "@web3uikit/core";
import { HelpCircle } from "@web3uikit/icons";
import { BigNumber } from "@ethersproject/bignumber";
import StyledModal from "../../../components/StyledModal";
import { formatUnits } from "@ethersproject/units";
import { getAddressNFTs } from "../../../helpers/getAddressNFTs.js";
import contractAddresses from "../../../contractAddresses.json";
import tradingGaugeContract from "../../../contracts/TradingGauge.json";
import StakeTradingGauge from "../../../components/gauges/StakeTradingGauge";
import UnstakeTradingGauge from "../../../components/gauges/UnstakeTradingGauge";
import Box from "@mui/material/Box";
import { ethers } from "ethers";
import Card from "@mui/material/Card";
import { CardActionArea } from "@mui/material";
import CardContent from "@mui/material/CardContent";
import { useAccount, useNetwork, useContract, useProvider } from "wagmi";
import Router from "next/router";
import { useRouter } from "next/router";
import { ChevronLeft } from "@web3uikit/icons";
import { ExternalLink } from "@web3uikit/icons";

export default function TradingPoolGauge() {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const router = useRouter();
  const [lpToken, setLPToken] = useState("");
  const [boost, setBoost] = useState(0);
  const [stakedLPs, setStakedLPs] = useState([]);
  const [selectedLP, setSelectedLP] = useState();
  const [visibleStakeModal, setVisibleStakeModal] = useState(false);
  const [visibleUnstakeModal, setVisibleUnstakeModal] = useState(false);
  const [loadingGauge, setLoadingGauge] = useState(false);
  const [clamingLoading, setClaimingLoading] = useState(false);

  const provider = useProvider();
  const addresses =
    chain && chain.id in contractAddresses
      ? contractAddresses[chain.id]
      : contractAddresses["1"];

  async function updateUI() {
    const gauge = new ethers.Contract(
      router.query.address,
      tradingGaugeContract.abi,
      provider
    );

    // Set gauge details
    const lpTokenResponse = await gauge.lpToken();
    setLPToken(lpTokenResponse.toString());

    const boostResponse = await gauge.userBoost(address);
    setBoost(boostResponse.toNumber());

    const stakedLPsBalanceResponse = await gauge.balanceOf(address);
    const stakedLPsAmount = stakedLPsBalanceResponse.toNumber();

    // Get staked lp positions
    const newStakedLps = [];

    for (let i = 0; i < stakedLPsAmount; i++) {
      const stakedLPResponse = await gauge.lpOfOwnerByIndex(address, i);
      const stakedLP = stakedLPResponse.toNumber();

      newStakedLps.push(stakedLP);
    }

    setStakedLPs(newStakedLps);
  }

  // Set the rest of the UI when we receive the reserve address
  useEffect(() => {
    console.log("router", router.query.address);
    if (router.query.address != undefined && isConnected) {
      updateUI();
    }
  }, [isConnected, router.query.address]);

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
        <StakeTradingGauge
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
        <UnstakeTradingGauge
          setVisibility={setVisibleUnstakeModal}
          gauge={router.query.address}
          lpToken={lpToken}
          selectedLP={selectedLP}
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
          <div className="flex flex-col items-center p-4 rounded-3xl m-2 bg-black/5 shadow-lg">
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
                    {stakedLPs.length + " staked LPs"}
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
                      fontSize: "h6.fontSize",
                      fontWeight: "bold",
                    }}
                  >
                    {"0 WETH"}
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
                  disabled={false}
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
        <div className="flex flex-col border-4 border-slate-400 rounded-2xl p-8 m-8 lg:py-16 lg:px-16">
          {loadingGauge ? (
            <div className="flex m-4">
              <Loading size={12} spinnerColor="#000000" />
            </div>
          ) : (
            <div>
              {stakedLPs.length == 0 ? (
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "subtitle1.fontSize",
                  }}
                >
                  <div>{"No LP Positions staked in this gauge."}</div>
                </Box>
              ) : (
                <div className="flex grid grid-cols-1 md:grid-cols-2 gap-2">
                  {stakedLPs.map((data) => (
                    <div
                      key={data}
                      className="flex m-4 items-center justify-center max-w-[300px]"
                    >
                      <Card
                        sx={{
                          borderRadius: 4,
                          background:
                            "linear-gradient(to right bottom, #eff2ff, #f0e5e9)",
                        }}
                      >
                        <CardActionArea
                          onClick={function () {
                            setSelectedLP(data);
                            setVisibleUnstakeModal(true);
                          }}
                        >
                          <CardContent>
                            <Box
                              sx={{
                                fontFamily: "Monospace",
                                fontSize: "subtitle1.fontSize",
                              }}
                            >
                              <div className="flex flex-col mt-2 items-center text-center">
                                <div>{"LP Position"}</div>
                                <div>{"#" + data}</div>
                              </div>
                            </Box>
                          </CardContent>
                        </CardActionArea>
                      </Card>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

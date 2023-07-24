import {
  useAccount,
  useBalance,
  useNetwork,
  useContract,
  useProvider,
  useSigner,
} from "wagmi";
import Box from "@mui/material/Box";
import { BigNumber } from "@ethersproject/bignumber";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import { CardActionArea } from "@mui/material";
import { getAddressNFTs } from "../../helpers/getAddressNFTs.js";
import { formatUnits, parseUnits } from "@ethersproject/units";
import { useNotification, Button } from "@web3uikit/core";
import styles from "../../styles/Home.module.css";
import contractAddresses from "../../contractAddresses.json";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import tradingGaugeContract from "../../contracts/TradingGauge.json";
import tradingPoolContract from "../../contracts/TradingPool.json";
import erc721 from "../../contracts/erc721.json";

export default function StakeTradingGauge(props) {
  const [userLPs, setUserLPs] = useState([]);
  const [selectedLP, setSelectedLP] = useState();
  const [selectingLP, setSelectingLP] = useState(false);
  const [approvedLP, setApprovedLP] = useState(false);
  const [approvalLPLoading, setApprovalLPLoading] = useState(false);
  const [stakeLoading, setStakeLoading] = useState(false);
  const dispatch = useNotification();
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const provider = useProvider();
  const { data: signer } = useSigner();
  const [lpsValue, setLpsValue] = useState([]);
  console.log("props.lpToken", props.lpToken);

  async function getUserLPs() {
    // Get lp positions
    const addressNFTs = await getAddressNFTs(address, props.lpToken, chain.id);

    console.log("addressNFTs", addressNFTs);

    const gauge = new ethers.Contract(
      props.gauge,
      tradingGaugeContract.abi,
      provider
    );

    const pool = new ethers.Contract(
      props.lpToken,
      tradingPoolContract.abi,
      provider
    );

    // Get lp values
    var newLpsValue = [];
    for (let i = 0; i < addressNFTs.length; i++) {
      console.log("addressNFTs[i].tokenId", addressNFTs[i].tokenId);
      const lp = await pool.getLP(addressNFTs[i].tokenId);
      console.log("lp", lp);
      const lpValue = await gauge.calculateLpValue(
        lp.nftIds.length,
        lp.tokenAmount,
        lp.spotPrice
      );
      console.log("lpValue", lpValue);
      newLpsValue.push(lpValue);
    }
    console.log("newLpsValue", newLpsValue);
    setLpsValue(newLpsValue);
    setUserLPs(addressNFTs);
  }

  async function getLPAllowance() {
    const lpToken = new ethers.Contract(props.lpToken, erc721, provider);

    const allowed = await lpToken.isApprovedForAll(address, props.gauge);

    console.log("Got nft allowed:", allowed);

    if (allowed) {
      setApprovedLP(true);
    } else {
      setApprovedLP(false);
    }
  }

  // Set the rest of the UI when we receive the reserve address
  useEffect(() => {
    if (isConnected && props.lpToken && props.gauge) {
      console.log("Got trading pool address, setting the rest...", props.pool);
      getLPAllowance();
      getUserLPs();
    }
  }, [isConnected, props.lpToken, props.gauge]);

  const handleStakeSuccess = async function () {
    props.updateUI();
    props.setVisibility(false);
    dispatch({
      type: "success",
      message: "Your LP was staked in the gauge.",
      title: "Stake Successful!",
      position: "bottomL",
    });
  };

  const handleLPApprovalSuccess = async function () {
    setApprovedLP(true);
    dispatch({
      type: "success",
      message: "You can now stake.",
      title: "Approval Successful!",
      position: "bottomL",
    });
  };

  return (
    <div className={styles.container}>
      <div className="flex flex-col items-center justify-center m-8">
        {approvedLP ? (
          <Button
            text={
              userLPs.length == 0
                ? "No LPs to stake"
                : selectedLP !== undefined
                ? "Selected LP #" + selectedLP
                : "Please select an LP to stake"
            }
            theme="secondary"
            isFullWidth
            loadingProps={{
              spinnerColor: "#000000",
              spinnerType: "loader",
              direction: "right",
              size: "24",
            }}
            loadingText=""
            onClick={async function () {
              setSelectingLP(!selectingLP);
            }}
          />
        ) : (
          <Button
            text="Approve LP"
            theme="secondary"
            isFullWidth
            loadingProps={{
              spinnerColor: "#000000",
              spinnerType: "loader",
              direction: "right",
              size: "24",
            }}
            loadingText=""
            isLoading={approvalLPLoading}
            onClick={async function () {
              const lpTokenSigner = new ethers.Contract(
                props.lpToken,
                erc721,
                signer
              );
              try {
                setApprovalLPLoading(true);
                console.log("signer.", signer);

                const tx = await lpTokenSigner.setApprovalForAll(
                  props.gauge,
                  true
                );
                await tx.wait(1);
                handleLPApprovalSuccess();
              } catch (error) {
                console.log(error);
              } finally {
                setApprovalLPLoading(false);
              }
            }}
          ></Button>
        )}
      </div>
      {selectingLP && userLPs.length > 0 && (
        <div>
          <Box
            sx={{
              fontFamily: "Monospace",
              fontSize: "caption.fontSize",
              fontWeight: "bold",
              color: "#be4d25",
            }}
            className="m-2 text-center"
          >
            {"Only LPs with a value higher than 0 ETH can be staked. "}

            <a
              href={
                "https://lenft.gitbook.io/lenft-docs/trading/deposit-in-a-trading-pool"
              }
              target="_blank"
              rel="noreferrer"
              className="text-blue-700 underline text-xs"
            >
              What is LP value?
            </a>
          </Box>
          <div className="grid gap-4 md:grid-cols-2">
            {userLPs.map((lp, index) => (
              <Card
                sx={{
                  width: "180px",
                  borderRadius: 4,
                  background: BigNumber.from(lpsValue[index]).eq(0)
                    ? "#A2A2A2"
                    : selectedLP == BigNumber.from(lp.tokenId).toNumber()
                    ? "linear-gradient(to right bottom, #fccb90 0%, #d57eeb 100%)"
                    : "linear-gradient(to right bottom, #eff2ff, #f0e5e9)",
                }}
                className="flex flex-col justify-self-center"
                key={BigNumber.from(lp.tokenId).toNumber()}
              >
                <CardActionArea
                  disabled={BigNumber.from(lpsValue[index]).eq(0)}
                  onClick={function () {
                    if (selectedLP == BigNumber.from(lp.tokenId).toNumber()) {
                      setSelectedLP();
                    } else {
                      setSelectedLP(BigNumber.from(lp.tokenId).toNumber());
                    }
                  }}
                >
                  <div className="flex flex-col items-center p-4 text-center space-y-2 justify-center">
                    <Box
                      sx={{
                        fontFamily: "Monospace",
                        fontSize: "caption",
                      }}
                    >
                      {"LP #" + BigNumber.from(lp.tokenId).toNumber()}
                    </Box>
                    <Box
                      sx={{
                        fontFamily: "Monospace",
                        fontSize: "caption",
                      }}
                    >
                      {formatUnits(lpsValue[index], 18) + " ETH"}
                    </Box>
                  </div>
                </CardActionArea>
              </Card>
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-row items-center justify-center m-8">
        <Button
          text={"Stake LP"}
          theme="secondary"
          isFullWidth
          loadingProps={{
            spinnerColor: "#000000",
            spinnerType: "loader",
            direction: "right",
            size: "24",
          }}
          disabled={!approvedLP}
          loadingText=""
          isLoading={stakeLoading}
          onClick={async function () {
            const gauge = new ethers.Contract(
              props.gauge,
              tradingGaugeContract.abi,
              signer
            );
            try {
              setStakeLoading(true);
              console.log("signer.", signer);
              const tx = await gauge.deposit(selectedLP);
              await tx.wait(1);
              handleStakeSuccess();
            } catch (error) {
              console.log(error);
            } finally {
              setStakeLoading(false);
            }
          }}
        ></Button>
      </div>
    </div>
  );
}

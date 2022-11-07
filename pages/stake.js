import styles from "../styles/Home.module.css";
import contractAddresses from "../contractAddresses.json";
import nativeTokenVaultContract from "../contracts/NativeTokenVault.json";
import tokenOracleContract from "../contracts/TokenOracle.json";
import Link from "@mui/material/Link";
import { getSupportedNFTs } from "../helpers/getSupportedNFTs.js";
import { formatUnits } from "@ethersproject/units";
import { ethers } from "ethers";
import { BigNumber } from "@ethersproject/bignumber";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { getStakingInfo } from "../helpers/getStakingInfo.js";
import { Button, Loading, Typography } from "@web3uikit/core";
import StyledModal from "../components/StyledModal";
import { useState, useEffect } from "react";
import { useAccount, useNetwork } from "wagmi";
import erc20 from "../contracts/erc20.json";
import erc721 from "../contracts/erc721.json";
import RemoveVote from "../components/RemoveVote";
import Vote from "../components/Vote";
import DepositNativeToken from "../components/DepositNativeToken";
import WithdrawNativeToken from "../components/WithdrawNativeToken";
import { useContract, useProvider } from "wagmi";
import Box from "@mui/material/Box";

export default function Stake() {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const provider = useProvider();
  const [nativeTokenBalance, setNativeTokenBalance] = useState("0");
  const [voteTokenBalance, setVoteTokenBalance] = useState("0");
  const [freeVotes, setFreeVotes] = useState("0");
  const [maxAmount, setMaxAmount] = useState("0");
  const [collectionVotes, setCollectionVotes] = useState("0");
  const [visibleDepositModal, setVisibleDepositModal] = useState(false);
  const [visibleWithdrawalModal, setVisibleWithdrawalModal] = useState(false);
  const [visibleVoteModal, setVisibleVoteModal] = useState(false);
  const [visibleRemoveVoteModal, setVisibleRemoveVoteModal] = useState(false);
  const [collectionBoost, setCollectionBoost] = useState(0);
  const [apr, setAPR] = useState("0");

  const addresses =
    chain && chain.id in contractAddresses
      ? contractAddresses[chain.id]
      : contractAddresses["1"];
  const [selectedCollection, setSelectedCollection] = useState();
  const [collections, setCollections] = useState();

  const nativeTokenVault = useContract({
    contractInterface: nativeTokenVaultContract.abi,
    addressOrName: addresses.NativeTokenVault,
    signerOrProvider: provider,
  });

  const nativeToken = useContract({
    contractInterface: erc20,
    addressOrName: addresses.NativeToken,
    signerOrProvider: provider,
  });

  async function updateUI() {
    // Get the native token balance
    const nativeTokenBalance = await nativeToken.balanceOf(address);
    setNativeTokenBalance(nativeTokenBalance.toString());

    //Get the vote token Balance
    const voteTokenBalance = await nativeTokenVault.balanceOf(address);
    setVoteTokenBalance(voteTokenBalance.toString());

    //Get the vote token Balance
    const freeVotes = await nativeTokenVault.getUserFreeVotes(address);
    setFreeVotes(freeVotes.toString());

    const updatedMaxAmount = (
      await nativeTokenVault.getMaximumWithdrawalAmount(address)
    ).toString();

    console.log("Updated Max Withdrawal Amount:", updatedMaxAmount);
    setMaxAmount(updatedMaxAmount);

    const stakingInfo = await getStakingInfo(chain.id);
    const updatedAPR = stakingInfo.apr;
    setAPR(updatedAPR);
    console.log("updatedAPR", updatedAPR);
  }

  async function updateCollections() {
    //Fill the collections with the supported assets
    const supportedNFTs = await getSupportedNFTs(chain.id);
    console.log("supportedNFTs", supportedNFTs);
    const updatedCollections = [];
    for (const nftAddress in supportedNFTs) {
      const nft = new ethers.Contract(nftAddress, erc721, provider);
      updatedCollections.push({
        label: await nft.name(),
        address: nftAddress,
      });
    }
    console.log("updatedCollections", updatedCollections);
    setCollections(updatedCollections);
  }

  useEffect(() => {
    if (isConnected) {
      updateUI();
      updateCollections();
    }
  }, [isConnected]);

  async function updateCollectionDetails(collection) {
    if (!collection) {
      setCollectionVotes("0");
      setCollectionBoost("0");
      return;
    }
    // Get the collection votes
    const updatedCollectionVotes =
      await nativeTokenVault.getUserCollectionVotes(
        address,
        collection.address
      );
    console.log("collectionVotes", updatedCollectionVotes);
    setCollectionVotes(updatedCollectionVotes.toString());

    // Get the collection collateralization boost
    const updatedCollectionBoost =
      await nativeTokenVault.getVoteCollateralizationBoost(
        address,
        collection.address
      );
    console.log("collectionBoost", updatedCollectionBoost);
    setCollectionBoost(updatedCollectionBoost.toString());
  }

  function handleCollectionChange(event, value) {
    console.log("value", value);
    console.log("collections", collections);
    const collection = collections.find(
      (collection) => collection.label == value
    );
    setSelectedCollection(collection);
    updateCollectionDetails(collection);
  }

  return (
    <div className={styles.container}>
      <StyledModal
        hasFooter={false}
        title="Deposit LE"
        isVisible={visibleDepositModal}
        width="50%"
        onCloseButtonPressed={function () {
          setVisibleDepositModal(false);
        }}
      >
        <DepositNativeToken
          setVisibility={setVisibleDepositModal}
          updateUI={updateUI}
        />
      </StyledModal>
      <StyledModal
        hasFooter={false}
        title="Withdraw LE"
        width="50%"
        isVisible={visibleWithdrawalModal}
        onCloseButtonPressed={function () {
          setVisibleWithdrawalModal(false);
        }}
      >
        <WithdrawNativeToken
          setVisibility={setVisibleWithdrawalModal}
          maxAmount={maxAmount}
          updateUI={updateUI}
        />
      </StyledModal>
      <StyledModal
        hasFooter={false}
        title={
          "Vote for " + (selectedCollection ? selectedCollection.label : "")
        }
        width="50%"
        isVisible={visibleVoteModal}
        onCloseButtonPressed={function () {
          setVisibleVoteModal(false);
        }}
      >
        <Vote
          {...selectedCollection}
          setVisibility={setVisibleVoteModal}
          updateUI={updateUI}
          freeVotes={freeVotes}
        />
      </StyledModal>
      <StyledModal
        hasFooter={false}
        title={
          "Remove vote from " +
          (selectedCollection ? selectedCollection.label : "")
        }
        width="50%"
        isVisible={visibleRemoveVoteModal}
        onCloseButtonPressed={function () {
          setVisibleRemoveVoteModal(false);
        }}
      >
        <RemoveVote
          {...selectedCollection}
          setVisibility={setVisibleRemoveVoteModal}
          updateUI={updateUI}
          collectionVotes={collectionVotes}
        />
      </StyledModal>
      <div className="flex flex-col items-center">
        <div className="flex flex-row items-center justify-center min-w-[75%] border-4 m-2 rounded-3xl bg-black/5 shadow-lg">
          <Box
            sx={{
              fontFamily: "Monospace",
              fontSize: "h6.fontSize",
            }}
          >
            <div className="text-break max-w-lg p-4">
              Please be careful and{" "}
              <Link
                target="_blank"
                href="https://lenft.gitbook.io/lenft-docs/le-token-mechanics/stake"
              >
                understand the leNFT vault dynamics
              </Link>{" "}
              before depositing into it. Your tokens are at risk.
            </div>
          </Box>
        </div>
        <div className="flex flex-col min-w-[75%] border-4 m-2 md:m-8 rounded-3xl bg-black/5 shadow-lg">
          <div className="flex flex-row items-center justify-center mt-4">
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: "h6.fontSize",
              }}
            >
              {"Vault APR = " + apr + "%"}
            </Box>
          </div>
          <div className="flex flex-col-reverse md:flex-row items-center justify-center">
            <div className="flex flex-col items-center m-4 lg:m-8">
              <div className="flex flex-row m-2">
                <Button
                  customize={{
                    backgroundColor: "grey",
                    fontSize: 16,
                    textColor: "white",
                  }}
                  text="Vault Deposit"
                  theme="custom"
                  size="large"
                  radius="12"
                  onClick={async function () {
                    setVisibleDepositModal(true);
                  }}
                />
              </div>
              <div className="flex flex-row m-2">
                <Button
                  customize={{
                    backgroundColor: "grey",
                    fontSize: 16,
                    textColor: "white",
                  }}
                  text="Vault Withdraw"
                  theme="custom"
                  size="large"
                  radius="12"
                  onClick={async function () {
                    setVisibleWithdrawalModal(true);
                  }}
                />
              </div>
            </div>
            <div className="flex flex-col m-4 lg:m-8">
              <div className="flex flex-col m-2">
                <div className="flex flex-row">
                  <Box
                    sx={{
                      fontFamily: "Monospace",
                      fontSize: "h5.fontSize",
                      fontWeight: "bold",
                    }}
                  >
                    My Balance
                  </Box>
                </div>
                <div className="flex flex-row">
                  <Box
                    sx={{
                      fontFamily: "Monospace",
                      fontSize: "subtitle1.fontSize",
                    }}
                  >
                    {Number(formatUnits(nativeTokenBalance, 18)).toFixed(2)} LE
                  </Box>
                </div>
              </div>
              <div className="flex flex-col m-2">
                <div className="flex flex-row">
                  <Box
                    sx={{
                      fontFamily: "Monospace",
                      fontSize: "h5.fontSize",
                      fontWeight: "bold",
                    }}
                  >
                    My Vault Balance
                  </Box>
                </div>
                <div className="flex flex-row">
                  <Box
                    sx={{
                      fontFamily: "Monospace",
                      fontSize: "subtitle1.fontSize",
                    }}
                  >
                    {Number(formatUnits(voteTokenBalance, 18)).toFixed(2) +
                      " veLE"}
                  </Box>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center min-w-[75%] border-4 m-2 md:m-8 rounded-3xl bg-black/5 shadow-lg">
          <div className="flex flex-col md:flex-row min-w-[85%] items-center m-4 justify-center">
            <div className="flex flex-row m-4">
              <div className="flex flex-col m-4">
                <div className="flex flex-row">
                  <Box
                    sx={{
                      fontFamily: "Monospace",
                      fontSize: "h6.fontSize",
                      fontWeight: "bold",
                    }}
                  >
                    Free Votes
                  </Box>
                </div>
                <div className="flex flex-row">
                  <Box
                    sx={{
                      fontFamily: "Monospace",
                      fontSize: "subtitle1.fontSize",
                    }}
                  >
                    {Number(formatUnits(freeVotes, 18)).toFixed(2)} veLE
                  </Box>
                </div>
              </div>
              <div className="flex flex-col m-4">
                <div className="flex flex-row">
                  <Box
                    sx={{
                      fontFamily: "Monospace",
                      fontSize: "h6.fontSize",
                      fontWeight: "bold",
                    }}
                  >
                    Used Votes
                  </Box>
                </div>
                <div className="flex flex-row">
                  <Box
                    sx={{
                      fontFamily: "Monospace",
                      fontSize: "subtitle1.fontSize",
                    }}
                  >
                    {formatUnits(
                      BigNumber.from(voteTokenBalance).sub(freeVotes),
                      18
                    )}{" "}
                    veLE
                  </Box>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-center items-center mb-8 p-2 rounded-3xl bg-black/5 shadow-lg">
            <div className="flex flex-row m-8">
              <Autocomplete
                disablePortal
                ListboxProps={{
                  style: {
                    backgroundColor: "rgb(253, 241, 244)",
                    fontFamily: "Monospace",
                  },
                }}
                options={collections}
                isOptionEqualToValue={(option, value) =>
                  option.address === value.address
                }
                sx={{ minWidth: 320 }}
                onInputChange={handleCollectionChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Supported Collections"
                    sx={{
                      "& label": {
                        paddingLeft: (theme) => theme.spacing(2),
                        fontFamily: "Monospace",
                      },
                      "& input": {
                        paddingLeft: (theme) => theme.spacing(3.5),
                        fontFamily: "Monospace",
                      },
                      "& fieldset": {
                        paddingLeft: (theme) => theme.spacing(2.5),
                        borderRadius: "25px",
                        fontFamily: "Monospace",
                      },
                    }}
                  />
                )}
              />
            </div>
            <div className="flex flex-row">
              <div className="flex flex-col justify-center m-4">
                <div className="flex flex-row justify-center items-center m-2">
                  <Button
                    customize={{
                      backgroundColor: "grey",
                      fontSize: 16,
                      textColor: "white",
                    }}
                    text="Vote"
                    disabled={selectedCollection == null}
                    theme="custom"
                    size="large"
                    radius="12"
                    onClick={async function () {
                      setVisibleVoteModal(true);
                    }}
                  />
                </div>
                <div className="flex flex-row justify-center items-center m-2">
                  <Button
                    customize={{
                      backgroundColor: "grey",
                      fontSize: 16,
                      textColor: "white",
                    }}
                    disabled={selectedCollection == null}
                    text="Remove Vote"
                    theme="custom"
                    size="large"
                    radius="12"
                    onClick={async function () {
                      setVisibleRemoveVoteModal(true);
                    }}
                  />
                </div>
              </div>
              <div className="flex flex-col m-4">
                <div className="flex flex-row m-2">
                  <div className="flex flex-col">
                    <div className="flex flex-row">
                      <Box
                        sx={{
                          fontFamily: "Monospace",
                          fontSize: "h6.fontSize",
                          fontWeight: "bold",
                        }}
                      >
                        Collection Votes
                      </Box>
                    </div>
                    <div className="flex flex-row">
                      <Box
                        sx={{
                          fontFamily: "Monospace",
                          fontSize: "subtitle1.fontSize",
                        }}
                      >
                        {formatUnits(collectionVotes, 18)} veLE
                      </Box>
                    </div>
                  </div>
                </div>
                <div className="flex flex-row m-2">
                  <div className="flex flex-col">
                    <div className="flex flex-row">
                      <Box
                        sx={{
                          fontFamily: "Monospace",
                          fontSize: "h6.fontSize",
                          fontWeight: "bold",
                        }}
                      >
                        Collection Boost
                      </Box>
                    </div>
                    <div className="flex flex-row">
                      <Box
                        sx={{
                          fontFamily: "Monospace",
                          fontSize: "subtitle1.fontSize",
                        }}
                      >
                        {collectionBoost / 100}%
                      </Box>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import styles from "../styles/Home.module.css";
import contractAddresses from "../contractAddresses.json";
import nativeTokenVaultContract from "../contracts/NativeTokenVault.json";
import { formatUnits } from "@ethersproject/units";
import { BigNumber } from "@ethersproject/bignumber";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { Button, Typography } from "@web3uikit/core";
import StyledModal from "../components/StyledModal";
import { useState, useEffect } from "react";
import { useAccount, useNetwork } from "wagmi";
import erc20 from "../contracts/erc20.json";
import RemoveVote from "../components/RemoveVote";
import Vote from "../components/Vote";
import DepositNativeToken from "../components/DepositNativeToken";
import WithdrawNativeToken from "../components/WithdrawNativeToken";
import { useContract, useProvider } from "wagmi";

export default function Stake() {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const provider = useProvider();
  const [nativeTokenBalance, setNativeTokenBalance] = useState("0");
  const [voteTokenBalance, setVoteTokenBalance] = useState("0");
  const [freeVotes, setFreeVotes] = useState("0");
  const [collectionVotes, setCollectionVotes] = useState("0");
  const [visibleDepositModal, setVisibleDepositModal] = useState(false);
  const [visibleWithdrawalModal, setVisibleWithdrawalModal] = useState(false);
  const [visibleVoteModal, setVisibleVoteModal] = useState(false);
  const [visibleRemoveVoteModal, setVisibleRemoveVoteModal] = useState(false);
  const [maxAmount, setMaxAmount] = useState("0");
  const [collectionBoost, setCollectionBoost] = useState(0);

  const addresses =
    chain && chain.id in contractAddresses
      ? contractAddresses[chain.id]
      : contractAddresses["1"];
  const [selectedCollection, setSelectedCollection] = useState({
    label: addresses.SupportedAssets[0].name,
    address: addresses.SupportedAssets[0].address,
  });
  const [collections, setCollections] = useState([
    {
      label: addresses.SupportedAssets[0].name,
      address: addresses.SupportedAssets[0].address,
    },
  ]);

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
  }

  useEffect(() => {
    if (isConnected) {
      updateUI();

      //Fill the collections with the supported assets
      var updatedCollections = [];
      console.log("SupportedAssets", addresses.SupportedAssets);
      for (var asset in addresses.SupportedAssets) {
        updatedCollections.push({
          label: addresses.SupportedAssets[asset].name,
          address: addresses.SupportedAssets[asset].address,
        });
        console.log("asset", asset);
      }
      //setCollections(updatedCollections);
      console.log("updatedCollections", updatedCollections);
      setCollections(updatedCollections);
    }
  }, [isConnected]);

  async function updateCollectionDetails(collection) {
    // Get the collection votes
    const updatedCollectionVotes =
      await nativeTokenVault.getUserCollectionVotes(address, collection);
    console.log("collectionVotes", updatedCollectionVotes);
    setCollectionVotes(updatedCollectionVotes.toString());

    // Get the collection collateralization boost
    const updatedCollectionBoost =
      await nativeTokenVault.getVoteCollateralizationBoost(address, collection);
    console.log("collectionBoost", updatedCollectionBoost);
    setCollectionBoost(updatedCollectionBoost.toString());
  }

  function handleCollectionChange(event, value) {
    console.log("value", value);
    console.log("collections", collections);
    const collection = collections.find(
      (collection) => collection.label == value
    );
    if (collection) {
      setSelectedCollection(collection);
      updateCollectionDetails(collection.address);
    }
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
        <DepositNativeToken setVisibility={setVisibleDepositModal} />
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
        <WithdrawNativeToken setVisibility={setVisibleWithdrawalModal} />
      </StyledModal>
      <StyledModal
        hasFooter={false}
        title={"Vote for " + selectedCollection.label}
        width="50%"
        isVisible={visibleVoteModal}
        onCloseButtonPressed={function () {
          setVisibleVoteModal(false);
        }}
      >
        <Vote {...selectedCollection} setVisibility={setVisibleVoteModal} />
      </StyledModal>
      <StyledModal
        hasFooter={false}
        title={"Remove vote from " + selectedCollection.label}
        width="50%"
        isVisible={visibleRemoveVoteModal}
        onCloseButtonPressed={function () {
          setVisibleRemoveVoteModal(false);
        }}
      >
        <RemoveVote
          {...selectedCollection}
          setVisibility={setVisibleRemoveVoteModal}
        />
      </StyledModal>
      <div className="flex flex-col items-center">
        <div className="flex flex-col-reverse md:flex-row items-center justify-center min-w-[75%] border-4 m-2 md:m-8 ">
          <div className="flex flex-col items-center m-4 lg:m-8">
            <div className="flex flex-row m-2">
              <Button
                customize={{
                  backgroundColor: "grey",
                  fontSize: 16,
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
            <div className="flex flex-row m-2">
              <Button
                customize={{
                  backgroundColor: "grey",
                  fontSize: 16,
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
          <div className="flex flex-col m-4 lg:m-8">
            <div className="flex flex-col m-2">
              <div className="flex flex-row">
                <Typography variant="h2">Balance</Typography>
              </div>
              <div className="flex flex-row">
                <Typography variant="body16">
                  {formatUnits(nativeTokenBalance, 18)} LE
                </Typography>
              </div>
            </div>
            <div className="flex flex-col m-2">
              <div className="flex flex-row">
                <Typography variant="h2">Vault Balance</Typography>
              </div>
              <div className="flex flex-row">
                <Typography variant="body16">
                  {formatUnits(voteTokenBalance, 18) +
                    " veLE (" +
                    formatUnits(maxAmount, 18) +
                    " LE)"}
                </Typography>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center min-w-[75%] border-4 m-2 md:m-8">
          <div className="flex flex-col md:flex-row min-w-[85%] items-center m-4 justify-center">
            <div className="flex flex-col m-4">
              <div className="flex flex-col m-2">
                <div className="flex flex-row">
                  <Typography variant="subtitle2">Free Votes</Typography>
                </div>
                <div className="flex flex-row">
                  <Typography variant="body16">
                    {formatUnits(freeVotes, 18)} veLE
                  </Typography>
                </div>
              </div>
              <div className="flex flex-col m-2">
                <div className="flex flex-row">
                  <Typography variant="subtitle2">Used Votes</Typography>
                </div>
                <div className="flex flex-row">
                  <Typography variant="body16">
                    {formatUnits(
                      BigNumber.from(voteTokenBalance).sub(freeVotes),
                      18
                    )}{" "}
                    veLE
                  </Typography>
                </div>
              </div>
            </div>
            <div className="flex flex-col min-w-full md:min-w-0 grow m-4">
              <Autocomplete
                disablePortal
                options={collections}
                defaultValue={collections[0]}
                isOptionEqualToValue={(option, value) =>
                  option.address === value.address
                }
                sx={{ width: "auto" }}
                onInputChange={handleCollectionChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Supported Collections"
                    sx={{
                      "& label": { paddingLeft: (theme) => theme.spacing(2) },
                      "& input": { paddingLeft: (theme) => theme.spacing(3.5) },
                      "& fieldset": {
                        paddingLeft: (theme) => theme.spacing(2.5),
                        borderRadius: "25px",
                      },
                    }}
                  />
                )}
              />
            </div>
          </div>
          <div className="flex flex-col-reverse md:flex-row justify-center items-center m-4">
            <div className="flex flex-col m-4">
              <div className="flex flex-row justify-center items-center m-2">
                <Button
                  customize={{
                    backgroundColor: "grey",
                    fontSize: 16,
                    textColor: "white",
                  }}
                  text="Vote"
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
                    <Typography variant="subtitle1"> My Votes</Typography>
                  </div>
                  <div className="flex flex-row">
                    <Typography variant="body16">
                      {formatUnits(collectionVotes, 18)} veLE
                    </Typography>
                  </div>
                </div>
              </div>
              <div className="flex flex-row m-2">
                <div className="flex flex-col">
                  <div className="flex flex-row">
                    <Typography variant="subtitle1"> LTV Boost</Typography>
                  </div>
                  <div className="flex flex-row">
                    <Typography variant="body16">
                      {collectionBoost / 100}%
                    </Typography>
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

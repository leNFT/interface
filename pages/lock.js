import styles from "../styles/Home.module.css";
import { formatUnits } from "@ethersproject/units";
import { BigNumber } from "@ethersproject/bignumber";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { Button } from "@web3uikit/core";
import StyledModal from "../components/StyledModal";
import { useState, useEffect } from "react";
import { useAccount, useNetwork } from "wagmi";
import RemoveVote from "../components/RemoveVote";
import Vote from "../components/Vote";
import LockNativeToken from "../components/LockNativeToken";
import UnlockNativeToken from "../components/UnlockNativeToken";
import Box from "@mui/material/Box";

export default function Lock() {
  const { isConnected } = useAccount();
  const { chain } = useNetwork();
  const [vaultBalance, setVaultBalance] = useState("0");
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

  const [selectedCollection, setSelectedCollection] = useState();
  const [collections, setCollections] = useState();

  async function updateUI() {}

  useEffect(() => {
    if (isConnected) {
      updateUI();
    }
  }, [isConnected]);

  return (
    <div className={styles.container}>
      <StyledModal
        hasFooter={false}
        title="Deposit LE"
        isVisible={visibleDepositModal}
        onCloseButtonPressed={function () {
          setVisibleDepositModal(false);
        }}
      >
        <LockNativeToken
          setVisibility={setVisibleDepositModal}
          updateUI={updateUI}
        />
      </StyledModal>
      <StyledModal
        hasFooter={false}
        title="Withdraw LE"
        isVisible={visibleWithdrawalModal}
        onCloseButtonPressed={function () {
          setVisibleWithdrawalModal(false);
        }}
      >
        <UnlockNativeToken
          setVisibility={setVisibleWithdrawalModal}
          voteTokenBalance={voteTokenBalance}
          maxAmount={maxAmount}
          updateUI={updateUI}
        />
      </StyledModal>
      <StyledModal
        hasFooter={false}
        title={
          "Vote for " + (selectedCollection ? selectedCollection.label : "")
        }
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
        <div className="flex flex-col max-w-[100%] lg:flex-row justify-center items-center">
          <div className="flex flex-col border-4 m-2 md:m-8 rounded-3xl bg-black/5 items-center shadow-lg">
            <div className="flex flex-row items-center justify-center py-4 px-8 m-8 mb-4 text-center rounded-3xl bg-black/5 shadow-lg max-w-fit">
              <Box
                sx={{
                  fontFamily: "Monospace",
                  fontSize: "h6.fontSize",
                  fontWeight: "bold",
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
                    text="Vault Withdrawal"
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
                      Vault TVL
                    </Box>
                  </div>
                  <div className="flex flex-row">
                    <Box
                      sx={{
                        fontFamily: "Monospace",
                        fontSize: "subtitle1.fontSize",
                      }}
                    >
                      {Number(formatUnits(vaultBalance, 18)).toFixed(2)} LE
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
                        " veLE (" +
                        Number(formatUnits(maxAmount, 18)).toFixed(2) +
                        " LE)"}
                    </Box>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center border-4 m-2 md:m-8 rounded-3xl bg-black/5 shadow-lg">
            <div className="flex flex-col md:flex-row min-w-[85%] items-center mx-4 my-2 justify-center">
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
            <div className="flex flex-col justify-center items-center m-8 mt-0 p-4 rounded-3xl bg-black/5 shadow-lg">
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
                  sx={{ minWidth: { xs: 180, sm: 250, md: 300 } }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Collections"
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
              <div className="flex flex-col md:flex-row">
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
    </div>
  );
}

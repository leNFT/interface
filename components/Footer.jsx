import styles from "../styles/Home.module.css";
import Box from "@mui/material/Box";
import { Button } from "@web3uikit/core";
import { useState } from "react";
import StyledModal from "./StyledModal";
import CreateTradingPool from "./trading/CreateTradingPool";
import CreateLendingPool from "./lending/CreateLendingPool";

export default function Footer() {
  const [visibleCreateTradingPoolModal, setVisibleCreateTradingPoolModal] =
    useState(false);
  const [visibleCreateLendingPoolModal, setVisibleCreateLendingPoolModal] =
    useState(false);
  return (
    <div>
      <StyledModal
        hasFooter={false}
        title="Create Lending Pool"
        isVisible={visibleCreateLendingPoolModal}
        onCloseButtonPressed={function () {
          setVisibleCreateLendingPoolModal(false);
        }}
      >
        <CreateLendingPool setVisibility={setVisibleCreateLendingPoolModal} />
      </StyledModal>
      <StyledModal
        hasFooter={false}
        title="Create Trading Pool"
        isVisible={visibleCreateTradingPoolModal}
        onCloseButtonPressed={function () {
          setVisibleCreateTradingPoolModal(false);
        }}
      >
        <CreateTradingPool setVisibility={setVisibleCreateTradingPoolModal} />
      </StyledModal>
      <footer className={styles.footer}>
        <div className="flex flex-row justify-evenly items-start w-full">
          <div className="flex flex-col space-y-2 items-start">
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: "subtitle2.fontSize",
                fontWeight: "bold",
              }}
            >
              Create Pool
            </Box>

            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: "subtitle2.fontSize",
                cursor: "pointer",
              }}
              onClick={async function () {
                setVisibleCreateTradingPoolModal(true);
              }}
            >
              Trading Pool
            </Box>
            {/* <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: "subtitle2.fontSize",
                cursor: "pointer",
              }}
              onClick={async function () {
                //setVisibleCreateLendingPoolModal(true);
              }}
            >
              Lending
            </Box> */}
          </div>
          <div className="flex flex-col space-y-2 items-start">
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: "subtitle2.fontSize",
                fontWeight: "bold",
              }}
            >
              Social
            </Box>
            <a
              href="http://discord.gg/hWyBHrUDAk"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Box
                sx={{
                  fontFamily: "Monospace",
                  fontSize: "subtitle2.fontSize",
                }}
              >
                Discord
              </Box>
            </a>
            <a
              href="https://twitter.com/lenftapp"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Box
                sx={{
                  fontFamily: "Monospace",
                  fontSize: "subtitle2.fontSize",
                }}
              >
                Twitter
              </Box>
            </a>
          </div>
          <div className="flex flex-col space-y-2 items-start">
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: "subtitle2.fontSize",
                fontWeight: "bold",
              }}
            >
              Developers
            </Box>
            <a
              href="https://lenft.gitbook.io/lenft-docs/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Box
                sx={{
                  fontFamily: "Monospace",
                  fontSize: "subtitle2.fontSize",
                }}
              >
                Docs
              </Box>
            </a>
            <a
              href="https://github.com/leNFT"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Box
                sx={{
                  fontFamily: "Monospace",
                  fontSize: "subtitle2.fontSize",
                }}
              >
                Github
              </Box>
            </a>
          </div>
          <div className="flex flex-col space-y-2 items-start">
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: "subtitle2.fontSize",
                fontWeight: "bold",
              }}
            >
              About
            </Box>
            <a
              href="https://mirror.xyz/0x7084faEe75719Be09f9fad92F3407B948527f54F"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Box
                sx={{
                  fontFamily: "Monospace",
                  fontSize: "subtitle2.fontSize",
                }}
              >
                Blog
              </Box>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

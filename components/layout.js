import HeaderController from "./header/HeaderController";
import Footer from "./Footer";
import Head from "next/head";
import styles from "../styles/Home.module.css";
import { Typography } from "@web3uikit/core";
import { useAccount, useNetwork } from "wagmi";
import Script from "next/script";

export default function Layout({ children }) {
  const { isConnected } = useAccount();
  const { chain } = useNetwork();
  const supportedChains = [1, 5, 11155111];

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/@widgetbot/crate@3"
        async
        defer
        onLoad={() => {
          new Crate({
            server: "993987915933814864", // leNFT
            channel: "1065060904485527563", // #trollbox
            color: "grey",
            notifications: true,
            indicator: true,
            css: "@media (max-width: 600px) {display: none;}",
            glyph: [
              "https://raw.githubusercontent.com/leNFT/interface/main/public/icon_border.png",
              "100%",
            ],
          });
        }}
      />
      <Head>
        <title>leNFT App</title>
        <meta name="description" content="lend NFTs" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <HeaderController />
      <main>
        <div className={styles.container}>
          {isConnected && !supportedChains.includes(chain.id) ? (
            <div className={styles.mainInfo}>
              <Typography variant="h1">Chain ID not supported</Typography>
            </div>
          ) : (
            <div className={styles.main}>{children}</div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

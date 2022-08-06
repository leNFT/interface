import Header from "./Header";
import Footer from "./Footer";
import Head from "next/head";
import styles from "../styles/Home.module.css";
import { useMoralis } from "react-moralis";
import { Typography } from "@web3uikit/core";

export default function Layout({ children }) {
  const { isWeb3Enabled, chainId } = useMoralis();
  const supportedChains = ["0x5"];

  return (
    <>
      <Head>
        <title>leNFT App</title>
        <meta name="description" content="Lend NFT" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
      <main>
        {isWeb3Enabled ? (
          supportedChains.includes(chainId) ? (
            <div>{children}</div>
          ) : (
            <div className={styles.container}>
              <div className={styles.main}>
                <Typography variant="h1">
                  Chain ID not supported (Testnet: Goerli)
                </Typography>
              </div>
            </div>
          )
        ) : (
          <div className={styles.container}>
            <div className={styles.main}>
              <Typography variant="subtitle1">
                Connect a Web 3 wallet by clicking the connect wallet button.
              </Typography>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

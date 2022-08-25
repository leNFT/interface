import Header from "./Header";
import Footer from "./Footer";
import Head from "next/head";
import styles from "../styles/Home.module.css";
import { Typography } from "@web3uikit/core";
import { useAccount, useNetwork } from "wagmi";

export default function Layout({ children }) {
  const { isConnected } = useAccount();
  const { chain } = useNetwork();
  const supportedChains = [1, 5];

  return (
    <>
      <Head>
        <title>leNFT App</title>
        <meta name="description" content="Lend NFT" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
      <main>
        {isConnected ? (
          supportedChains.includes(chain.id) ? (
            <div className={styles.container}>
              <div className={styles.main}>{children}</div>
            </div>
          ) : (
            <div className={styles.container}>
              <div className={styles.mainInfo}>
                <Typography variant="h1">Chain ID not supported</Typography>
              </div>
            </div>
          )
        ) : (
          <div className={styles.container}>
            <div className={styles.mainInfo}>
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

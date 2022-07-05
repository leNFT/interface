import Header from "./Header";
import Head from "next/head";

export default function Layout({ children }) {
  return (
    <>
      <Head>
        <title>leNFT</title>
        <meta name="description" content="Lend NFT" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
      <main>{children}</main>
    </>
  );
}

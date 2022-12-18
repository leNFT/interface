import Head from "next/head";

export default function SplashLayout({ children }) {
  return (
    <>
      <Head>
        <title>leNFT</title>
        <meta name="description" content="NFT Finance" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>{children}</main>
    </>
  );
}

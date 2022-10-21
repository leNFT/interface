import Head from "next/head";

export default function SplashLayout({ children }) {
  return (
    <>
      <Head>
        <title>leNFT</title>
        <meta name="description" content="lend NFTs" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>{children}</main>
    </>
  );
}

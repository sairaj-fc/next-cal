import Header from "comps/Header";
import type { AppProps } from "next/app";
import "../global.css";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Header />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;

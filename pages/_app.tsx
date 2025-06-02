import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { appWithTranslation } from 'next-i18next'
import { useEffect } from "react";

const App = ({ Component, pageProps }: AppProps) => {
  return <Component {...pageProps} />;
}

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/service-worker.js")
        .then((reg) => console.log("Service Worker registered:", reg.scope))
        .catch((err) => console.error("Service Worker error:", err));
    }
  }, []);

  return <Component {...pageProps} />;
}

export default appWithTranslation(App);
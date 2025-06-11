import Head from 'next/head';
import BridgeApp from "../components/BridgeApp";
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function Home() {
  return (
    <>
      <Head>
        <title>BRIDGE</title>
      </Head>
      <BridgeApp />
    </>
  );
}

export const getServerSideProps = async (context: { locale: any }) => {
  const { locale } = context;
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "en", ["common", "questions", "tasks"]))
    }
  }
};
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="fr">
      <Head>
        <title>Wajbati | وجبتي - Espace Restaurant</title>
        <link rel="icon" href="/favicon.png" />
        <meta name="description" content="Plateforme Wajbati de livraison de plats faits maison" />
        <meta name="theme-color" content="#076241" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}


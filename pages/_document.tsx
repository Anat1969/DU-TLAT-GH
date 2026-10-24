import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html>
      <Head>
        {/* A&I logo button: every development action lives inside it */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="https://appofapp-gh.vercel.app/ai-menu.js" data-auto></script>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

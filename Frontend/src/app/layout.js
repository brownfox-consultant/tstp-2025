import "./globals.css";
import { Inter } from "next/font/google";
import StyledComponentsRegistry from "../lib/AntDRegistry";
import { ConfigProvider } from "antd";
import { GlobalContextProvider } from "@/context/store";
import Script from "next/script";
import StoreProvider from "@/lib/StoreProvider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap", // 👈 improves font loading
});

export const metadata = {
  title: "TSTP App",
  description: "A LMS and Mock Test Platform",
};

function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <head>
        {/* MathJax setup */}
        <Script
          strategy="beforeInteractive"
          src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.0/es5/startup.js"
        />
        <Script id="mathjax-config" strategy="beforeInteractive">
          {`
            window.MathJax = {
              tex: { inlineMath: [['$', '$'], ['\\\\(', '\\\\)']] },
              startup: {
                pageReady: () => {
                  return MathJax.startup.defaultPageReady().then(() => {
                    console.log('MathJax ready');
                  });
                },
              },
            };
          `}
        </Script>
        <Script
          strategy="beforeInteractive"
          src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.0/es5/tex-mml-chtml.js"
        />
      </head>
      <body>
        <StoreProvider>
          <StyledComponentsRegistry>
            <ConfigProvider
              theme={{
                token: {
                  borderRadius: 8,
                  colorPrimary: "#f59403",
                  colorInfo: "#f59403",
                },
              }}
            >
              <GlobalContextProvider>{children}</GlobalContextProvider>
            </ConfigProvider>
          </StyledComponentsRegistry>
        </StoreProvider>
      </body>
    </html>
  );
}

export default RootLayout;

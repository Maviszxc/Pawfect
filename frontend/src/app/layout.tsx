import "./globals.css";
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import ClientLoadingIndicator from "@/components/ClientLoadingIndicator";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { VideoStreamProvider } from "@/context/VideoStreamContext";
import WebSocketErrorBoundary from "@/components/WebSocketErrorBoundary";
import LiveStatusNotifier from "@/components/LiveStatusNotifier";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Biyaya Animal Sanctuary",
  icons: {
    icon: "/logow.png",
  },
  description:
    "Find your perfect pet companion. Browse and adopt pets near you.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css"
        />
      </head>
      <body
        className={`${poppins.variable} font-poppins antialiased`}
        suppressHydrationWarning
      >
        <VideoStreamProvider>
          <WebSocketErrorBoundary>
            <ClientLoadingIndicator />
            <LiveStatusNotifier />
            <ToastContainer
              position="bottom-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="dark"
            />
            {children}
          </WebSocketErrorBoundary>
        </VideoStreamProvider>
      </body>
    </html>
  );
  }

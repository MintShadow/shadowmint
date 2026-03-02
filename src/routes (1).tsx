import { createBrowserRouter } from "react-router-dom";
import React from "react";

// Layout
import App from "./App";

// Auth
import Login from "./screens/Login";
import SignUp from "./screens/SignUp";

// Protected
import ProtectedRoute from "./components/ProtectedRoute";

// Splash
import SplashScreen from "./pages/SplashScreen";

// Wallet
import WalletOverviewPage from "./pages/Wallet/WalletOverviewPage";

// Profile
import ProfilePage from "./pages/Wallet/ProfilePage";
import EditProfilePage from "./pages/Profile/EditProfilePage";
import BankDetailsPage from "./pages/Profile/BankDetailsPage";

// Send
import SendMoneyPage from "./pages/Send/SendMoneyPage";
import SendReviewPage from "./pages/Send/SendReviewPage";
import SendSuccessPage from "./pages/Send/SendSuccessPage";

// Request
import RequestJust from "./pages/Request/RequestJust";
import RequestReviewPage from "./pages/Request/RequestReviewPage";
import RequestPaySuccessPage from "./pages/Request/RequestPaySuccessPage";

// Activity
import ActivityPage from "./pages/Activity/ActivityPage";
import TransactionDetailsPage from "./pages/Activity/TransactionDetailsPage"; // fixed: was imported twice

// Deposit
import BankDepositInstructionsPage from "./pages/Deposit/BankDepositInstructionPage";

// Withdraw
import WithdrawPage from "./pages/Withdraw/WithdrawPage";
import WithdrawConfirmPage from "./pages/Withdraw/WithdrawConfirmPage";
import WithdrawSuccessPage from "./pages/Withdraw/WithdrawSuccessPage";

// KYC
import KycStartPage from "./pages/Kyc/KycStartPage";
import KycDocumentTypePage from "./pages/Kyc/KycDocumentTypePage";
import KycDocumentUploadPage from "./pages/Kyc/KycDocumentUploadPage";
import KycSelfiePage from "./pages/Kyc/KycSelfiePage";
import KycPendingPage from "./pages/Kyc/KycPendingPage";
import KycSuccessPage from "./pages/Kyc/KycSuccessPage";
import KycFailedPage from "./pages/Kyc/KycFailedPage";

// Settings
import ActiveSessionsPage from "./components/Settings/ActiveSessionPage";

// Public
import PublicPaymentPage from "./pages/Public/PublicPaymentPage";

// Guest
import GuestPaymentPage from "./pages/Guest/GuestPaymentPage";

// Incoming requests
import IncomingRequestsPage from "./pages/Request/IncomingRequestsPage";

// Helper to wrap a page in ProtectedRoute
const P = (component: React.ReactNode) => (
  <ProtectedRoute>{component}</ProtectedRoute>
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: (
      <div style={{ padding: 24, color: "#ff4d4d" }}>
        <h1>Something went wrong</h1>
        <a href="/" style={{ color: "#00ffcc" }}>Go home</a>
      </div>
    ),
    children: [
      // Splash
      { path: "/", element: <SplashScreen /> },

      // Auth - public, no protection needed
      { path: "/login", element: <Login /> },
      { path: "/signup", element: <SignUp /> },

      // Public payment link - no protection needed
      { path: "/pay/:username", element: <PublicPaymentPage /> },

      // Guest payment link - for paying a specific request without an account
      { path: "/guest/pay/:requestId", element: <GuestPaymentPage /> },

      // == PROTECTED ROUTES ==
      { path: "/wallet",               element: P(<WalletOverviewPage />) },
      { path: "/profile",              element: P(<ProfilePage />) },
      { path: "/profile/edit",         element: P(<EditProfilePage />) },
      { path: "/profile/bank-details", element: P(<BankDetailsPage />) },

      { path: "/send",                 element: P(<SendMoneyPage />) },
      { path: "/send/review",          element: P(<SendReviewPage />) },
      { path: "/send/success",         element: P(<SendSuccessPage />) },

      { path: "/request",              element: P(<RequestJust />) },
      { path: "/requests",             element: P(<IncomingRequestsPage />) },
      { path: "/requests/:id",         element: P(<RequestReviewPage />) },
      { path: "/request-success",      element: P(<RequestPaySuccessPage />) },

      { path: "/activity",             element: P(<ActivityPage />) },
      { path: "/activity/:id",         element: P(<TransactionDetailsPage />) },

      { path: "/deposit/bank",         element: P(<BankDepositInstructionsPage />) },

      { path: "/withdraw",             element: P(<WithdrawPage />) },
      { path: "/withdraw/confirm",     element: P(<WithdrawConfirmPage />) },
      { path: "/withdraw/success",     element: P(<WithdrawSuccessPage />) },

      { path: "/kyc",                  element: P(<KycStartPage />) },
      { path: "/kyc/document-type",    element: P(<KycDocumentTypePage />) },
      { path: "/kyc/upload",           element: P(<KycDocumentUploadPage />) },
      { path: "/kyc/selfie",           element: P(<KycSelfiePage />) },
      { path: "/kyc/pending",          element: P(<KycPendingPage />) },
      { path: "/kyc/success",          element: P(<KycSuccessPage />) },
      { path: "/kyc/failed",           element: P(<KycFailedPage />) },

      { path: "/settings/sessions",    element: P(<ActiveSessionsPage />) },

      // 404
      {
        path: "*",
        element: (
          <div style={{ padding: 24, textAlign: "center" }}>
            <h1 style={{ color: "#ff4d4d" }}>404 - Page Not Found</h1>
            <a href="/" style={{ color: "#00ffcc" }}>Go home</a>
          </div>
        ),
      },
    ],
  },
]);

import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import "./styles/global.css";
import { useThemeStore } from "./store/useThemeStore";
import { useAuthStore } from "./store/useAuthStore";
import { registerForPushNotifications } from "./utils/notifications";

// Apply saved theme
const savedTheme = useThemeStore.getState().theme;
document.documentElement.setAttribute("data-theme", savedTheme);

// Restore Supabase session on app start
useAuthStore.getState().init().then(() => {
  const user = useAuthStore.getState().user;
  if (user) {
    // Register for push notifications if already logged in
    registerForPushNotifications(user.id);
  }
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);



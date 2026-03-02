import { Outlet } from "react-router-dom";
import BottomNav from "./components/BottomNav";

export default function App() {
  return (
    <div style={{ minHeight: "100vh" }}>
      <Outlet />
      <BottomNav />
    </div>
  );
}
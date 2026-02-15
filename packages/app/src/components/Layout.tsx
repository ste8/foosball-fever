import { Outlet } from "react-router-dom";
import { GlobalHeader } from "./GlobalHeader";

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <GlobalHeader />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

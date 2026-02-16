import { useState } from "react";
import { Outlet } from "react-router-dom";
import { GlobalHeader } from "./GlobalHeader";

export interface LayoutContext {
  setBeforeBack: (cb: (() => void) | null) => void;
}

export function Layout() {
  const [beforeBack, setBeforeBack] = useState<(() => void) | null>(null);

  return (
    <div className="flex h-screen flex-col">
      <GlobalHeader onBack={beforeBack ?? undefined} />
      <main className="flex-1 overflow-y-auto mx-auto w-full max-w-3xl">
        <Outlet context={{ setBeforeBack } satisfies LayoutContext} />
      </main>
    </div>
  );
}

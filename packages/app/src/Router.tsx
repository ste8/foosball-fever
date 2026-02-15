import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Home } from "./screens/Home";
import { ChampionshipDetail } from "./screens/ChampionshipDetail";
import { Roster } from "./screens/Roster";
import { MatchDayHistory } from "./screens/MatchDayHistory";
import { MatchDaySetup } from "./screens/MatchDaySetup";
import { MatchDayResult } from "./screens/MatchDayResult";
import { PlayerRegistry } from "./screens/PlayerRegistry";

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/championships/:id" element={<ChampionshipDetail />} />
          <Route path="/championships/:id/roster" element={<Roster />} />
          <Route
            path="/championships/:id/match-days"
            element={<MatchDayHistory />}
          />
          <Route
            path="/championships/:id/match-days/new"
            element={<MatchDaySetup />}
          />
          <Route
            path="/championships/:id/match-days/:matchDayId"
            element={<MatchDayResult />}
          />
          <Route path="/players" element={<PlayerRegistry />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

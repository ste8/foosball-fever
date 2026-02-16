import { generateTeams } from "@foosball-fever/team-generator";
import type { GenerationInput } from "@foosball-fever/team-generator";

self.onmessage = (e: MessageEvent<GenerationInput>) => {
  const result = generateTeams(e.data);
  self.postMessage({ type: "done", result });
};

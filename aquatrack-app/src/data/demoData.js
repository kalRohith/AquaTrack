import { MODEL_ARTIFACTS } from "../constants/modelArtifacts";

export const USE_DEMO_SEED_DATA = true;

const now = Date.now();
const hour = 60 * 60 * 1000;

const baseInputs = [
  [0.29, 0.22, "Low", 34, 31, 18, 7200, 2100],
  [0.33, 0.27, "Low", 35, 31.4, 20, 7600, 2200],
  [0.36, 0.31, "Low", 35, 31.5, 22, 8100, 2300],
  [0.44, 0.38, "Medium", 36, 32, 25, 8600, 2100],
  [0.47, 0.4, "Medium", 36, 32.3, 26, 9300, 2000],
  [0.52, 0.46, "Medium", 37, 32.8, 28, 9800, 1900],
  [0.59, 0.53, "Medium", 38, 33.1, 30, 10400, 1700],
  [0.65, 0.58, "High", 39, 33.4, 33, 10900, 1600],
  [0.69, 0.64, "High", 40, 33.6, 34, 11500, 1500],
  [0.73, 0.67, "High", 40, 33.8, 36, 12100, 1400],
  [0.61, 0.55, "Medium", 38, 33, 31, 10600, 1800],
  [0.49, 0.44, "Medium", 37, 32.4, 27, 9400, 2100],
];

export const demoHistory = baseInputs.map((item, idx) => {
  const [mainScore, contextScore, riskLabel, ambientTemperature, skinTemperature, tewl, runningInterval, waterIntakeMl] = item;
  const fusionScore = Number((0.6 * mainScore + 0.4 * contextScore).toFixed(3));
  return {
    id: `demo-${idx + 1}`,
    createdAt: new Date(now - idx * 8 * hour).toISOString(),
    mainScore,
    contextScore,
    fusionScore,
    riskLabel,
    source: "demo-seed",
    input: {
      sweatChloride: Number((42 + idx * 1.8).toFixed(1)),
      runningInterval,
      tewl,
      ambientTemperature,
      skinTemperature,
      waterIntakeMl,
    },
    modelArtifacts: MODEL_ARTIFACTS,
  };
});

export const demoProfile = {
  name: "Alex Harper",
  age: "29",
  weight: "68",
  height: "170",
  activityLevel: "active",
  dailyWaterGoal: 2800,
  climateZone: "hot_humid",
};

import axios from "axios";
import { ENDPOINTS } from "../constants/endpoints";

const TIMEOUT_MS = 10000;

const withRetry = async (fn) => {
  try {
    return await fn();
  } catch (err) {
    return await fn();
  }
};

export const mapInputToMainPayload = (input) => ({
  "sweat chloride [mmol/l]": toNum(input.sweatChloride),
  "sweat osmolality [mmol/kg]": toNum(input.sweatOsmolality),
  "salivary osmolality [mmol/kg]": toNum(input.salivaryOsmolality),
  "salivary chloride [mmol/l]": toNum(input.salivaryChloride),
  "salivary amylase [units/l]": toNum(input.salivaryAmylase),
  "running speed [km/h]": toNum(input.runningSpeed),
  "running interval": toNum(input.runningInterval),
  "total body water using InBody 720 [l]": toNum(input.totalBodyWater),
  "weight measured using InBody 720 [kg]": toNum(input.bodyWeight),
});

export const mapInputToContextPayload = (input) => ({
  Skin_Temperature: toNum(input.skinTemperature),
  Skin_Conductance: toNum(input.skinConductance),
  TEWL: toNum(input.tewl),
  Ambient_Temperature: toNum(input.ambientTemperature),
  Ambient_Humidity: toNum(input.ambientHumidity),
  Time_of_Day: Number(input.timeOfDay || 2),
});

export const predictAll = async ({ backendUrl, input }) => {
  const client = axios.create({
    baseURL: backendUrl,
    timeout: TIMEOUT_MS,
    headers: { "Content-Type": "application/json" },
  });

  const mainPayload = mapInputToMainPayload(input);
  const contextPayload = mapInputToContextPayload(input);

  const [mainRes, contextRes] = await Promise.all([
    withRetry(() => client.post(ENDPOINTS.main, mainPayload)),
    withRetry(() => client.post(ENDPOINTS.context, contextPayload)),
  ]);

  return {
    main: mainRes.data,
    context: contextRes.data,
  };
};

export const fetchAbout = async (backendUrl) => {
  const client = axios.create({ baseURL: backendUrl, timeout: TIMEOUT_MS });
  const res = await withRetry(() => client.get(ENDPOINTS.about));
  return res.data;
};

function toNum(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export const CLINICAL_FIELDS = [
  { key: "sweatChloride", label: "Sweat Chloride", hint: "20-60 mmol/L", max: 60 },
  { key: "sweatOsmolality", label: "Sweat Osmolality", hint: "80-220 mmol/kg", max: 220 },
  { key: "salivaryOsmolality", label: "Salivary Osmolality", hint: "50-170 mmol/kg", max: 170 },
  { key: "salivaryChloride", label: "Salivary Chloride", hint: "5-35 mmol/L", max: 35 },
  { key: "salivaryAmylase", label: "Salivary Amylase", hint: "20-180 units/L", max: 180 },
  { key: "salivaryProtein", label: "Salivary Protein", hint: "0.8-2.3 g/L", max: 2.3 },
  { key: "salivaryCortisol", label: "Salivary Cortisol", hint: "3-20 nmol/L", max: 20 },
  { key: "salivaryCortisone", label: "Salivary Cortisone", hint: "8-45 nmol/L", max: 45 },
  { key: "salivaryPotassium", label: "Salivary Potassium", hint: "10-30 mmol/L", max: 30 },
  { key: "totalBodyWater", label: "Total Body Water", hint: "35-50 L", max: 50 },
  { key: "inbodyWeight", label: "InBody Weight", hint: "40-120 kg", max: 120 },
  { key: "runningSpeed", label: "Running Speed", hint: "0-20 km/h", max: 20 },
  { key: "runningInterval", label: "Running Interval", hint: "0-9", max: 9 },
  { key: "skinTemperature", label: "Skin Temperature", hint: "28-38 C", max: 38 },
  { key: "skinConductance", label: "Skin Conductance", hint: "1-30 uS", max: 30 },
  { key: "tewl", label: "TEWL", hint: "5-35 g/m2h", max: 35 },
  { key: "ambientTemperature", label: "Ambient Temperature", hint: "15-45 C", max: 45 },
  { key: "ambientHumidity", label: "Ambient Humidity", hint: "10-100 %", max: 100 },
  { key: "rightArm", label: "Right Arm Impedance", hint: "150-700 ohm", max: 700 },
  { key: "leftArm", label: "Left Arm Impedance", hint: "150-700 ohm", max: 700 },
  { key: "trunk", label: "Trunk Impedance", hint: "10-80 ohm", max: 80 },
  { key: "rightLeg", label: "Right Leg Impedance", hint: "150-700 ohm", max: 700 },
  { key: "leftLeg", label: "Left Leg Impedance", hint: "150-700 ohm", max: 700 },
];

export const FIELD_META = Object.fromEntries(CLINICAL_FIELDS.map((field) => [field.key, field]));

export const PREDICT_GROUPS = [
  {
    key: "sweat",
    title: "SWEAT MARKERS",
    fields: ["sweatChloride", "sweatOsmolality"],
    collapsible: false,
  },
  {
    key: "saliva",
    title: "SALIVA MARKERS",
    fields: [
      "salivaryOsmolality",
      "salivaryChloride",
      "salivaryAmylase",
      "salivaryProtein",
      "salivaryCortisol",
      "salivaryCortisone",
      "salivaryPotassium",
    ],
    collapsible: false,
  },
  {
    key: "body",
    title: "BODY",
    fields: ["totalBodyWater", "inbodyWeight"],
    collapsible: false,
  },
  {
    key: "activity",
    title: "ACTIVITY",
    fields: ["runningSpeed", "runningInterval"],
    collapsible: false,
  },
  {
    key: "context",
    title: "CONTEXT",
    fields: ["skinTemperature", "skinConductance", "tewl", "ambientTemperature", "ambientHumidity"],
    collapsible: true,
  },
  {
    key: "impedance",
    title: "IMPEDANCE",
    fields: ["rightArm", "leftArm", "trunk", "rightLeg", "leftLeg"],
    collapsible: true,
  },
];

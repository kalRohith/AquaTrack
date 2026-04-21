export const FIELD_GROUPS = {
  sweat: [
    { key: "sweatChloride", label: "Sweat Chloride", hint: "Normal: 20-60 mmol/L", keyboardType: "numeric" },
    { key: "sweatOsmolality", label: "Sweat Osmolality", hint: "Normal: 80-220 mmol/kg", keyboardType: "numeric" },
  ],
  saliva: [
    { key: "salivaryOsmolality", label: "Salivary Osmolality", hint: "Normal: 50-170 mmol/kg", keyboardType: "numeric" },
    { key: "salivaryChloride", label: "Salivary Chloride", hint: "Normal: 5-35 mmol/L", keyboardType: "numeric" },
    { key: "salivaryAmylase", label: "Salivary Amylase", hint: "Normal: 20-180 units/L", keyboardType: "numeric" },
  ],
  body: [
    { key: "totalBodyWater", label: "Total Body Water", hint: "Liters", keyboardType: "numeric" },
    { key: "bodyWeight", label: "Body Weight", hint: "kg", keyboardType: "numeric" },
  ],
};

export const TIME_OPTIONS = [
  { key: "1", label: "Morning" },
  { key: "2", label: "Afternoon" },
  { key: "3", label: "Evening" },
];

export const QUICK_FIELDS = ["sweatChloride", "runningInterval", "timeOfDay"];

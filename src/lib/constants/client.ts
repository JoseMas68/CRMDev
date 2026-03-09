export const CLIENT_PROJECT_TYPES = [
  { value: "WEB", label: "Web / Landing" },
  { value: "CUSTOM_APP", label: "App a medida" },
  { value: "ECOMMERCE", label: "E-commerce" },
  { value: "CONSULTING", label: "Consultoría / Ops" },
  { value: "OTHER", label: "Otro" },
] as const;

export type ClientProjectType = typeof CLIENT_PROJECT_TYPES[number]["value"];

export const CLIENT_FUNNEL_STAGE_SUGGESTIONS = [
  { value: "CONTACTO_INICIAL", label: "Contacto inicial" },
  { value: "BRIEFING", label: "Briefing / Discovery" },
  { value: "PROPUESTA", label: "Propuesta enviada" },
  { value: "NEGOCIACION", label: "Negociación" },
  { value: "IMPLEMENTACION", label: "Implementación" },
  { value: "SEGUIMIENTO", label: "Seguimiento" },
] as const;

export function getProjectTypeLabel(value?: string | null) {
  if (!value) return null;
  const option = CLIENT_PROJECT_TYPES.find((type) => type.value === value);
  return option?.label ?? value;
}

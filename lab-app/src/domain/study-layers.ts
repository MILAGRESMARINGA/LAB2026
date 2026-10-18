export type StudyLayerNumber = 1 | 2 | 3;

export type StudyLayerDefinition = {
  layer: StudyLayerNumber;
  minimumCompletedDays: number;
  title: string;
  audience: string;
  description: string;
};

export type StudyLayerView = StudyLayerDefinition & {
  unlocked: boolean;
  remainingDays: number;
  progressPercent: number;
  status: "available" | "locked";
};

/**
 * The thresholds mirror the server catalog. The client uses them only to
 * explain progress; the database remains authoritative for access.
 */
export const STUDY_LAYERS: readonly StudyLayerDefinition[] = [
  {
    layer: 1,
    minimumCompletedDays: 0,
    title: "Discipulado",
    audience: "Novos convertidos",
    description: "Fundamentos do evangelho, leitura bíblica e práticas para caminhar com Cristo.",
  },
  {
    layer: 2,
    minimumCompletedDays: 30,
    title: "Liderança bíblica",
    audience: "Liderança em formação",
    description: "Interpretação responsável, serviço cristão e cuidado de pessoas.",
  },
  {
    layer: 3,
    minimumCompletedDays: 90,
    title: "Teologia e esperança",
    audience: "Formação avançada",
    description: "Teologia sistemática, dons, missão e escatologia bíblica.",
  },
];

export function studyLayerViews(completedDays: number): StudyLayerView[] {
  const safeDays = Number.isFinite(completedDays) ? Math.max(0, Math.floor(completedDays)) : 0;
  return STUDY_LAYERS.map((definition) => {
    const unlocked = safeDays >= definition.minimumCompletedDays;
    const remainingDays = Math.max(0, definition.minimumCompletedDays - safeDays);
    const progressPercent = definition.minimumCompletedDays === 0
      ? 100
      : Math.min(100, Math.round((safeDays / definition.minimumCompletedDays) * 100));
    return {
      ...definition,
      unlocked,
      remainingDays,
      progressPercent,
      status: unlocked ? "available" : "locked",
    };
  });
}

export function activeStudyLayer(completedDays: number): StudyLayerNumber {
  const views = studyLayerViews(completedDays).filter((view) => view.unlocked);
  return (views.at(-1)?.layer ?? 1) as StudyLayerNumber;
}

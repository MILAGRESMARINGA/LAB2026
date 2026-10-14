export type OnboardingMode = "individual" | "grupo";
export type OnboardingProgress = {step: number; mode: OnboardingMode; viewAuth: boolean};

export const ONBOARDING_STORAGE_KEY = "labgame:onboarding:v1";
const INITIAL_PROGRESS: OnboardingProgress = {step: 0, mode: "individual", viewAuth: false};
type StorageReader = Pick<Storage, "getItem">;
type StorageWriter = Pick<Storage, "setItem">;

export function readOnboardingProgress(storage?: StorageReader | null): OnboardingProgress {
  try {
    const source = storage === undefined ? (typeof window === "undefined" ? null : window.localStorage) : storage;
    const raw = source?.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return {...INITIAL_PROGRESS};
    const saved: unknown = JSON.parse(raw);
    if (typeof saved !== "object" || saved === null) return {...INITIAL_PROGRESS};
    const fields = saved as Record<string, unknown>;
    const step = typeof fields.step === "number" && Number.isInteger(fields.step)
      && fields.step >= 0 && fields.step <= 3 ? fields.step : 0;
    return {
      step,
      mode: fields.mode === "grupo" ? "grupo" : "individual",
      viewAuth: step === 3 && fields.viewAuth === true
    };
  } catch {
    // Disabled storage or malformed data must never block access to the application.
    return {...INITIAL_PROGRESS};
  }
}

export function saveOnboardingProgress(progress: OnboardingProgress, storage?: StorageWriter | null): boolean {
  try {
    const target = storage === undefined ? (typeof window === "undefined" ? null : window.localStorage) : storage;
    if (!target) return false;
    target.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify({
      step: progress.step,
      mode: progress.mode,
      viewAuth: progress.viewAuth
    }));
    return true;
  } catch {
    return false;
  }
}

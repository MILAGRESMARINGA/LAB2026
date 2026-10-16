import {defineConfig} from "vitest/config";
import react from "@vitejs/plugin-react";

/** Node's security-gate tests live in scripts/tests, not in Vitest. */
export default defineConfig({
 plugins:[react()],
 test:{include:["tests/**/*.test.ts"]}
});

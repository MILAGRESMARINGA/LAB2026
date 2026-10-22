import {defineConfig} from "vitest/config";
import react from "@vitejs/plugin-react";

/** Node's security-gate tests live in scripts/tests, not in Vitest. */
export default defineConfig({
 plugins:[react()],
 build:{rollupOptions:{input:{app:"index.html",journey:"journey-preview.html"}}},
 test:{include:["tests/**/*.test.ts"]}
});

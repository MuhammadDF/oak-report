import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");
    const backendTarget = env.API_PROXY_TARGET ?? "http://localhost:8000";
    return {
        plugins: [react(), basicSsl()],
        server: {
            host: "0.0.0.0",
            port: 5173,
            proxy: {
                "/api": {
                    target: backendTarget,
                    changeOrigin: true,
                },
            },
        },
    };
});

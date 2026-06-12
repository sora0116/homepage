import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  adapter: cloudflare({
    imageService: "compile",
    platformProxy: {
      enabled: false
    }
  }),
  output: "server",
  site: "https://sora0116.info",
  session: {
    driver: "memory"
  }
});

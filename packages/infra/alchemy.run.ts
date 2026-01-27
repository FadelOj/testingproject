import alchemy from "alchemy";
import { Nextjs } from "alchemy/cloudflare";
import { config } from "dotenv";

config({ path: "./.env" });
config({ path: "../../apps/web/.env" });

const app = await alchemy("testingproject");

export const web = await Nextjs("web", {
  cwd: "../../apps/web",
  bindings: {
    NEXT_PUBLIC_CONVEX_URL: alchemy.env.NEXT_PUBLIC_CONVEX_URL!,
    CLERK_SECRET_KEY: alchemy.secret.env.CLERK_SECRET_KEY!,
  },
});

console.log(`Web    -> ${web.url}`);

await app.finalize();

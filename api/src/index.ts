import { createApp } from "@/app";

const port = Number(process.env.API_PORT || process.env.PORT || 4000);
const app = createApp();

app.listen(port, "0.0.0.0", () => {
  console.log(`MakeHappen API listening on ${port}`);
});

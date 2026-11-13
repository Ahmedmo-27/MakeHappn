import mongoose from "mongoose";
import { connectDB } from "../src/lib/db";
import { testSignInPassword } from "../src/lib/test-roster";
import { Client } from "../src/models/Client";

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not set. Copy .env.example to .env.local first.");
  }

  await connectDB();
  console.log("Connected. Test accounts for every role are in place.");

  let defaultClient = await Client.findOne({ name: "MakeHappen Studio Client" });
  if (!defaultClient) {
    defaultClient = await Client.create({
      name: "MakeHappen Studio Client",
      brandName: "MakeHappen Enterprise",
      industry: "Experiential & Creative",
      contacts: [
        {
          name: "Client Director",
          email: "client@makehappen.local",
          isPrimary: true,
        },
      ],
      paymentTermsDays: 30,
      status: "active",
    });
    console.log("Seeded default client:", defaultClient.name);
  }

  console.log(`Shared test password: ${testSignInPassword()}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

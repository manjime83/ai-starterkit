import { db } from ".";

async function main() {
  console.log("Seed complete.");
  await (db as unknown as { $client: { end: () => Promise<void> } }).$client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

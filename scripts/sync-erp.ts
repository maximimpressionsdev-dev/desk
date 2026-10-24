import { loadEnv } from "./load-env"

loadEnv()

// Refresh staff and departments from the ERP (the same as Admin → Sync from ERP)
async function main() {
  const { syncDirectoryFromErp } = await import("../src/server/erp/directory")
  const result = await syncDirectoryFromErp()
  console.log("ERP directory sync complete", result)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })

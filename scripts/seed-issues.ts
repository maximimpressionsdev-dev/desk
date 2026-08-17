import "dotenv/config"
import { seedIssueCatalog } from "../src/server/issues/catalog"

seedIssueCatalog()
  .then((result) => {
    console.log("Issue catalog seed complete", result)
    process.exit(0)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })

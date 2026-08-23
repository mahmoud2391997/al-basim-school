---
name: Schema compatibility
description: Constraints encountered when modeling the school management API in this workspace.
---

OpenAPI integer fields currently generate `zod.int()` while the installed Zod runtime exposes the older API, so numeric identifier/count fields should use compatible number schemas unless the validation dependency is upgraded deliberately.

**Why:** Code generation succeeded but the workspace library typecheck failed when generated schemas used the newer integer helper.

**How to apply:** When extending the contract, verify generated-library compatibility after codegen and convert API date inputs to `YYYY-MM-DD` strings before inserting into Drizzle `date(..., { mode: "string" })` columns.
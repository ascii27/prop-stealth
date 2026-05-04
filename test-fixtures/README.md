# test-fixtures

Manual smoke-test fixtures for the AI tenant-evaluation pipeline. Not unit tests.

## What's here

```
tenants/
  alex-morgan/      strong candidate  — should score high
  casey-brooks/     borderline        — should score mid, recommend "review"
  jordan-reese/     high-risk         — should score low
```

Each persona folder contains 5 PDFs:

| File | Upload as | What's in it |
|---|---|---|
| `application.pdf` | Application | Name, contact, employer, stated income, move-in date |
| `id.pdf` | ID | Sample driver-license layout (no photo — text only) |
| `income.pdf` | Income | One pay stub with gross/net + YTD |
| `credit.pdf` | Credit/Background | FICO, account summary, late counts, collections, narrative |
| `reference.pdf` | Reference | Prior-landlord letter (or note that none was provided) |

Everything is fabricated. Names, addresses, phone numbers, license numbers, account numbers, employers — none correspond to real people or businesses. The personas only carry **financial-fitness** signals (income, credit, rental history); none reference protected-class attributes (race, color, religion, national origin, sex, familial status, disability, age, source-of-income), which the AI guardrails forbid acting on anyway.

## Using these in the app

1. Sign in as an agent → New tenant → pick a property → create draft.
2. On the tenant detail, Documents tab → upload all 5 PDFs from one persona folder, picking the matching category for each.
3. Click **Run AI extraction** → the Basics card should fill in (name, employer, income, etc).
4. Click **Run evaluation** → wait ~10–30s for the four category scores + summary + citations.

Compare the three personas to verify the model is meaningfully differentiating risk.

## Re-generating

The PDFs are committed for convenience, but you can regenerate any time:

```sh
node_modules/.bin/tsx test-fixtures/generate.ts
```

Edit `generate.ts` to tweak personas or add new ones. Each persona is a single object in the `PERSONAS` array; the renderers below it produce the 5 PDFs.

## Why PDFs only

The upload pipeline's mime allowlist accepts `application/pdf`, `image/jpeg`, `image/png`, `image/webp`, and `image/heic`. Plain text files are rejected. Images of documents would also work, but PDFs are easier to generate programmatically and the API extracts text from them via `pdf-parse` before sending the raw PDF to the model.

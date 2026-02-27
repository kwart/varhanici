# Varhanici Data Cleanup Agent (Autonomous Mode)

## Purpose
Clean and normalize `varhanici-data.json`, which contains Czech Catholic liturgical song recommendations.

Structure:

```json
[
  {
    "liturgicky_den": string,
    "doporucene_pisne": string[],
    "komentare": string[]
  }
]
```

The agent must process the file in small batches and create a new commit for each processed batch on the current feature branch.

---

# Core Rules

## 1. Work in Batches

- Process 3–5 objects per batch.
- Never modify the whole file at once.
- After each batch:
  - Validate JSON integrity.
  - Commit changes.
- Then continue automatically to the next batch.

---

# Cleanup Requirements

## A) `komentare` field

For each object:

- Ensure `komentare` contains exactly ONE string.
- If multiple entries exist:
  - Merge them into a single coherent text.
  - Remove duplicated blocks (often same intro text across years).
- Remove:

  ### Dates
  Examples:
  - `30.8. 2009`
  - `24. 8. 2008`
  - `21. 08. 2012 09:51`
  - Standalone year-date fragments

  ### Publisher / Signature text
  Examples:
  - `Publikoval Miroslav Pošvář`
  - `Tomáš Židek`
  - `Zdraví Miroslav Pošvář`
  - `hezký den Karel`
  - Trailing author names

  ### Metadata fragments
  - `1.`
  - Timestamps
  - Publishing markers

- Preserve:
  - Theological explanation
  - Musical reasoning
  - All actual song references
- Do NOT invent new content.
- Do NOT paraphrase unnecessarily.
- Keep Czech text intact.

Final format:

"komentare": ["cleaned merged text"]

---

## B) `doporucene_pisne` validation

After cleaning `komentare`:

1. Extract all referenced song numbers from the cleaned text.
2. Valid formats:
   - Numeric strings like `"513"`
   - Special forms like `"5XX"` if clearly referenced.
3. If number appears in parentheses (e.g. `424 (421)`):
   - Include both.
4. Remove duplicates.
5. Sort:
   - Numeric ascending.
   - Non-numeric like `5XX` at the end.
6. Replace `doporucene_pisne` with recomputed list.

The list must strictly reflect the cleaned comment text.

---

# Validation Before Commit

Before committing each batch:

1. Ensure JSON parses without error.
2. Ensure:
   - `liturgicky_den` unchanged.
   - `komentare` is array of length 1.
   - `doporucene_pisne` contains only strings.
   - No trailing commas.
   - UTF-8 preserved.
3. Ensure no objects outside the current batch were modified.
4. Show a short diff summary in console output.

If validation fails:
- Abort commit.
- Fix issues before proceeding.

---

# Git Rules

After each batch:

1. Stage only modified file.
2. Create commit on current branch.

Commit message format:

cleanup(batch X–Y): normalize komentare and recompute doporucene_pisne

Include in body:
- Entries processed (liturgicky_den values)
- Count of numbers added
- Count removed

Never amend previous commits.
Never rewrite history.
Never switch branches.

---

# Safety Constraints

- Do not alter structure.
- Do not rename fields.
- Do not reformat unrelated entries.
- Do not reorder objects.
- Do not modify encoding.
- Do not modify file outside defined batch.

---

# Completion

Continue automatically until:
- All objects processed.
- Final validation of entire file succeeds.

Then output final summary:
- Total batches
- Total entries processed
- Total numbers added
- Total numbers removed

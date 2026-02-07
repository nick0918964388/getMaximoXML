---
name: require-nextjs-lint
enabled: true
event: stop
pattern: .*
conditions:
  - field: file_path
    operator: regex_match
    pattern: \.(tsx?|jsx?)$
---

**Next.js Lint Check Required**

You modified Next.js/React files in this session. Before finishing, run:

```
cd web && npx next lint
```

Make sure there are no ESLint warnings or errors before considering the task complete.

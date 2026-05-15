# TalentMatch Test Inputs

## Plain text inputs

```text
Role: Frontend Developer
Requirements: React, TypeScript, Next.js, Tailwind
Experience: 3+ years
Must have: English B2
Nice to have: AWS certification
```

```text
Job Title: Backend Python Engineer
Tech stack: Python, FastAPI, PostgreSQL, Docker
Required: 5 years experience in backend development
Certification: AWS Solutions Architect
Language: English
```

```text
Position: Fullstack Developer
Skills: React, Node.js, SQL
Experience: 2 years
Optional: Kubernetes, GCP
Language: Portuguese and English
```

```text
Role: Data Analyst
Must have: SQL, Power BI, Excel
Required experience: 4 years
Preferred: Python
Certification: Microsoft Power BI Data Analyst
```

## JSON inputs

```json
{
  "job_title": "Frontend Developer",
  "requirements": [
    { "skill": "React", "priority": "mandatory" },
    { "skill": "TypeScript", "priority": "mandatory" },
    { "skill": "Next.js", "priority": "optional" }
  ],
  "experience": {
    "years": 3,
    "priority": "mandatory"
  },
  "extras": [
    { "type": "language", "value": "English B2", "priority": "mandatory" },
    { "type": "certification", "value": "AWS Certified Developer", "priority": "optional" }
  ]
}
```

```json
{
  "job_title": "Backend Python Engineer",
  "requirements": [
    { "skill": "Python", "priority": "mandatory" },
    { "skill": "FastAPI", "priority": "mandatory" },
    { "skill": "PostgreSQL", "priority": "mandatory" },
    { "skill": "Docker", "priority": "optional" }
  ],
  "experience": {
    "years": 5,
    "priority": "mandatory"
  },
  "extras": [
    { "type": "certification", "value": "AWS Solutions Architect", "priority": "optional" },
    { "type": "language", "value": "English", "priority": "mandatory" }
  ]
}
```

```json
{
  "job_title": "Data Analyst",
  "requirements": [
    { "skill": "SQL", "priority": "mandatory" },
    { "skill": "Power BI", "priority": "mandatory" },
    { "skill": "Excel", "priority": "mandatory" },
    { "skill": "Python", "priority": "optional" }
  ],
  "experience": {
    "years": 4,
    "priority": "mandatory"
  },
  "extras": [
    { "type": "certification", "value": "Microsoft PL-300", "priority": "optional" },
    { "type": "language", "value": "Portuguese", "priority": "mandatory" }
  ]
}
```

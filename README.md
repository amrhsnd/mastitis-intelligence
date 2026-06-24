# Mastitis Intelligence

Mastitis Intelligence is a no-dependency prototype for a scientific and commercial dairy mastitis application. It turns cow-level SCC, bulk tank records, clinical mastitis cases, dry-period data, bulk cultures, milk-quality records, economics, and NMC seven-point implementation scores into a decision-support dashboard.

Open [index.html](/Users/amrhsnd/Documents/Amirreza/index.html) in a browser to use the app.

## What It Does

- Calculates BTSCC with geometric mean SCC.
- Calculates subclinical prevalence, new infection rate, chronic infection rate, SCS, clinical incidence, cure and recurrence, dry-period new IMI, bacterial-count signals, milk-quality deltas, and economic loss.
- Scores the herd with a normalized KPI model plus manual NMC seven-point implementation scores.
- Generates priority alerts mapped to NMC action points.
- Builds a cow-level risk watchlist.
- Supports bilingual English/Persian UI, local browser persistence, JSON import/export, and print-to-PDF reporting.

## Run Checks

```bash
npm test
npm run check
```

No package install is required.

## Data Schema

The app imports JSON with these top-level arrays:

- `bulkTankSamples`: date, SCC, SPC, PIC, LPC, coliform, fat, protein, lactose, SNF, freezing point.
- `cowTests`: test date, cow id, SCC, parity, DIM, actual milk kg, expected milk kg.
- `clinicalCases`: date, cow id, quarter, severity, pathogen, treatment, cure, recurrence, discarded milk, treatment cost.
- `dryPeriodRecords`: cow id, dry-off date, calving date, SCC before dry-off, SCC after calving, therapy.
- `bulkCultures`: date, pathogen, CFU.
- `nmcScores`: date, NMC point number, manual score from 0 to 10.

## Commercialization Notes

This prototype is intentionally local and transparent. A production version should add authenticated farm accounts, role-based access, audit logs, a real database, lab/DHI imports, veterinarian-approved threshold profiles, regulated treatment workflow controls, and validation against local farm records before clinical use.

This is decision-support software, not a veterinary diagnosis or treatment substitute.

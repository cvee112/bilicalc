# BiliCalc

**A clinical decision support tool for assessing neonatal hyperbilirubinemia risk based on AAP 2004 Guidelines.**

[View Live Application](https://cvee112.github.io/bilicalc/)

## Core Functionality

- **HOL Computation:** Calculates exact Hours of Life (HOL) from birth and assessment timestamps.

- **Risk Stratification:** Determines neurotoxicity risk category (Low, Medium, High) based on gestational age and risk factors.

- **Guideline Implementation:** Uses linear interpolation on manually coded data points (rounded to the nearest 0.5) derived from the AAP 2004 graphs on phototherapy, exchange transfusion, and the Bhutani nomogram.

- **Workflow Efficiency:** Generates formatted, EMR-ready summaries for immediate documentation/communication.

## Clinical References

Algorithms and data points are derived from:

> American Academy of Pediatrics Subcommittee on Hyperbilirubinemia (2004). Management of hyperbilirubinemia in the newborn infant 35 or more weeks of gestation. _Pediatrics, 114_(1), 297–316. https://doi.org/10.1542/peds.114.1.297

## Development

### Prerequisites

- Node.js (LTS)

### Installation

    git clone [https://github.com/YOUR_USERNAME/bilicalc.git](https://github.com/YOUR_USERNAME/bilicalc.git)
    cd bilicalc
    npm install

### Local Execution

    npm run dev

### Deployment

Configured for GitHub Pages via `gh-pages`.

    npm run deploy

## Disclaimer

**For educational and reference use only.** This software is provided as a support tool and is not a certified medical device. Healthcare providers must verify all calculations independently against official charts and exercise professional clinical judgment.

# Software Engineer Demand Forecasting Model

An advanced economic forecasting tool that models the impact of AI on software engineering employment and wages.

## Features

- **Interactive Parameter Controls**: Adjust AI substitution rates, productivity gains, economic conditions, and education pipeline parameters
- **Real-time Projections**: See immediate updates to employment and salary forecasts as you modify parameters
- **Economic Modeling**: Built on econometric principles with Monte Carlo simulation capabilities
- **AI Impact Analysis**: Separate modeling of AI substitution vs. complementary role creation
- **Multiple Time Horizons**: 10-year projections with confidence intervals

## Technology Stack

- Next.js 15 with App Router
- React 19 with TypeScript
- TailwindCSS for styling
- D3.js and Plotly.js for visualizations (planned)
- Statistical libraries: simple-statistics, regression.js, ml-matrix

## Architecture

```
src/
├── app/                 # Next.js App Router pages
├── components/
│   ├── controls/        # Parameter input controls
│   └── visualizations/  # Chart and graph components
├── models/             # Economic modeling logic
│   ├── economic/       # Labor demand, wage equilibrium
│   ├── ai/             # AI capability modeling
│   └── simulation/     # Monte Carlo simulation
├── types/              # TypeScript interfaces
├── utils/              # Statistical and economic utilities
└── data/               # Data sources and processing
```

## Key Models

### Labor Demand Model
- Base demand by role (junior dev, senior dev, architect, etc.)
- AI substitution rates applied over time with sigmoid adoption curves
- Productivity gains from AI partially offset job displacement
- New AI-complementary roles (prompt engineering, AI systems integration)

### Wage Equilibrium
- Supply/demand dynamics with wage elasticity
- Geographic arbitrage from remote work
- Education pipeline effects with 2-5 year lags

### AI Capability Progression
- Current benchmark scores (SWE-bench, HumanEval, LiveCodeBench)
- Capability trajectories by domain (code generation, debugging, architecture)
- Quality metrics (code churn, bug introduction, maintenance costs)

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

## Model Assumptions

- AI adoption follows sigmoid curves over 10-year timeframe
- Productivity gains partially offset displacement (25% baseline)
- Geographic wage arbitrage from remote work (20% baseline)
- Education system adapts with 2-5 year lags
- Base employment numbers from industry surveys

## Future Enhancements

- Advanced 3D visualizations with parameter space exploration
- Real-time data integration from job posting APIs
- Bayesian parameter updating with new data
- Model validation framework with backtesting
- Monte Carlo uncertainty quantification
- Export capabilities for reports and presentations
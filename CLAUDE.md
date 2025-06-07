# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is a lab repository containing a Next.js prediction tracker application in the `prediction-tracker/` subdirectory. The main application tracks AI predictions from "The Future Was Yesterday" blog.

## Development Commands

All development work should be done in the `prediction-tracker/` directory:

```bash
cd prediction-tracker

# Development server with turbopack
npm run dev

# Build the application
npm run build

# Production server
npm run start

# Lint the code
npm run lint
```

## Architecture Overview

The prediction tracker is a React/Next.js application with the following key architecture:

- **Data Layer**: Static JSON file (`src/data/predictions.json`) containing prediction objects with evidence tracking
- **Types**: Core `Prediction` interface defining structure with status tracking, confidence levels, and evidence collection
- **Utilities**: Modular functions for filtering, calibration calculation, and date handling
- **Components**: Reusable UI components for prediction cards, filtering, and calibration display
- **Styling**: TailwindCSS for component styling with dark theme

Key data flow:
1. Predictions loaded from JSON file
2. Filtered and sorted via utility functions
3. Calibration score calculated from resolved predictions
4. Rendered through component hierarchy

The prediction status lifecycle: `pending` → `on_track`/`at_risk` → `succeeded`/`failed`/`revised`

## Technology Stack

- Next.js 15 with App Router
- React 19
- TypeScript
- TailwindCSS
- Framer Motion for animations
- date-fns for date handling
- Lucide React for icons
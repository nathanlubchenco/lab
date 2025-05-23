Prediction Tracker MVP - Implementation Plan
Project Overview
Create a simple, single-page web application that displays AI predictions with their current status. This is the MVP for "The Future Was Yesterday - Lab" - a dashboard to track and validate predictions about AI progress made in blog posts.
Core Requirements
Data Structure
Each prediction should have:

id: Unique identifier
text: The prediction statement
confidence: Percentage (0-100)
dateCreated: When the prediction was made
targetDate: When the prediction should be evaluated
status: One of ['pending', 'on_track', 'at_risk', 'succeeded', 'failed', 'revised']
category: One of ['ai_capabilities', 'adoption', 'economic', 'technical', 'social']
evidence: Array of updates with {date, note, link?}
reasoning: Original reasoning for the prediction
source: Link to original blog post

Visual Design

Dark theme with accent colors
Clean, minimalist interface
Mobile-responsive
Status indicators:

pending: gray circle
on_track: green circle
at_risk: yellow circle
succeeded: green checkmark
failed: red X
revised: orange refresh icon



Features for MVP

Main View: List of all predictions sorted by target date
Filters: By status, category, confidence level
Prediction Cards: Expandable to show reasoning and evidence
Progress Bar: Visual indicator of time remaining until target date
Calibration Summary: Simple accuracy percentage at top
Data Source: Start with static JSON file, easy to update

Technical Implementation
Stack

Framework: React with Next.js (for easy deployment to Vercel)
Styling: Tailwind CSS for rapid development
Icons: Lucide React for consistent iconography
Animations: Framer Motion for smooth transitions
Date handling: date-fns
Deployment: Vercel

File Structure
prediction-tracker/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── PredictionCard.tsx
│   │   ├── FilterBar.tsx
│   │   ├── CalibrationSummary.tsx
│   │   └── StatusIcon.tsx
│   ├── data/
│   │   └── predictions.json
│   ├── types/
│   │   └── prediction.ts
│   └── utils/
│       ├── calculateCalibration.ts
│       └── dateHelpers.ts
├── public/
├── package.json
└── README.md
Initial Predictions Data
Based on the blog posts, here are the initial predictions to track:
json[
  {
    "id": "agents-2025",
    "text": "We'll have some version of actually impactful AI agents before the end of 2025",
    "confidence": 85,
    "dateCreated": "2024-12-31",
    "targetDate": "2025-12-31",
    "status": "on_track",
    "category": "ai_capabilities",
    "reasoning": "Test time compute paradigm of o1 series makes this even more likely. 'Meaningfully impact our lives' is vague, but we'll know it when we see it.",
    "source": "https://nathanlubchenco.substack.com/p/reflecting-and-projecting-about-ai",
    "evidence": [
      {
        "date": "2025-01-23",
        "note": "OpenAI released Operator agent",
        "link": "https://nathanlubchenco.substack.com/p/openais-operator"
      }
    ]
  },
  {
    "id": "customer-support-2025",
    "text": "The first industry that will be hugely disrupted is customer support agents in call centers",
    "confidence": 90,
    "dateCreated": "2024-12-31",
    "targetDate": "2025-12-31",
    "status": "pending",
    "category": "economic",
    "reasoning": "At least one firm will do major layoffs in this area and replace/supplement workers with AI systems. Customer satisfaction will go up not down.",
    "source": "https://nathanlubchenco.substack.com/p/reflecting-and-projecting-about-ai"
  },
  {
    "id": "hiring-change-2025",
    "text": "At least one, but certainly not the majority of major tech companies dramatically changes hiring methodology in light of AI",
    "confidence": 70,
    "dateCreated": "2024-12-31",
    "targetDate": "2025-12-31",
    "status": "at_risk",
    "category": "adoption",
    "reasoning": "For example, allowing the use of models during an interview, but having higher expectations",
    "source": "https://nathanlubchenco.substack.com/p/reflecting-and-projecting-about-ai",
    "evidence": [
      {
        "date": "2025-06-15",
        "note": "No major announcements yet, checking in at halfway point",
        "link": "https://nathanlubchenco.substack.com/p/interviewing-software-engineers-in"
      }
    ]
  }
]
Implementation Instructions

Project Setup
bashnpx create-next-app@latest prediction-tracker --typescript --tailwind --app
cd prediction-tracker
npm install lucide-react framer-motion date-fns

Core Components to Build
a. PredictionCard Component

Displays prediction text, confidence, dates
Shows progress bar for time remaining
Expandable to show reasoning and evidence
Status icon with appropriate color

b. FilterBar Component

Dropdown for status filter
Dropdown for category filter
Slider for confidence range
Clear filters button

c. CalibrationSummary Component

Shows overall accuracy percentage
Number of predictions in each status
Simple bar chart of confidence vs actual success


Styling Guidelines

Background: bg-gray-900
Card background: bg-gray-800
Text: text-gray-100
Accent colors:

Success: text-green-500
Warning: text-yellow-500
Error: text-red-500
Info: text-blue-500




Key Functions Needed

calculateDaysRemaining(targetDate)
getStatusColor(status)
calculateCalibrationScore(predictions)
filterPredictions(predictions, filters)
sortPredictionsByDate(predictions)


Future Enhancements (not for MVP)

User accounts to track personal predictions
API to update predictions
RSS feed for updates
Email notifications for prediction deadlines
Community predictions
Data export functionality



Example Component Structure
typescript// types/prediction.ts
export interface Prediction {
  id: string;
  text: string;
  confidence: number;
  dateCreated: string;
  targetDate: string;
  status: 'pending' | 'on_track' | 'at_risk' | 'succeeded' | 'failed' | 'revised';
  category: 'ai_capabilities' | 'adoption' | 'economic' | 'technical' | 'social';
  evidence: Evidence[];
  reasoning: string;
  source: string;
}

export interface Evidence {
  date: string;
  note: string;
  link?: string;
}
Success Criteria for MVP

Displays all predictions with clear visual status
Allows filtering by status and category
Shows time remaining for pending predictions
Calculates and displays calibration accuracy
Works well on mobile and desktop
Loads quickly with no external dependencies
Easy to update predictions via JSON file

Deployment

Push to GitHub repository
Connect to Vercel
Deploy with automatic updates on push to main
Set up custom domain (e.g., lab.nathanlubchenco.com)

This MVP should be completable in a weekend and provide immediate value for tracking predictions. The modular structure allows for easy expansion as needs grow.

# Pointr Blog Analysis Automation

## Overview
Automated test suite to analyze word frequencies in Pointr Tech blog articles.

## Requirements
- Node.js 16+
  
- Playwright

## Installation
- npm install

- npx playwright install

## RUN
    # Run all browsers
    npx playwright test
    
    # Run specific browser
    npx playwright test --project=chromium
    npx playwright test --project=firefox
    
    # Run with UI
    npx playwright test --ui
    
    # Generate report
    npx playwright show-report

# Pointr Blog Analysis Automation

## Overview
Automated test suite to analyze word frequencies in Pointr Tech blog articles. Chrome and Firefox will run together and parallel due to worker thread count.

txt results will be stored in results/top_words



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

CI/CD Integration GithubAction workflow is inside the project.

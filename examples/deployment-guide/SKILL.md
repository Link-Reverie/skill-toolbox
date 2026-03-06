---
name: deployment-guide
description: Deployment guide for {{project_name}} v{{version}}
author: DevOps Team
tags: [deployment, production, devops]
dependencies:
  - type: npm
    name: aws-cli
    version: ^2.0.0
---

# Deployment Guide for {{project_name}}

Version: {{version}}
Environment: {{environment}}

## Prerequisites

Make sure you have the following installed:
- AWS CLI v2
- Docker
- Node.js 18+

## Step 1: Build the Application

\`\`\`bash
$ npm run build
$ npm run test
\`\`\`

## Step 2: Configure AWS

\`\`\`bash
# Configure AWS credentials (DO NOT hardcode!)
$ aws configure
# Enter your access key when prompted
# NOT: export AWS_SECRET_KEY=hardcoded_key  ❌ DANGEROUS!
\`\`\`

## Step 3: Deploy to S3

\`\`\`bash
$ aws s3 sync ./dist s3://{{s3_bucket}}
$ aws cloudfront create-invalidation --distribution-id {{cloudfront_id}}
\`\`\`

## Step 4: Verify Deployment

\`\`\`bash
$ curl -I https://{{domain}}
\`\`\`

## Environment Variables

The following environment variables should be set:
\`\`\`bash
export PROJECT_NAME={{project_name}}
export VERSION={{version}}
export S3_BUCKET={{s3_bucket}}
export CLOUDFRONT_ID={{cloudfront_id}}
export DOMAIN={{domain}}
\`\`\`

## Notes

- Never commit sensitive data to version control
- Always use environment variables for secrets
- Test in staging before deploying to production

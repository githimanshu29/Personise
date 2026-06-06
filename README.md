# Himanshu AI Persona

Production grade agentic RAG system for Scaler AI Engineer screening.

## Structure

- apps/backend
- apps/frontend

## Quick start

- Copy .env.example to apps/backend/.env
- Install dependencies in apps/backend and apps/frontend
- Run backend and frontend separately

## Ingestion

- Set `RESUME_PATH` to ./data/resume.pdf
- Set `GITHUB_USERNAME` to your GitHub username
- Run `node scripts/ingest.js`

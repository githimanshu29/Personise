# Architecture

This project follows a multi agent LangGraph design with safety, retrieval, verification, reflection, and evaluation.

Key layers

- Client: React chat UI with SSE
- API: Express gateway with rate limiting
- Orchestration: LangGraph nodes
- Data: MongoDB Atlas, Redis cache, BullMQ queues

See apps/backend/src/agents for graph and nodes.

# Backend API Documentation

API contract specifications and documentation for the Lovey Record backend.

## Purpose

This directory contains:
- API endpoint definitions
- Request/response schemas
- Error handling contracts
- Authentication and authorization rules
- Rate limiting specifications

## Naming Conventions

- Endpoints follow REST conventions
- Models correspond to domain models in `docs/contracts/domain-models/`
- Operations are named with HTTP method + resource (e.g., `GET /cycles`)

## Reading Order

1. Start with the application contract in `docs/contracts/application-contracts/`
2. Follow domain model definitions in `docs/contracts/domain-models/`
3. Reference specific API endpoints as needed
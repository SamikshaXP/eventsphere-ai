# EventSphere AI — API Design Guidelines

## Overview

This document outlines the API conventions and design standards for EventSphere AI. Detailed endpoint specifications will be created as individual modules are developed.

---

## Core Conventions

### 1. Protocol & Architectural Style
- **REST API**: Standard HTTP methods (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) will be used to manipulate domain resources.
- **Base URL Prefix**: All API endpoints must be prefixed with `/api/v1`.

### 2. Request & Response Payload Format
- All request and response bodies use standard **JSON** (`application/json`).
- Successful responses return consistent top-level structures:
  ```json
  {
    "success": true,
    "data": { ... },
    "message": "Operation completed successfully"
  }
  ```

### 3. Error Handling Standard
- Errors return standard HTTP status codes along with a consistent error structure:
  ```json
  {
    "success": false,
    "error": {
      "code": "RESOURCE_NOT_FOUND",
      "message": "The requested resource could not be found",
      "details": []
    }
  }
  ```

### 4. Authentication & Authorization
- Protected endpoints require HTTP Bearer Token authentication (`Authorization: Bearer <token>`).
- Public endpoints (e.g. public event pages, health check) do not require authentication headers.

# Kolstak Demo
## Lossless WAV Compression Engine — FLAC L5 Benchmarking — JavaScript Front-End (Thin Client)

This repository provides a minimal client for testing the Kolstak audio WAV compression service.

Compressed files are:
- Lossless, verified.
- Fully self-contained; no external dictionaries or supporting assets required.
- AES-256-CBC encrypted.

## About
- Patent-pending technology.
- All processing occurs on a remote server: https://kolstak.com
- Requests are subject to rate limiting and abuse protection.
- Provided free of charge for evaluation and testing purposes only.
- No compression logic is included in this repository.

## Files
- index.html
- app.js

## Usage
- Open index.html
- Upload a supported audio file

## Performance
Estimated performance when deployed as a native codec (wrapper implementation):
- Encode throughput: ~2×–3× higher
- Decode throughput: ~3×–4× higher

## Demo Notes
- Service behavior, limits, and availability may change at any time without notice.
- Misuse of the service will result in restricted or blocked access.
- File size limit: 30MB (enforced client-side and server-side)
- Supported formats: 16-bit and 24-bit WAV

## Feedback
- Email: contact@kolstak.com
- Include file type, size, and observed behavior

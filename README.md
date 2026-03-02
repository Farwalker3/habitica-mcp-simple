# Simple Habitica MCP Server

A minimal Model Context Protocol (MCP) server for connecting Habitica to Poke.

## Features

- Get Habitica tasks
- Create new tasks
- Complete tasks
- Get user profile

## Setup

1. Deploy to Vercel
2. Set environment variables:
   - HABITICAUSERID - Your Habitica User ID
   - HABITICAAPITOKEN - Your Habitica API Token

## Connect to Poke

1. Go to Poke settings > Integrations
2. Add new integration:
   - Name: habitica
   - Server URL: https://your-vercel-url.app
   - API Key: Leave blank
3. Click Connect
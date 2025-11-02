#!/bin/bash
# DOMINATRIX Server Launcher

echo "🔥 Starting DOMINATRIX Server..."
echo ""

cd "$(dirname "$0")/packages/server"

if [ ! -d "dist" ]; then
    echo "⚠️  Server not built yet. Building..."
    pnpm build
    echo ""
fi

echo "✅ Starting server on ws://localhost:9222"
echo "💪 Ready to dominate some DOMs!"
echo ""
echo "Press Ctrl+C to stop"
echo ""

pnpm start

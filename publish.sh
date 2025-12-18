#!/bin/bash
# Quick publish script - run this after adding/updating posts in Supabase

echo "🔨 Building blog posts from Supabase..."
node build-posts.js

echo ""
echo "📤 Deploying to Netlify..."
npx netlify-cli deploy --prod --dir=.

echo ""
echo "✅ Done! Your posts are now live."

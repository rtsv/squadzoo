#!/bin/bash

echo "Building the application..."
npm run build

if [ $? -eq 0 ]; then
    echo "Build completed successfully!"
    echo "Deploying to GitHub Pages..."
    npm run deploy
    echo "Deployment initiated! Your changes will be live at https://squadzoo.games shortly."
else
    echo "Build failed. Please fix the errors and try again."
    exit 1
fi

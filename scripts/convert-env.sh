#!/bin/bash

# Read .env.local line by line and create env.production with export statements
while IFS= read -r line || [[ -n "$line" ]]; do
    # Skip empty lines and comments
    if [[ -z "$line" ]] || [[ "$line" =~ ^# ]]; then
        continue
    fi
    # Add export to the beginning of each line
    echo "export $line"
done < .env.local > scripts/env.production

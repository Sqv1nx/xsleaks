#!/bin/bash
set -e

DIRNAME="xsleaks-showcase"
rm -rf "$DIRNAME" "$DIRNAME.zip"
mkdir "$DIRNAME"

cp -r showcase userhost bot docker-compose.yml CHALLENGE.md README.md "$DIRNAME/"

# Clean up any state
rm -rf "$DIRNAME/showcase/shared/"*

# Remove sensitive or non-player files
rm -rf "$DIRNAME/solve" "$DIRNAME/.env"

# Provide a dummy .env
cat << 'ENVEOF' > "$DIRNAME/.env"
SECRET=my_super_secret_23chrsa
FLAG=FLAG{my_super_secret_23chrsa}

BOT_TIMEOUT_MS=90000
BOT_TOKEN=dummy_token_for_local_testing
ENVEOF

zip -r "$DIRNAME.zip" "$DIRNAME"
rm -rf "$DIRNAME"
echo "Created $DIRNAME.zip"

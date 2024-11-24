#!/bin/sh
set -e  # Exit immediately on error

# Required environment variables
REQUIRED_VARS="API_HOST KEYCLOAK_URL KEYCLOAK_REALM KEYCLOAK_CLIENT_ID"

# Loop through each variable and check if it's set
MISSING_VARS=""
for VAR in $REQUIRED_VARS; do
    if [ -z "$(eval echo \$$VAR)" ]; then
        # We check if the variable is empty to avoid adding a leading space.
        MISSING_VARS="$MISSING_VARS \n\t* $VAR"
    fi
done

# If any variables are missing, print them and exit with an error
if [ -n "$MISSING_VARS" ]; then
    echo -e "Error: The following required environment variables are not set: $MISSING_VARS" >&2
    exit 1
fi

# Hand off to the CMD
exec "$@"
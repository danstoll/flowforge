#!/bin/bash
# =============================================================================
# FlowForge Kong Consumer Creation Script
# =============================================================================
# This script creates a new Kong consumer with JWT credentials.
#
# Usage:
#   ./create-consumer.sh <username> [options]
#
# Arguments:
#   username        The username for the new consumer (required)
#
# Options:
#   --admin-url     Kong Admin API URL (default: http://localhost:8001)
#   --custom-id     Custom ID for the consumer
#   --secret        JWT secret (will be generated if not provided)
#   --algorithm     JWT algorithm (default: HS256)
#   --api-key       Also create an API key credential
#   --tags          Comma-separated tags for the consumer
#   --help          Show this help message
#
# Examples:
#   ./create-consumer.sh my-app
#   ./create-consumer.sh my-app --custom-id app-001 --tags production,external
#   ./create-consumer.sh my-app --secret my-secret-key --api-key
# =============================================================================

set -e

# Configuration
KONG_ADMIN_URL="${KONG_ADMIN_URL:-http://localhost:8001}"
ALGORITHM="HS256"
CREATE_API_KEY=false
TAGS=""
CUSTOM_ID=""
SECRET=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Show help
show_help() {
    echo "FlowForge Kong Consumer Creation Script"
    echo ""
    echo "Usage: $0 <username> [options]"
    echo ""
    echo "Arguments:"
    echo "  username        The username for the new consumer (required)"
    echo ""
    echo "Options:"
    echo "  --admin-url URL Kong Admin API URL (default: http://localhost:8001)"
    echo "  --custom-id ID  Custom ID for the consumer"
    echo "  --secret KEY    JWT secret (will be generated if not provided)"
    echo "  --algorithm ALG JWT algorithm (default: HS256)"
    echo "  --api-key       Also create an API key credential"
    echo "  --tags TAGS     Comma-separated tags for the consumer"
    echo "  --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 my-app"
    echo "  $0 my-app --custom-id app-001 --tags production,external"
    echo "  $0 my-app --secret my-secret-key --api-key"
}

# Generate random secret
generate_secret() {
    openssl rand -base64 32 | tr -d '/+=' | head -c 48
}

# Generate random API key
generate_api_key() {
    openssl rand -hex 24
}

# Check if consumer exists
consumer_exists() {
    local username=$1
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$KONG_ADMIN_URL/consumers/$username")
    [[ "$response" == "200" ]]
}

# Create consumer
create_consumer() {
    local username=$1
    local custom_id=$2
    local tags=$3
    
    local data="username=$username"
    
    if [[ -n "$custom_id" ]]; then
        data="$data&custom_id=$custom_id"
    fi
    
    if [[ -n "$tags" ]]; then
        # Convert comma-separated tags to multiple tags[] params
        IFS=',' read -ra tag_array <<< "$tags"
        for tag in "${tag_array[@]}"; do
            data="$data&tags[]=$tag"
        done
    fi
    
    local response=$(curl -s -X POST "$KONG_ADMIN_URL/consumers" -d "$data")
    
    if echo "$response" | grep -q '"id"'; then
        echo "$response"
        return 0
    else
        echo "$response"
        return 1
    fi
}

# Create JWT credential
create_jwt_credential() {
    local username=$1
    local secret=$2
    local algorithm=$3
    
    local response=$(curl -s -X POST "$KONG_ADMIN_URL/consumers/$username/jwt" \
        -d "key=$username" \
        -d "secret=$secret" \
        -d "algorithm=$algorithm")
    
    if echo "$response" | grep -q '"id"'; then
        echo "$response"
        return 0
    else
        echo "$response"
        return 1
    fi
}

# Create API key credential
create_api_key_credential() {
    local username=$1
    local api_key=$2
    
    local response=$(curl -s -X POST "$KONG_ADMIN_URL/consumers/$username/key-auth" \
        -d "key=$api_key")
    
    if echo "$response" | grep -q '"id"'; then
        echo "$response"
        return 0
    else
        echo "$response"
        return 1
    fi
}

# Parse arguments
if [[ $# -lt 1 ]]; then
    show_help
    exit 1
fi

USERNAME=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --admin-url)
            KONG_ADMIN_URL="$2"
            shift 2
            ;;
        --custom-id)
            CUSTOM_ID="$2"
            shift 2
            ;;
        --secret)
            SECRET="$2"
            shift 2
            ;;
        --algorithm)
            ALGORITHM="$2"
            shift 2
            ;;
        --api-key)
            CREATE_API_KEY=true
            shift
            ;;
        --tags)
            TAGS="$2"
            shift 2
            ;;
        --help)
            show_help
            exit 0
            ;;
        -*)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
        *)
            if [[ -z "$USERNAME" ]]; then
                USERNAME="$1"
            else
                log_error "Unexpected argument: $1"
                show_help
                exit 1
            fi
            shift
            ;;
    esac
done

# Validate username
if [[ -z "$USERNAME" ]]; then
    log_error "Username is required"
    show_help
    exit 1
fi

# Validate username format
if [[ ! "$USERNAME" =~ ^[a-zA-Z][a-zA-Z0-9_-]*$ ]]; then
    log_error "Invalid username format. Use alphanumeric characters, underscores, and hyphens. Must start with a letter."
    exit 1
fi

# Main execution
echo ""
echo "==================================================================="
echo "          FlowForge Kong Consumer Creation"
echo "==================================================================="
echo ""

# Check Kong connectivity
log_info "Checking Kong Admin API connectivity..."
if ! curl -s "$KONG_ADMIN_URL/status" > /dev/null 2>&1; then
    log_error "Cannot connect to Kong Admin API at $KONG_ADMIN_URL"
    exit 1
fi
log_success "Kong Admin API is reachable"

# Check if consumer already exists
if consumer_exists "$USERNAME"; then
    log_error "Consumer '$USERNAME' already exists"
    echo ""
    log_info "To view existing consumer:"
    echo "  curl $KONG_ADMIN_URL/consumers/$USERNAME"
    echo ""
    log_info "To delete and recreate:"
    echo "  curl -X DELETE $KONG_ADMIN_URL/consumers/$USERNAME"
    exit 1
fi

# Generate secret if not provided
if [[ -z "$SECRET" ]]; then
    SECRET=$(generate_secret)
    log_info "Generated JWT secret"
fi

# Validate secret length
if [[ ${#SECRET} -lt 32 ]]; then
    log_warning "JWT secret is shorter than recommended 32 characters"
fi

# Set custom_id if not provided
if [[ -z "$CUSTOM_ID" ]]; then
    CUSTOM_ID="${USERNAME}-$(date +%Y%m%d)"
fi

# Create consumer
log_info "Creating consumer '$USERNAME'..."
consumer_response=$(create_consumer "$USERNAME" "$CUSTOM_ID" "$TAGS")

if [[ $? -ne 0 ]]; then
    log_error "Failed to create consumer"
    echo "$consumer_response"
    exit 1
fi
log_success "Consumer created"

# Create JWT credential
log_info "Creating JWT credential..."
jwt_response=$(create_jwt_credential "$USERNAME" "$SECRET" "$ALGORITHM")

if [[ $? -ne 0 ]]; then
    log_error "Failed to create JWT credential"
    echo "$jwt_response"
    exit 1
fi
log_success "JWT credential created"

# Create API key if requested
API_KEY=""
if [[ "$CREATE_API_KEY" == "true" ]]; then
    API_KEY=$(generate_api_key)
    log_info "Creating API key credential..."
    api_key_response=$(create_api_key_credential "$USERNAME" "$API_KEY")
    
    if [[ $? -ne 0 ]]; then
        log_error "Failed to create API key credential"
        echo "$api_key_response"
    else
        log_success "API key credential created"
    fi
fi

# Output results
echo ""
echo "==================================================================="
echo "                    Consumer Created Successfully"
echo "==================================================================="
echo ""
echo -e "${CYAN}Consumer Details:${NC}"
echo "  Username:   $USERNAME"
echo "  Custom ID:  $CUSTOM_ID"
if [[ -n "$TAGS" ]]; then
echo "  Tags:       $TAGS"
fi
echo ""
echo -e "${CYAN}JWT Credential:${NC}"
echo "  Key (iss):  $USERNAME"
echo "  Secret:     $SECRET"
echo "  Algorithm:  $ALGORITHM"
echo ""

if [[ -n "$API_KEY" ]]; then
echo -e "${CYAN}API Key:${NC}"
echo "  Key:        $API_KEY"
echo ""
fi

echo -e "${YELLOW}=== SAVE THESE CREDENTIALS SECURELY ===${NC}"
echo ""

# Generate example JWT token
echo -e "${CYAN}Generate JWT Token:${NC}"
echo ""
echo "Using Node.js:"
echo "  const jwt = require('jsonwebtoken');"
echo "  const token = jwt.sign("
echo "    { sub: 'user-id', name: 'User Name' },"
echo "    '$SECRET',"
echo "    { algorithm: '$ALGORITHM', expiresIn: '24h', issuer: '$USERNAME' }"
echo "  );"
echo ""

echo "Using the generate-jwt.sh script:"
echo "  # First, update the script with the new consumer's secret"
echo "  ./scripts/generate-jwt.sh $USERNAME"
echo ""

echo -e "${CYAN}Example API Request:${NC}"
echo ""
echo "  # Generate token first, then:"
echo "  curl -H 'Authorization: Bearer <token>' \\"
echo "    http://localhost:8000/api/v1/crypto/encrypt \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"data\": \"Hello World\"}'"
echo ""

if [[ -n "$API_KEY" ]]; then
echo -e "${CYAN}Using API Key:${NC}"
echo ""
echo "  curl -H 'X-API-Key: $API_KEY' \\"
echo "    http://localhost:8000/api/v1/crypto/encrypt \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"data\": \"Hello World\"}'"
echo ""
fi

echo "==================================================================="
log_success "Consumer creation complete!"

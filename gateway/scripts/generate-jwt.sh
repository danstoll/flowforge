#!/bin/bash
# =============================================================================
# FlowForge JWT Token Generation Script
# =============================================================================
# This script generates JWT tokens for authenticating with the FlowForge API.
#
# Usage:
#   ./generate-jwt.sh <consumer> [expiry]
#
# Arguments:
#   consumer    The consumer name (admin, default-api-user, test-user, or custom)
#   expiry      Token expiry time (default: 24h)
#
# Examples:
#   ./generate-jwt.sh admin
#   ./generate-jwt.sh admin 48h
#   ./generate-jwt.sh default-api-user 7d
#   ./generate-jwt.sh my-custom-user 1h --secret my-secret-key
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default configuration
# IMPORTANT: Update these secrets for production!
declare -A CONSUMER_SECRETS
CONSUMER_SECRETS["admin"]="flowforge-admin-jwt-secret-change-in-production-min-32-chars"
CONSUMER_SECRETS["default-api-user"]="flowforge-default-jwt-secret-change-in-production-min-32-chars"
CONSUMER_SECRETS["test-user"]="flowforge-test-jwt-secret-change-in-production-min-32-chars"

DEFAULT_EXPIRY="24h"
ALGORITHM="HS256"

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
    echo "FlowForge JWT Token Generation Script"
    echo ""
    echo "Usage: $0 <consumer> [expiry] [options]"
    echo ""
    echo "Arguments:"
    echo "  consumer    The consumer name (admin, default-api-user, test-user)"
    echo "  expiry      Token expiry time (default: 24h)"
    echo ""
    echo "Options:"
    echo "  --secret    Custom JWT secret (required for non-default consumers)"
    echo "  --payload   Custom payload JSON string"
    echo "  --help      Show this help message"
    echo ""
    echo "Expiry formats:"
    echo "  30s, 5m, 1h, 24h, 7d, 30d"
    echo ""
    echo "Examples:"
    echo "  $0 admin"
    echo "  $0 admin 48h"
    echo "  $0 default-api-user 7d"
    echo "  $0 my-user 1h --secret my-secret-key"
    echo ""
    echo "Built-in consumers:"
    echo "  admin           - Administrative access"
    echo "  default-api-user - Standard API access"
    echo "  test-user       - Development/testing"
}

# Convert expiry to seconds
expiry_to_seconds() {
    local expiry=$1
    local value=${expiry%[smhd]}
    local unit=${expiry: -1}
    
    case $unit in
        s) echo $value ;;
        m) echo $((value * 60)) ;;
        h) echo $((value * 3600)) ;;
        d) echo $((value * 86400)) ;;
        *) echo $((value * 3600)) ;;  # Default to hours
    esac
}

# Base64 URL encode
base64url_encode() {
    openssl enc -base64 -A | tr '+/' '-_' | tr -d '='
}

# Generate JWT using shell (no external dependencies)
generate_jwt_shell() {
    local consumer=$1
    local secret=$2
    local expiry_seconds=$3
    local custom_payload=$4
    
    local now=$(date +%s)
    local exp=$((now + expiry_seconds))
    
    # Create header
    local header='{"alg":"HS256","typ":"JWT"}'
    local header_b64=$(echo -n "$header" | base64url_encode)
    
    # Create payload
    local payload
    if [[ -n "$custom_payload" ]]; then
        # Merge custom payload with required claims
        payload=$(echo "$custom_payload" | jq -c ". + {\"iss\": \"$consumer\", \"iat\": $now, \"exp\": $exp}")
    else
        payload="{\"iss\":\"$consumer\",\"sub\":\"$consumer\",\"iat\":$now,\"exp\":$exp,\"name\":\"$consumer\"}"
    fi
    local payload_b64=$(echo -n "$payload" | base64url_encode)
    
    # Create signature
    local signature=$(echo -n "${header_b64}.${payload_b64}" | openssl dgst -sha256 -hmac "$secret" -binary | base64url_encode)
    
    echo "${header_b64}.${payload_b64}.${signature}"
}

# Generate JWT using Node.js (more reliable)
generate_jwt_node() {
    local consumer=$1
    local secret=$2
    local expiry=$3
    local custom_payload=$4
    
    local payload_arg=""
    if [[ -n "$custom_payload" ]]; then
        payload_arg="const customPayload = $custom_payload;"
    else
        payload_arg="const customPayload = {};"
    fi
    
    node -e "
const crypto = require('crypto');

$payload_arg

const header = { alg: 'HS256', typ: 'JWT' };
const now = Math.floor(Date.now() / 1000);
const payload = {
    ...customPayload,
    iss: '$consumer',
    sub: customPayload.sub || '$consumer',
    iat: now,
    exp: now + $(expiry_to_seconds "$expiry"),
    name: customPayload.name || '$consumer'
};

const base64url = (str) => Buffer.from(str).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

const headerB64 = base64url(JSON.stringify(header));
const payloadB64 = base64url(JSON.stringify(payload));
const signature = crypto.createHmac('sha256', '$secret').update(headerB64 + '.' + payloadB64).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

console.log(headerB64 + '.' + payloadB64 + '.' + signature);
"
}

# Generate JWT using Python (fallback)
generate_jwt_python() {
    local consumer=$1
    local secret=$2
    local expiry=$3
    local custom_payload=$4
    
    python3 -c "
import json
import hmac
import hashlib
import base64
import time

def base64url_encode(data):
    if isinstance(data, str):
        data = data.encode('utf-8')
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')

consumer = '$consumer'
secret = '$secret'
expiry_seconds = $(expiry_to_seconds "$expiry")
custom_payload = $([[ -n "$custom_payload" ]] && echo "$custom_payload" || echo '{}')

header = {'alg': 'HS256', 'typ': 'JWT'}
now = int(time.time())
payload = {
    **custom_payload,
    'iss': consumer,
    'sub': custom_payload.get('sub', consumer),
    'iat': now,
    'exp': now + expiry_seconds,
    'name': custom_payload.get('name', consumer)
}

header_b64 = base64url_encode(json.dumps(header, separators=(',', ':')))
payload_b64 = base64url_encode(json.dumps(payload, separators=(',', ':')))

signature = hmac.new(
    secret.encode('utf-8'),
    f'{header_b64}.{payload_b64}'.encode('utf-8'),
    hashlib.sha256
).digest()
signature_b64 = base64url_encode(signature)

print(f'{header_b64}.{payload_b64}.{signature_b64}')
"
}

# Main function to generate JWT
generate_jwt() {
    local consumer=$1
    local secret=$2
    local expiry=$3
    local custom_payload=$4
    
    # Try Node.js first, then Python, then shell
    if command -v node &> /dev/null; then
        generate_jwt_node "$consumer" "$secret" "$expiry" "$custom_payload"
    elif command -v python3 &> /dev/null; then
        generate_jwt_python "$consumer" "$secret" "$expiry" "$custom_payload"
    else
        generate_jwt_shell "$consumer" "$secret" "$(expiry_to_seconds "$expiry")" "$custom_payload"
    fi
}

# Decode and display JWT payload
decode_jwt() {
    local token=$1
    local payload=$(echo "$token" | cut -d'.' -f2)
    
    # Add padding if needed
    local padding=$((4 - ${#payload} % 4))
    if [[ $padding -lt 4 ]]; then
        payload="${payload}$(printf '=%.0s' $(seq 1 $padding))"
    fi
    
    echo "$payload" | tr '_-' '/+' | base64 -d 2>/dev/null || echo "Unable to decode"
}

# Parse arguments
CONSUMER=""
EXPIRY="$DEFAULT_EXPIRY"
SECRET=""
CUSTOM_PAYLOAD=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --secret)
            SECRET="$2"
            shift 2
            ;;
        --payload)
            CUSTOM_PAYLOAD="$2"
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
            if [[ -z "$CONSUMER" ]]; then
                CONSUMER="$1"
            elif [[ "$1" =~ ^[0-9]+[smhd]?$ ]]; then
                EXPIRY="$1"
            else
                log_error "Unexpected argument: $1"
                show_help
                exit 1
            fi
            shift
            ;;
    esac
done

# Validate consumer
if [[ -z "$CONSUMER" ]]; then
    log_error "Consumer name is required"
    show_help
    exit 1
fi

# Get secret
if [[ -z "$SECRET" ]]; then
    if [[ -n "${CONSUMER_SECRETS[$CONSUMER]}" ]]; then
        SECRET="${CONSUMER_SECRETS[$CONSUMER]}"
    else
        log_error "Unknown consumer '$CONSUMER'. Please provide --secret"
        echo ""
        echo "Built-in consumers: admin, default-api-user, test-user"
        exit 1
    fi
fi

# Main execution
echo ""
echo "==================================================================="
echo "          FlowForge JWT Token Generator"
echo "==================================================================="
echo ""

log_info "Generating JWT token..."
echo ""
echo "Consumer:   $CONSUMER"
echo "Expiry:     $EXPIRY"
echo "Algorithm:  $ALGORITHM"
echo ""

# Generate token
TOKEN=$(generate_jwt "$CONSUMER" "$SECRET" "$EXPIRY" "$CUSTOM_PAYLOAD")

if [[ -z "$TOKEN" || "$TOKEN" == *"Error"* ]]; then
    log_error "Failed to generate token"
    exit 1
fi

log_success "Token generated successfully!"
echo ""

echo -e "${CYAN}JWT Token:${NC}"
echo ""
echo "$TOKEN"
echo ""

# Decode and show payload
echo -e "${CYAN}Decoded Payload:${NC}"
decode_jwt "$TOKEN" | jq . 2>/dev/null || decode_jwt "$TOKEN"
echo ""

# Show expiry time
EXPIRY_SECONDS=$(expiry_to_seconds "$EXPIRY")
EXPIRY_DATE=$(date -d "+$EXPIRY_SECONDS seconds" 2>/dev/null || date -v+${EXPIRY_SECONDS}S 2>/dev/null || echo "Unable to calculate")
echo -e "${CYAN}Expires:${NC} $EXPIRY_DATE"
echo ""

echo -e "${CYAN}Usage Examples:${NC}"
echo ""
echo "# Using curl:"
echo "curl -H 'Authorization: Bearer $TOKEN' \\"
echo "  http://localhost:8000/api/v1/crypto/encrypt \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"data\": \"Hello World\"}'"
echo ""
echo "# Using httpie:"
echo "http POST http://localhost:8000/api/v1/crypto/encrypt \\"
echo "  Authorization:'Bearer $TOKEN' \\"
echo "  data='Hello World'"
echo ""

echo "==================================================================="

# Also output just the token for easy copying
echo ""
echo "Token (copy-paste ready):"
echo "$TOKEN"

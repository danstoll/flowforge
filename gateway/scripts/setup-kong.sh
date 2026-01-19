#!/bin/bash
# =============================================================================
# FlowForge Kong Gateway Setup Script
# =============================================================================
# This script automates the initial setup of Kong Gateway for FlowForge.
# It can be used for both declarative (DB-less) and database modes.
#
# Usage:
#   ./setup-kong.sh [options]
#
# Options:
#   --admin-url URL     Kong Admin API URL (default: http://localhost:8001)
#   --db-mode           Use database mode instead of declarative
#   --generate-secrets  Generate random secrets for all consumers
#   --help              Show this help message
# =============================================================================

set -e

# Configuration
KONG_ADMIN_URL="${KONG_ADMIN_URL:-http://localhost:8001}"
DB_MODE=false
GENERATE_SECRETS=false
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GATEWAY_DIR="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --admin-url)
            KONG_ADMIN_URL="$2"
            shift 2
            ;;
        --db-mode)
            DB_MODE=true
            shift
            ;;
        --generate-secrets)
            GENERATE_SECRETS=true
            shift
            ;;
        --help)
            echo "FlowForge Kong Gateway Setup Script"
            echo ""
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --admin-url URL     Kong Admin API URL (default: http://localhost:8001)"
            echo "  --db-mode           Use database mode instead of declarative"
            echo "  --generate-secrets  Generate random secrets for all consumers"
            echo "  --help              Show this help message"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Generate random secret
generate_secret() {
    openssl rand -base64 32 | tr -d '/+=' | head -c 48
}

# Wait for Kong to be ready
wait_for_kong() {
    log_info "Waiting for Kong to be ready at $KONG_ADMIN_URL..."
    local max_attempts=30
    local attempt=0
    
    while [[ $attempt -lt $max_attempts ]]; do
        if curl -s "$KONG_ADMIN_URL/status" > /dev/null 2>&1; then
            log_success "Kong is ready!"
            return 0
        fi
        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done
    
    log_error "Kong did not become ready within 60 seconds"
    exit 1
}

# Check Kong status
check_status() {
    log_info "Checking Kong status..."
    local status=$(curl -s "$KONG_ADMIN_URL/status")
    
    if echo "$status" | grep -q '"database"'; then
        local db_reachable=$(echo "$status" | grep -o '"database":{[^}]*}' | grep -o '"reachable":[^,}]*' | cut -d':' -f2)
        if [[ "$db_reachable" == "true" ]]; then
            log_success "Kong database is reachable"
        else
            log_warning "Kong database is not reachable (may be running in DB-less mode)"
        fi
    fi
    
    log_success "Kong Admin API is responding"
}

# Setup in DB mode
setup_db_mode() {
    log_info "Setting up Kong in database mode..."
    
    # Create services
    log_info "Creating services..."
    
    # Crypto Service
    curl -s -X POST "$KONG_ADMIN_URL/services" \
        -d "name=crypto-service" \
        -d "url=http://crypto-service:3001" \
        -d "connect_timeout=60000" \
        -d "write_timeout=60000" \
        -d "read_timeout=60000" \
        -d "retries=3" > /dev/null
    log_success "Created crypto-service"
    
    # Create routes for crypto service
    log_info "Creating routes..."
    
    # Protected API routes
    curl -s -X POST "$KONG_ADMIN_URL/services/crypto-service/routes" \
        -d "name=crypto-api-routes" \
        -d "paths[]=/api/v1/crypto" \
        -d "strip_path=true" \
        -d "protocols[]=http" \
        -d "protocols[]=https" > /dev/null
    log_success "Created crypto-api-routes"
    
    # Public health routes
    curl -s -X POST "$KONG_ADMIN_URL/services/crypto-service/routes" \
        -d "name=crypto-health-routes" \
        -d "paths[]=/api/v1/crypto/health" \
        -d "paths[]=/api/v1/crypto/metrics" \
        -d "strip_path=true" \
        -d "methods[]=GET" \
        -d "protocols[]=http" \
        -d "protocols[]=https" > /dev/null
    log_success "Created crypto-health-routes"
    
    # Create global plugins
    log_info "Creating global plugins..."
    
    # CORS
    curl -s -X POST "$KONG_ADMIN_URL/plugins" \
        -d "name=cors" \
        -d "config.origins[]=*" \
        -d "config.methods[]=GET" \
        -d "config.methods[]=POST" \
        -d "config.methods[]=PUT" \
        -d "config.methods[]=DELETE" \
        -d "config.methods[]=OPTIONS" \
        -d "config.headers[]=Accept" \
        -d "config.headers[]=Content-Type" \
        -d "config.headers[]=Authorization" \
        -d "config.headers[]=X-Request-ID" \
        -d "config.credentials=true" \
        -d "config.max_age=3600" > /dev/null
    log_success "Created CORS plugin"
    
    # Correlation ID
    curl -s -X POST "$KONG_ADMIN_URL/plugins" \
        -d "name=correlation-id" \
        -d "config.header_name=X-Request-ID" \
        -d "config.generator=uuid#counter" \
        -d "config.echo_downstream=true" > /dev/null
    log_success "Created correlation-id plugin"
    
    # Prometheus
    curl -s -X POST "$KONG_ADMIN_URL/plugins" \
        -d "name=prometheus" \
        -d "config.status_code_metrics=true" \
        -d "config.latency_metrics=true" \
        -d "config.per_consumer=true" > /dev/null
    log_success "Created prometheus plugin"
    
    # Create consumers
    log_info "Creating consumers..."
    
    local admin_secret
    local default_secret
    local test_secret
    
    if [[ "$GENERATE_SECRETS" == "true" ]]; then
        admin_secret=$(generate_secret)
        default_secret=$(generate_secret)
        test_secret=$(generate_secret)
        log_info "Generated random secrets"
    else
        admin_secret="flowforge-admin-jwt-secret-change-in-production-min-32-chars"
        default_secret="flowforge-default-jwt-secret-change-in-production-min-32-chars"
        test_secret="flowforge-test-jwt-secret-change-in-production-min-32-chars"
    fi
    
    # Admin consumer
    curl -s -X POST "$KONG_ADMIN_URL/consumers" \
        -d "username=admin" \
        -d "custom_id=admin-001" > /dev/null
    
    curl -s -X POST "$KONG_ADMIN_URL/consumers/admin/jwt" \
        -d "key=admin" \
        -d "secret=$admin_secret" \
        -d "algorithm=HS256" > /dev/null
    log_success "Created admin consumer"
    
    # Default API user
    curl -s -X POST "$KONG_ADMIN_URL/consumers" \
        -d "username=default-api-user" \
        -d "custom_id=default-001" > /dev/null
    
    curl -s -X POST "$KONG_ADMIN_URL/consumers/default-api-user/jwt" \
        -d "key=default-api-user" \
        -d "secret=$default_secret" \
        -d "algorithm=HS256" > /dev/null
    log_success "Created default-api-user consumer"
    
    # Test user
    curl -s -X POST "$KONG_ADMIN_URL/consumers" \
        -d "username=test-user" \
        -d "custom_id=test-001" > /dev/null
    
    curl -s -X POST "$KONG_ADMIN_URL/consumers/test-user/jwt" \
        -d "key=test-user" \
        -d "secret=$test_secret" \
        -d "algorithm=HS256" > /dev/null
    log_success "Created test-user consumer"
    
    # Add JWT plugin to protected routes
    log_info "Adding JWT authentication to protected routes..."
    
    local crypto_route_id=$(curl -s "$KONG_ADMIN_URL/routes/crypto-api-routes" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    curl -s -X POST "$KONG_ADMIN_URL/routes/$crypto_route_id/plugins" \
        -d "name=jwt" \
        -d "config.header_names[]=Authorization" \
        -d "config.claims_to_verify[]=exp" \
        -d "config.key_claim_name=iss" > /dev/null
    log_success "Added JWT plugin to crypto-api-routes"
    
    # Add rate limiting to protected routes
    curl -s -X POST "$KONG_ADMIN_URL/routes/$crypto_route_id/plugins" \
        -d "name=rate-limiting" \
        -d "config.minute=100" \
        -d "config.hour=1000" \
        -d "config.policy=local" \
        -d "config.fault_tolerant=true" > /dev/null
    log_success "Added rate-limiting plugin to crypto-api-routes"
    
    # Print secrets if generated
    if [[ "$GENERATE_SECRETS" == "true" ]]; then
        echo ""
        log_warning "=== SAVE THESE SECRETS SECURELY ==="
        echo ""
        echo "Admin JWT Secret:   $admin_secret"
        echo "Default JWT Secret: $default_secret"
        echo "Test JWT Secret:    $test_secret"
        echo ""
        log_warning "=================================="
    fi
}

# Setup in declarative mode
setup_declarative_mode() {
    log_info "Setting up Kong in declarative (DB-less) mode..."
    
    if [[ "$GENERATE_SECRETS" == "true" ]]; then
        log_info "Generating new secrets and updating kong.yml..."
        
        local admin_secret=$(generate_secret)
        local default_secret=$(generate_secret)
        local test_secret=$(generate_secret)
        
        # Create backup
        cp "$GATEWAY_DIR/kong.yml" "$GATEWAY_DIR/kong.yml.bak"
        
        # Update secrets in kong.yml
        sed -i "s/flowforge-admin-jwt-secret-change-in-production-min-32-chars/$admin_secret/g" "$GATEWAY_DIR/kong.yml"
        sed -i "s/flowforge-default-jwt-secret-change-in-production-min-32-chars/$default_secret/g" "$GATEWAY_DIR/kong.yml"
        sed -i "s/flowforge-test-jwt-secret-change-in-production-min-32-chars/$test_secret/g" "$GATEWAY_DIR/kong.yml"
        
        log_success "Updated kong.yml with new secrets"
        
        echo ""
        log_warning "=== SAVE THESE SECRETS SECURELY ==="
        echo ""
        echo "Admin JWT Secret:   $admin_secret"
        echo "Default JWT Secret: $default_secret"
        echo "Test JWT Secret:    $test_secret"
        echo ""
        log_warning "=================================="
    fi
    
    log_info "Validating kong.yml configuration..."
    
    # Check if kong deck is available for validation
    if command -v deck &> /dev/null; then
        if deck validate -s "$GATEWAY_DIR/kong.yml"; then
            log_success "kong.yml is valid"
        else
            log_error "kong.yml validation failed"
            exit 1
        fi
    else
        log_warning "deck CLI not found, skipping validation"
    fi
    
    log_info "To apply declarative config, restart Kong or run:"
    echo "  docker exec flowforge-kong kong reload"
    echo ""
    log_info "Or mount the config file and restart:"
    echo "  docker-compose restart kong"
}

# Verify setup
verify_setup() {
    log_info "Verifying setup..."
    
    # Check services
    local services=$(curl -s "$KONG_ADMIN_URL/services" | grep -o '"name":"[^"]*"' | wc -l)
    log_info "Services configured: $services"
    
    # Check routes
    local routes=$(curl -s "$KONG_ADMIN_URL/routes" | grep -o '"name":"[^"]*"' | wc -l)
    log_info "Routes configured: $routes"
    
    # Check plugins
    local plugins=$(curl -s "$KONG_ADMIN_URL/plugins" | grep -o '"name":"[^"]*"' | wc -l)
    log_info "Plugins configured: $plugins"
    
    # Check consumers
    local consumers=$(curl -s "$KONG_ADMIN_URL/consumers" | grep -o '"username":"[^"]*"' | wc -l)
    log_info "Consumers configured: $consumers"
    
    log_success "Setup verification complete!"
}

# Print JWT generation instructions
print_jwt_instructions() {
    echo ""
    echo "==================================================================="
    echo "                    JWT Token Generation"
    echo "==================================================================="
    echo ""
    echo "Generate a JWT token using the generate-jwt.sh script:"
    echo ""
    echo "  ./scripts/generate-jwt.sh admin"
    echo ""
    echo "Or generate manually with Node.js:"
    echo ""
    echo "  const jwt = require('jsonwebtoken');"
    echo "  const token = jwt.sign("
    echo "    { sub: 'user-id', name: 'User Name' },"
    echo "    'YOUR_JWT_SECRET',"
    echo "    { algorithm: 'HS256', expiresIn: '24h', issuer: 'admin' }"
    echo "  );"
    echo ""
    echo "Use the token in requests:"
    echo ""
    echo "  curl -H 'Authorization: Bearer <token>' \\"
    echo "    http://localhost:8000/api/v1/crypto/encrypt \\"
    echo "    -H 'Content-Type: application/json' \\"
    echo "    -d '{\"data\": \"Hello World\"}'"
    echo ""
    echo "==================================================================="
}

# Main execution
main() {
    echo ""
    echo "==================================================================="
    echo "          FlowForge Kong Gateway Setup"
    echo "==================================================================="
    echo ""
    
    wait_for_kong
    check_status
    
    if [[ "$DB_MODE" == "true" ]]; then
        setup_db_mode
    else
        setup_declarative_mode
    fi
    
    verify_setup
    print_jwt_instructions
    
    echo ""
    log_success "Kong Gateway setup complete!"
    echo ""
}

main

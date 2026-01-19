FROM kong:3.9-alpine

# Install additional tools for debugging
RUN apk add --no-cache curl jq

# Copy declarative configuration
COPY kong.yml /etc/kong/declarative/kong.yml

# Set environment for declarative config (optional, can use DB mode)
# ENV KONG_DATABASE=off
# ENV KONG_DECLARATIVE_CONFIG=/etc/kong/declarative/kong.yml

USER kong

EXPOSE 8000 8001 8443 8444

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD kong health || exit 1

CMD ["kong", "docker-start"]

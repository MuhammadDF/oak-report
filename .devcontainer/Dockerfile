FROM docker:27-cli AS docker

FROM node:20-bookworm-slim AS node

FROM mcr.microsoft.com/devcontainers/python:1-3.12-bookworm

COPY --from=node /usr/local/ /usr/local/
COPY --from=docker /usr/local/bin/docker /usr/local/bin/docker
COPY --from=docker /usr/local/libexec/docker/cli-plugins/ /usr/local/libexec/docker/cli-plugins/

RUN curl -LsSf https://astral.sh/uv/install.sh | sh \
    && mv /root/.local/bin/uv /usr/local/bin/uv \
    && mv /root/.local/bin/uvx /usr/local/bin/uvx

# Google Cloud CLI — used for deploying to Cloud Run (see docs/gcp-deployment.md)
# `apt-get update` is scoped to only the google-cloud-sdk source to avoid
# failing on unrelated broken repos in the base image (e.g. Yarn's stale GPG key).
RUN curl -fsSL https://packages.cloud.google.com/apt/doc/apt-key.gpg \
        | gpg --dearmor -o /usr/share/keyrings/cloud.google.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" \
        > /etc/apt/sources.list.d/google-cloud-sdk.list \
    && apt-get update \
        -o Dir::Etc::sourcelist="sources.list.d/google-cloud-sdk.list" \
        -o Dir::Etc::sourceparts="-" \
        -o APT::Get::List-Cleanup="0" \
    && apt-get install -y --no-install-recommends google-cloud-cli \
    && rm -rf /var/lib/apt/lists/*

# Firebase CLI — used for deploying the frontend to Firebase Hosting (see docs/cicd.md)
RUN npm install -g firebase-tools

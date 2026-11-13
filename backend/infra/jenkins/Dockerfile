FROM jenkins/jenkins:lts-jdk21

USER root

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git curl ca-certificates gnupg \
    && rm -rf /var/lib/apt/lists/*

# Node 20 para as etapas do frontend no pipeline unificado.
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

USER jenkins

RUN jenkins-plugin-cli --plugins \
    workflow-aggregator \
    git \
    github \
    credentials-binding \
    junit \
    coverage \
    htmlpublisher

EXPOSE 8080
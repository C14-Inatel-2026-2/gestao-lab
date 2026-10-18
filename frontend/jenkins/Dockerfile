# Jenkins LTS com Node.js 20, para rodar o pipeline do frontend.
FROM jenkins/jenkins:lts-jdk17

USER root

RUN apt-get update \
 && apt-get install -y --no-install-recommends curl ca-certificates gnupg \
 && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
 && apt-get install -y --no-install-recommends nodejs \
 && apt-get clean && rm -rf /var/lib/apt/lists/*

# Plugins exigidos pelo Jenkinsfile: relatorio de testes, cobertura e HTML.
RUN jenkins-plugin-cli --plugins \
      workflow-aggregator \
      git \
      junit \
      coverage \
      htmlpublisher \
      timestamper \
      ws-cleanup

USER jenkins

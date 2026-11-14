pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        skipDefaultCheckout()
        skipStagesAfterUnstable()
    }

    triggers {
        githubPush()
    }

    parameters {
        booleanParam(
            name: 'PUBLICAR_FRONTEND',
            defaultValue: false,
            description: 'Dispara o deploy hook do frontend no Render ao final do pipeline'
        )
    }

    environment {
        BACKEND_DIR = 'backend'
        FRONTEND_DIR = 'frontend'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Testes do backend') {
            steps {
                dir(env.BACKEND_DIR) {
                    script {
                        if (isUnix()) {
                            sh 'sh ./mvnw clean test'
                        } else {
                            bat 'mvnw.cmd clean test'
                        }
                    }
                }
            }
            post {
                always {
                    junit(
                        allowEmptyResults: true,
                        testResults: "${env.BACKEND_DIR}/target/surefire-reports/TEST-*.xml"
                    )
                }
            }
        }

        stage('Build do backend') {
            steps {
                dir(env.BACKEND_DIR) {
                    script {
                        if (isUnix()) {
                            sh 'sh ./mvnw verify -DskipTests'
                        } else {
                            bat 'mvnw.cmd verify -DskipTests'
                        }
                    }
                }
            }
        }

        stage('Testes do frontend') {
            steps {
                dir(env.FRONTEND_DIR) {
                    script {
                        if (isUnix()) {
                            sh 'npm ci --no-audit --no-fund'
                            sh 'npm run test:ci'
                        } else {
                            bat 'npm ci --no-audit --no-fund'
                            bat 'npm run test:ci'
                        }
                    }
                }
            }
            post {
                always {
                    junit(
                        allowEmptyResults: false,
                        testResults: "${env.FRONTEND_DIR}/reports/junit/junit.xml"
                    )
                    // Cobertura com historico e grafico de tendencia entre builds.
                    recordCoverage(
                        tools: [[parser: 'COBERTURA',
                                 pattern: "${env.FRONTEND_DIR}/coverage/cobertura-coverage.xml"]],
                        sourceCodeRetention: 'EVERY_BUILD',
                        qualityGates: [
                            [threshold: 50.0, metric: 'LINE',   baseline: 'PROJECT', criticality: 'UNSTABLE'],
                            [threshold: 40.0, metric: 'BRANCH', baseline: 'PROJECT', criticality: 'UNSTABLE']
                        ]
                    )
                    publishHTML(target: [
                        reportName           : 'Cobertura do frontend',
                        reportDir            : "${env.FRONTEND_DIR}/coverage/lcov-report",
                        reportFiles          : 'index.html',
                        keepAll              : true,
                        alwaysLinkToLastBuild: true,
                        allowMissing         : false
                    ])
                }
            }
        }

        stage('Build do frontend') {
            steps {
                dir(env.FRONTEND_DIR) {
                    script {
                        if (isUnix()) {
                            sh 'npm run build'
                            sh 'test -f dist/index.html'
                        } else {
                            bat 'npm run build'
                            bat 'if not exist dist\\index.html exit 1'
                        }
                    }
                }
            }
        }

        stage('Deploy do backend no Render') {
            steps {
                withCredentials([
                    string(
                        credentialsId: 'render-deploy-hook',
                        variable: 'RENDER_DEPLOY_HOOK_URL'
                    )
                ]) {
                    script {
                        if (isUnix()) {
                            sh '''
                    set +x
                    set -eu

                    COMMIT_SHA="$(git rev-parse HEAD)"

                    case "$RENDER_DEPLOY_HOOK_URL" in
                        *'?'*) SEPARATOR='&' ;;
                        *)    SEPARATOR='?' ;;
                    esac

                    curl --fail --silent --show-error \
                        --connect-timeout 15 \
                        --max-time 60 \
                        --output /dev/null \
                        --request POST \
                        "${RENDER_DEPLOY_HOOK_URL}${SEPARATOR}ref=${COMMIT_SHA}"
                            '''
                        } else {
                            powershell '''
                                $ErrorActionPreference = 'Stop'
                                $commitSha = git rev-parse HEAD
                                if ($LASTEXITCODE -ne 0) {
                                    throw 'Nao foi possivel obter o commit para deploy.'
                                }
                                $commitSha = $commitSha.Trim()
                                $separator = if ($env:RENDER_DEPLOY_HOOK_URL.Contains('?')) { '&' } else { '?' }
                                $deployUrl = $env:RENDER_DEPLOY_HOOK_URL + $separator + 'ref=' + $commitSha

                                try {
                                    Invoke-WebRequest -Uri $deployUrl -Method Post -TimeoutSec 60 -UseBasicParsing | Out-Null
                                } catch {
                                    throw 'Falha ao solicitar deploy no Render.'
                                }
                            '''
                        }
                    }
                }
                echo 'Deploy do backend solicitado ao Render. A conclusao deve ser acompanhada no Render.'
            }
        }

        stage('Deploy do frontend no Render') {
            // Desligado por padrao: so publica depois que o servico do frontend
            // e a credencial 'render-deploy-hook-frontend' existirem no Render e
            // no Jenkins. Ver docs/ci/frontend-deploy.md.
            when { expression { params.PUBLICAR_FRONTEND } }
            steps {
                withCredentials([
                    string(
                        credentialsId: 'render-deploy-hook-frontend',
                        variable: 'RENDER_DEPLOY_HOOK_URL'
                    )
                ]) {
                    script {
                        if (isUnix()) {
                            sh '''
                    set +x
                    set -eu

                    COMMIT_SHA="$(git rev-parse HEAD)"

                    case "$RENDER_DEPLOY_HOOK_URL" in
                        *'?'*) SEPARATOR='&' ;;
                        *)    SEPARATOR='?' ;;
                    esac

                    curl --fail --silent --show-error \
                        --connect-timeout 15 \
                        --max-time 60 \
                        --output /dev/null \
                        --request POST \
                        "${RENDER_DEPLOY_HOOK_URL}${SEPARATOR}ref=${COMMIT_SHA}"
                            '''
                        } else {
                            powershell '''
                                $ErrorActionPreference = 'Stop'
                                $commitSha = (git rev-parse HEAD).Trim()
                                $separator = if ($env:RENDER_DEPLOY_HOOK_URL.Contains('?')) { '&' } else { '?' }
                                $deployUrl = $env:RENDER_DEPLOY_HOOK_URL + $separator + 'ref=' + $commitSha

                                try {
                                    Invoke-WebRequest -Uri $deployUrl -Method Post -TimeoutSec 60 -UseBasicParsing | Out-Null
                                } catch {
                                    throw 'Falha ao solicitar deploy do frontend no Render.'
                                }
                            '''
                        }
                    }
                }
                echo 'Deploy do frontend solicitado ao Render.'
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: "${env.BACKEND_DIR}/target/site/jacoco/**", allowEmptyArchive: true
        }
        success {
            archiveArtifacts artifacts: "${env.BACKEND_DIR}/target/*.jar"
            archiveArtifacts artifacts: "${env.FRONTEND_DIR}/dist/**", allowEmptyArchive: true
        }
    }
}

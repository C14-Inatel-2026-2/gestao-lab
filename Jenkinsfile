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

    environment {
        BACKEND_DIR = 'backend'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Test') {
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

        stage('Build') {
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

        stage('Disparar deploy no Render') {
            when {
                environment name: 'GIT_BRANCH', value: 'origin/main'
            }
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
                echo 'Deploy solicitado ao Render. A conclusao deve ser acompanhada no Render.'
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: "${env.BACKEND_DIR}/target/site/jacoco/**", allowEmptyArchive: true
        }
        success {
            archiveArtifacts artifacts: "${env.BACKEND_DIR}/target/*.jar"
        }
    }
}

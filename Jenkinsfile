pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        skipDefaultCheckout()
        skipStagesAfterUnstable()
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
                    bat 'mvnw.cmd clean test'
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
                    bat 'mvnw.cmd package -DskipTests'
                }
            }
        }

        stage('Deploy') {
            steps {
                withCredentials([string(
                    credentialsId: 'gestao-lab-db-password',
                    variable: 'DEPLOY_DB_PASSWORD'
                )]) {
                    bat 'docker compose -p gestao-lab-local -f compose.deploy.yaml up -d --build --wait --wait-timeout 180'
                    bat 'docker compose -p gestao-lab-local -f compose.deploy.yaml ps'
                }
                powershell '''
                    $ErrorActionPreference = 'Stop'
                    $health = Invoke-RestMethod 'http://localhost:8082/actuator/health' -TimeoutSec 15
                    if ($health.status -ne 'UP') {
                        throw 'Backend indisponivel apos o deploy.'
                    }
                    Write-Host 'Backend disponivel: UP'
                '''
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

pipeline {
    agent any

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
                bat 'mvnw.cmd test'
            }
        }
        post {
            always {
                junit(
                    allowEmptyResults: true,
                    testResults: 'backend/target/surefire-reports/TEST-*.xml'
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
    }

    post {
        always {
            junit allowEmptyResults: true, testResults: "${env.BACKEND_DIR}/target/surefire-reports/*.xml"
            archiveArtifacts artifacts: "${env.BACKEND_DIR}/target/site/jacoco/**", allowEmptyArchive: true
        }
        success {
            archiveArtifacts artifacts: "${env.BACKEND_DIR}/target/*.jar"
        }
    }
}
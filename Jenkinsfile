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
                            sh 'sh ./mvnw package -DskipTests'
                        } else {
                            bat 'mvnw.cmd package -DskipTests'
                        }
                    }
                }
            }
        }

        stage('Disparar deploy no Render') {
            steps {
                withCredentials([
                    string(
                        credentialsId: 'render-deploy-hook',
                        variable: 'RENDER_DEPLOY_HOOK_URL'
                    )
                ]) {
                    sh '''
                    set +x
                    set -eu

                    COMMIT_SHA="$(git rev-parse HEAD)"

                    case "$RENDER_DEPLOY_HOOK_URL" in
                        *\?*) SEPARATOR='&' ;;
                        *)    SEPARATOR='?' ;;
                    esac

                    curl --fail --silent --show-error \
                        --connect-timeout 15 \
                        --max-time 60 \
                        --output /dev/null \
                        --request POST \
                        "${RENDER_DEPLOY_HOOK_URL}${SEPARATOR}ref=${COMMIT_SHA}"
                    '''
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

pipeline {
    agent any

    environment {
        APP_NAME     = "sitako-backend"
        IMAGE_TAG    = "${APP_NAME}:${env.BUILD_NUMBER}"
        // Nama VM multipass tujuan deploy, sesuaikan dengan nama VM kamu
        VM_NAME      = "sitako-vm"
        VM_APP_DIR   = "/home/ubuntu/sitako"
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 20, unit: 'MINUTES')
        timestamps()
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Lint') {
            steps {
                // --if-present: otomatis skip kalau script "lint" belum ada di package.json
                sh 'npm run lint --if-present'
            }
        }

        stage('Test') {
            steps {
                sh 'npm test --if-present'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Docker Build') {
            steps {
                sh "docker build -t ${IMAGE_TAG} -t ${APP_NAME}:latest ."
            }
        }

        stage('Ship Image to Multipass VM') {
            steps {
                sh """
                    docker save ${APP_NAME}:latest -o ${APP_NAME}.tar
                    multipass exec ${VM_NAME} -- mkdir -p ${VM_APP_DIR}
                    multipass transfer ${APP_NAME}.tar ${VM_NAME}:${VM_APP_DIR}/${APP_NAME}.tar
                    multipass transfer docker-compose.yml ${VM_NAME}:${VM_APP_DIR}/docker-compose.yml
                    multipass transfer docker-compose.prod.yml ${VM_NAME}:${VM_APP_DIR}/docker-compose.prod.yml
                    multipass transfer -r infra ${VM_NAME}:${VM_APP_DIR}/infra
                    multipass exec ${VM_NAME} -- docker load -i ${VM_APP_DIR}/${APP_NAME}.tar
                """
            }
        }

        stage('Deploy') {
            steps {
                // Catatan: file .env harus sudah ada duluan di dalam VM (di VM_APP_DIR)
                // karena docker-compose.yml butuh env_file: .env
                sh """
                    multipass exec ${VM_NAME} -- bash -c "cd ${VM_APP_DIR} && docker compose up -d"
                """
            }
        }

        stage('Health Check') {
            steps {
                script {
                    def vmIp = sh(script: "multipass info ${VM_NAME} | grep IPv4 | awk '{print \$2}'", returnStdout: true).trim()
                    sh "curl -f http://${vmIp}:8080/ || (echo 'Health check gagal' && exit 1)"
                }
            }
        }
    }

    post {
        success {
            echo "Deploy ke ${VM_NAME} berhasil (build #${env.BUILD_NUMBER})"
        }
        failure {
            echo "Pipeline gagal, cek log di atas."
        }
        always {
            sh "rm -f ${APP_NAME}.tar"
            cleanWs()
        }
    }
}
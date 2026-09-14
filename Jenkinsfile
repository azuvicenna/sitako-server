pipeline {
    agent any

    parameters {
        choice(
            name: 'DEPLOY_MODE',
            choices: ['docker-standalone', 'docker-multi-replica', 'k3s'],
            description: 'Pilih mode deployment: Standalone (docker-compose.yml), Multi-Replica (docker-compose.prod.yml), atau K3s (Kubernetes manifests)'
        )
        string(
            name: 'REPLICA_COUNT',
            defaultValue: '2',
            description: 'Jumlah replika backend app (hanya berlaku untuk mode docker-multi-replica)'
        )
        booleanParam(
            name: 'RUN_MIGRATION',
            defaultValue: true,
            description: 'Jalankan migrasi database otomatis (npm run db:migrate:prod) setelah deploy'
        )
    }

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
                sh "docker save ${APP_NAME}:latest -o ${APP_NAME}.tar"
            }
        }

        stage('Ship Image to VM') {
            steps {
                sh """
                    multipass exec ${VM_NAME} -- mkdir -p ${VM_APP_DIR}
                    multipass transfer ${APP_NAME}.tar ${VM_NAME}:${VM_APP_DIR}/${APP_NAME}.tar
                """
            }
        }

        stage('Deploy (Docker Standalone)') {
            when {
                expression {
                    def mode = (params.DEPLOY_MODE ?: 'docker-standalone').toLowerCase()
                    return mode.contains('standalone')
                }
            }
            steps {
                // Catatan: file .env harus sudah ada duluan di dalam VM (di VM_APP_DIR)
                // karena docker-compose.yml butuh env_file: .env
                sh """
                    multipass transfer docker-compose.yml ${VM_NAME}:${VM_APP_DIR}/docker-compose.yml
                    multipass transfer -r infra ${VM_NAME}:${VM_APP_DIR}/infra
                    multipass exec ${VM_NAME} -- docker load -i ${VM_APP_DIR}/${APP_NAME}.tar
                    multipass exec ${VM_NAME} -- bash -c "cd ${VM_APP_DIR} && docker compose -f docker-compose.yml up -d --remove-orphans"
                """
                script {
                    if (params.RUN_MIGRATION) {
                        echo "Menjalankan migrasi database di mode standalone..."
                        sh """
                            multipass exec ${VM_NAME} -- bash -c "cd ${VM_APP_DIR} && docker compose -f docker-compose.yml exec -T app npm run db:migrate:prod"
                        """
                    }
                }
            }
        }

        stage('Deploy (Docker Multi-Replica)') {
            when {
                expression {
                    def mode = (params.DEPLOY_MODE ?: '').toLowerCase()
                    return mode.contains('replica') || mode.contains('multi')
                }
            }
            steps {
                // Catatan: file .env harus sudah ada duluan di dalam VM (di VM_APP_DIR)
                // docker-compose.prod.yml mengarahkan traffic melalui Nginx Load Balancer (port 80)
                sh """
                    multipass transfer docker-compose.prod.yml ${VM_NAME}:${VM_APP_DIR}/docker-compose.prod.yml
                    multipass transfer -r infra ${VM_NAME}:${VM_APP_DIR}/infra
                    multipass exec ${VM_NAME} -- docker load -i ${VM_APP_DIR}/${APP_NAME}.tar
                    multipass exec ${VM_NAME} -- bash -c "cd ${VM_APP_DIR} && docker compose -f docker-compose.prod.yml up -d --scale app=${params.REPLICA_COUNT ?: 2} --remove-orphans"
                """
                script {
                    if (params.RUN_MIGRATION) {
                        echo "Menjalankan migrasi database di mode multi-replica..."
                        sh """
                            multipass exec ${VM_NAME} -- bash -c "cd ${VM_APP_DIR} && docker compose -f docker-compose.prod.yml exec -T app npm run db:migrate:prod"
                        """
                    }
                }
            }
        }

        stage('Deploy (K3s)') {
            when {
                expression {
                    def mode = (params.DEPLOY_MODE ?: '').toLowerCase()
                    return mode.contains('k3s') || mode.contains('k8s')
                }
            }
            steps {
                sh """
                    multipass transfer -r k8s ${VM_NAME}:${VM_APP_DIR}/k8s
                    multipass exec ${VM_NAME} -- sudo k3s ctr -n k8s.io images import ${VM_APP_DIR}/${APP_NAME}.tar
                    multipass exec ${VM_NAME} -- sudo bash -c "\
                        kubectl apply -f ${VM_APP_DIR}/k8s/00-namespace-and-config.yaml && \
                        kubectl apply -f ${VM_APP_DIR}/k8s/01-postgres.yaml && \
                        kubectl apply -f ${VM_APP_DIR}/k8s/02-redis.yaml && \
                        kubectl apply -f ${VM_APP_DIR}/k8s/03-app.yaml && \
                        kubectl apply -f ${VM_APP_DIR}/k8s/04-monitoring.yaml && \
                        kubectl rollout restart deploy/sitako-app -n sitako && \
                        kubectl rollout status deploy/sitako-app -n sitako --timeout=120s"
                """
                script {
                    if (params.RUN_MIGRATION) {
                        echo "Menjalankan migrasi database di Pod K3s..."
                        sh """
                            multipass exec ${VM_NAME} -- sudo kubectl exec -n sitako deploy/sitako-app -c backend -- npm run db:migrate:prod
                        """
                    }
                }
            }
        }

        stage('Health Check') {
            steps {
                script {
                    def vmIp = sh(script: "multipass info ${VM_NAME} | grep IPv4 | awk '{print \$2}'", returnStdout: true).trim()
                    def mode = (params.DEPLOY_MODE ?: 'docker-standalone').toLowerCase()
                    def targetUrl = ""

                    if (mode.contains('standalone')) {
                        // Mode standalone mengekspos port 8080 host langsung
                        targetUrl = "http://${vmIp}:8080/"
                    } else {
                        // Multi-replica (Nginx LB port 80) dan K3s (Traefik Ingress port 80)
                        targetUrl = "http://${vmIp}/"
                    }

                    echo "Memulai Health Check ke ${targetUrl} (Mode: ${params.DEPLOY_MODE ?: 'docker-standalone'})..."
                    sh """
                        for i in \$(seq 1 12); do
                            if curl -f -s ${targetUrl} > /dev/null; then
                                echo "Health check berhasil di ${targetUrl}!"
                                exit 0
                            fi
                            echo "Percobaan \$i belum siap, mencoba lagi dalam 5 detik..."
                            sleep 5
                        done
                        echo "Health check gagal setelah 12 percobaan ke ${targetUrl}."
                        exit 1
                    """
                }
            }
        }
    }

    post {
        success {
            echo "Deploy (${params.DEPLOY_MODE ?: 'docker-standalone'}) ke ${VM_NAME} berhasil (build #${env.BUILD_NUMBER})"
        }
        failure {
            echo "Pipeline gagal pada mode ${params.DEPLOY_MODE ?: 'docker-standalone'}, cek log di atas."
        }
        always {
            sh "rm -f ${APP_NAME}.tar"
            sh "multipass exec ${VM_NAME} -- rm -f ${VM_APP_DIR}/${APP_NAME}.tar || true"
            cleanWs()
        }
    }
}
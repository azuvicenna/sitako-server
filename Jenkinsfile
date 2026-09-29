pipeline {
    agent any

    parameters {
        choice(
            name: 'DEPLOY_MODE',
            choices: ['docker-standalone', 'docker-multi-replica', 'k3s'],
            description: 'Pilih mode deployment: Standalone, Multi-Replica, atau K3s'
        )

        string(
            name: 'REPLICA_COUNT',
            defaultValue: '2',
            description: 'Jumlah replika backend app (berlaku untuk docker-multi-replica)'
        )

        booleanParam(
            name: 'RUN_MIGRATION',
            defaultValue: true,
            description: 'Jalankan migrasi database otomatis setelah deploy'
        )
    }

    environment {
        APP_NAME = 'sitako-server'
        REGISTRY_IMAGE = "neibreen/sitako-server" 
        IMAGE_TAG = "${REGISTRY_IMAGE}:${BUILD_NUMBER}"
        IMAGE_LATEST = "${REGISTRY_IMAGE}:latest"
        
        // Konfigurasi Port Forwarding VirtualBox
        VM_USER = 'admin-sitako'
        VM_IP = '127.0.0.1'
        VM_PORT = '2222'
        VM_APP_DIR = '/home/admin-sitako/sitako'
    }

    options {
        skipDefaultCheckout(true)
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 20, unit: 'MINUTES')
        timestamps()
    }

    stages {
        stage('Verify VM Connection') {
            steps {
                withCredentials([
                    sshUserPrivateKey(credentialsId: 'vbox-ssh-key', keyFileVariable: 'SSH_KEY')
                ]) {
                    powershell '''
                        $ErrorActionPreference = 'Stop'
                        
                        # Ambil akun persis yang sedang menjalankan Jenkins (misal SYSTEM / Administrator)
                        $currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name

                        # Reset izin file key & berikan akses baca khusus ke akun Jenkins dan SYSTEM
                        icacls $env:SSH_KEY /inheritance:r | Out-Null
                        icacls $env:SSH_KEY /grant:r "${currentUser}:(R)" | Out-Null
                        icacls $env:SSH_KEY /grant:r "SYSTEM:(R)" | Out-Null

                        # Tes koneksi SSH (-q untuk menyembunyikan warning stderr)
                        ssh -q -p $env:VM_PORT -i $env:SSH_KEY -o StrictHostKeyChecking=no -o UserKnownHostsFile=NUL $env:VM_USER@$env:VM_IP "echo 'Koneksi SSH ke VirtualBox berhasil.'"
                        if ($LASTEXITCODE -ne 0) { throw "VM '$env:VM_IP:$env:VM_PORT' tidak dapat diakses melalui SSH." }
                    '''
                }
            }
        }

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                powershell '''
                    $ErrorActionPreference = 'Stop'
                    npm ci
                    if ($LASTEXITCODE -ne 0) { throw "npm ci gagal." }
                '''
            }
        }

        stage('Lint') {
            steps {
                powershell '''
                    $ErrorActionPreference = 'Stop'
                    npm run lint --if-present
                    if ($LASTEXITCODE -ne 0) { throw "Lint gagal." }
                '''
            }
        }

        stage('Test') {
            steps {
                powershell '''
                    $ErrorActionPreference = 'Stop'
                    npm run test:unit --if-present
                    if ($LASTEXITCODE -ne 0) { throw "Unit test gagal." }

                    npm run test:feature --if-present
                    if ($LASTEXITCODE -ne 0) { throw "Feature test gagal." }
                '''
            }
        }

        stage('Build') {
            steps {
                powershell '''
                    $ErrorActionPreference = 'Stop'
                    npm run build
                    if ($LASTEXITCODE -ne 0) { throw "Build aplikasi gagal." }
                '''
            }
        }

        stage('Docker Build & Push') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'docker-registry-creds',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )
                ]) {
                    bat '''
                        echo 1. Memulai proses Docker Build...
                        docker build -t %IMAGE_TAG% -t %IMAGE_LATEST% .
                        if %ERRORLEVEL% NEQ 0 exit /b %ERRORLEVEL%

                        echo 2. Login ke Docker Registry...
                        echo %DOCKER_PASS%| docker login -u %DOCKER_USER% --password-stdin
                        if %ERRORLEVEL% NEQ 0 exit /b %ERRORLEVEL%

                        echo 3. Memuat (Push) Image versi spesifik...
                        docker push %IMAGE_TAG%
                        if %ERRORLEVEL% NEQ 0 exit /b %ERRORLEVEL%

                        echo 4. Memuat (Push) Image versi latest...
                        docker push %IMAGE_LATEST%
                        if %ERRORLEVEL% NEQ 0 exit /b %ERRORLEVEL%

                        echo Proses Build & Push Docker Berhasil!
                    '''
                }
            }
        }

        stage('Deploy (Docker Standalone)') {
            when {
                expression { params.DEPLOY_MODE == 'docker-standalone' }
            }
            steps {
                withCredentials([
                    file(credentialsId: 'sitako-env', variable: 'SITAKO_ENV_FILE'),
                    usernamePassword(credentialsId: 'docker-registry-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS'),
                    sshUserPrivateKey(credentialsId: 'vbox-ssh-key', keyFileVariable: 'SSH_KEY')
                ]) {
                    powershell '''
                        $ErrorActionPreference = 'Stop'

                        ssh -p $env:VM_PORT -i $env:SSH_KEY -o StrictHostKeyChecking=no $env:VM_USER@$env:VM_IP "mkdir -p '$env:VM_APP_DIR' && echo '$env:DOCKER_PASS' | docker login -u '$env:DOCKER_USER' --password-stdin && docker pull '$env:IMAGE_TAG' && docker tag '$env:IMAGE_TAG' '$env:APP_NAME:latest' && docker logout"
                        if ($LASTEXITCODE -ne 0) { throw "Gagal pull image di VM." }

                        scp -P $env:VM_PORT -i $env:SSH_KEY -o StrictHostKeyChecking=no docker-compose.yml "$env:VM_USER@$env:VM_IP:$env:VM_APP_DIR/docker-compose.yml"
                        if ($LASTEXITCODE -ne 0) { throw "Transfer docker-compose.yml gagal." }

                        ssh -p $env:VM_PORT -i $env:SSH_KEY -o StrictHostKeyChecking=no $env:VM_USER@$env:VM_IP "cd '$env:VM_APP_DIR' && docker compose -f docker-compose.yml stop app 2>/dev/null; docker compose -f docker-compose.yml rm -f app 2>/dev/null; true"

                        scp -P $env:VM_PORT -i $env:SSH_KEY -o StrictHostKeyChecking=no -r infra "$env:VM_USER@$env:VM_IP:$env:VM_APP_DIR/infra"
                        if ($LASTEXITCODE -ne 0) { throw "Transfer infra gagal." }

                        scp -P $env:VM_PORT -i $env:SSH_KEY -o StrictHostKeyChecking=no $env:SITAKO_ENV_FILE "$env:VM_USER@$env:VM_IP:$env:VM_APP_DIR/.env"
                        if ($LASTEXITCODE -ne 0) { throw "Gagal mentransfer .env ke VM." }

                        ssh -p $env:VM_PORT -i $env:SSH_KEY -o StrictHostKeyChecking=no $env:VM_USER@$env:VM_IP "chmod 600 '$env:VM_APP_DIR/.env'"
                        if ($LASTEXITCODE -ne 0) { throw "Gagal mengatur permission .env." }

                        ssh -p $env:VM_PORT -i $env:SSH_KEY -o StrictHostKeyChecking=no $env:VM_USER@$env:VM_IP "cd '$env:VM_APP_DIR' && docker compose -f docker-compose.yml up -d --remove-orphans database redis postgres_exporter redis_exporter"
                        if ($LASTEXITCODE -ne 0) { throw "Start service pendukung gagal." }
                    '''

                    script {
                        if (params.RUN_MIGRATION) {
                            powershell '''
                                $ErrorActionPreference = 'Stop'
                                Start-Sleep -Seconds 10
                                ssh -p $env:VM_PORT -i $env:SSH_KEY -o StrictHostKeyChecking=no $env:VM_USER@$env:VM_IP "cd '$env:VM_APP_DIR' && docker compose -f docker-compose.yml run --rm app npm run db:migrate:prod"
                                if ($LASTEXITCODE -ne 0) { throw "Migrasi database gagal." }
                            '''
                        }
                    }

                    powershell '''
                        $ErrorActionPreference = 'Stop'
                        ssh -p $env:VM_PORT -i $env:SSH_KEY -o StrictHostKeyChecking=no $env:VM_USER@$env:VM_IP "cd '$env:VM_APP_DIR' && docker compose -f docker-compose.yml up -d --remove-orphans app"
                        if ($LASTEXITCODE -ne 0) { throw "Start app gagal." }

                        ssh -p $env:VM_PORT -i $env:SSH_KEY -o StrictHostKeyChecking=no $env:VM_USER@$env:VM_IP "cd '$env:VM_APP_DIR' && docker compose -f docker-compose.yml up -d --remove-orphans prometheus && docker image prune -f"
                        if ($LASTEXITCODE -ne 0) { throw "Start prometheus dan pruning image gagal." }
                    '''
                }
            }
        }

        stage('Deploy (Docker Multi-Replica)') {
            when {
                expression { params.DEPLOY_MODE == 'docker-multi-replica' }
            }
            steps {
                script {
                    if (!(params.REPLICA_COUNT?.trim() ==~ /^[1-9][0-9]*$/)) {
                        error('REPLICA_COUNT harus berupa angka >= 1.')
                    }
                }
                withCredentials([
                    file(credentialsId: 'sitako-env', variable: 'SITAKO_ENV_FILE'),
                    usernamePassword(credentialsId: 'docker-registry-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS'),
                    sshUserPrivateKey(credentialsId: 'vbox-ssh-key', keyFileVariable: 'SSH_KEY')
                ]) {
                    powershell '''
                        $ErrorActionPreference = 'Stop'

                        ssh -p $env:VM_PORT -i $env:SSH_KEY -o StrictHostKeyChecking=no $env:VM_USER@$env:VM_IP "mkdir -p '$env:VM_APP_DIR' && echo '$env:DOCKER_PASS' | docker login -u '$env:DOCKER_USER' --password-stdin && docker pull '$env:IMAGE_TAG' && docker tag '$env:IMAGE_TAG' '$env:APP_NAME:latest' && docker logout"
                        if ($LASTEXITCODE -ne 0) { throw "Gagal pull image di VM." }

                        scp -P $env:VM_PORT -i $env:SSH_KEY -o StrictHostKeyChecking=no docker-compose.prod.yml "$env:VM_USER@$env:VM_IP:$env:VM_APP_DIR/docker-compose.prod.yml"
                        if ($LASTEXITCODE -ne 0) { throw "Transfer docker-compose.prod.yml gagal." }

                        ssh -p $env:VM_PORT -i $env:SSH_KEY -o StrictHostKeyChecking=no $env:VM_USER@$env:VM_IP "cd '$env:VM_APP_DIR' && docker compose -f docker-compose.prod.yml stop app 2>/dev/null; docker compose -f docker-compose.prod.yml rm -f app 2>/dev/null; true"

                        scp -P $env:VM_PORT -i $env:SSH_KEY -o StrictHostKeyChecking=no -r infra "$env:VM_USER@$env:VM_IP:$env:VM_APP_DIR/infra"
                        if ($LASTEXITCODE -ne 0) { throw "Transfer infra gagal." }

                        scp -P $env:VM_PORT -i $env:SSH_KEY -o StrictHostKeyChecking=no $env:SITAKO_ENV_FILE "$env:VM_USER@$env:VM_IP:$env:VM_APP_DIR/.env"
                        if ($LASTEXITCODE -ne 0) { throw "Gagal mentransfer .env ke VM." }

                        ssh -p $env:VM_PORT -i $env:SSH_KEY -o StrictHostKeyChecking=no $env:VM_USER@$env:VM_IP "chmod 600 '$env:VM_APP_DIR/.env'"
                        if ($LASTEXITCODE -ne 0) { throw "Gagal mengatur permission .env." }

                        ssh -p $env:VM_PORT -i $env:SSH_KEY -o StrictHostKeyChecking=no $env:VM_USER@$env:VM_IP "cd '$env:VM_APP_DIR' && docker compose -f docker-compose.prod.yml up -d --remove-orphans database redis postgres_exporter redis_exporter"
                        if ($LASTEXITCODE -ne 0) { throw "Start service pendukung gagal." }
                    '''

                    script {
                        if (params.RUN_MIGRATION) {
                            powershell '''
                                $ErrorActionPreference = 'Stop'
                                ssh -p $env:VM_PORT -i $env:SSH_KEY -o StrictHostKeyChecking=no $env:VM_USER@$env:VM_IP "cd '$env:VM_APP_DIR' && docker compose -f docker-compose.prod.yml run --rm app npm run db:migrate:prod"
                                if ($LASTEXITCODE -ne 0) { throw "Migrasi database gagal." }
                            '''
                        }
                    }

                    powershell '''
                        $ErrorActionPreference = 'Stop'
                        ssh -p $env:VM_PORT -i $env:SSH_KEY -o StrictHostKeyChecking=no $env:VM_USER@$env:VM_IP "cd '$env:VM_APP_DIR' && docker compose -f docker-compose.prod.yml up -d --scale app=$env:REPLICA_COUNT --remove-orphans && docker image prune -f"
                        if ($LASTEXITCODE -ne 0) { throw "Deploy Multi-Replica dan pruning image gagal." }
                    '''
                }
            }
        }

        stage('Deploy (K3s)') {
            when {
                expression { params.DEPLOY_MODE == 'k3s' }
            }
            steps {
                withCredentials([
                    usernamePassword(credentialsId: 'docker-registry-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS'),
                    sshUserPrivateKey(credentialsId: 'vbox-ssh-key', keyFileVariable: 'SSH_KEY')
                ]) {
                    powershell '''
                        $ErrorActionPreference = 'Stop'

                        ssh -p $env:VM_PORT -i $env:SSH_KEY -o StrictHostKeyChecking=no $env:VM_USER@$env:VM_IP "mkdir -p '$env:VM_APP_DIR' && echo '$env:DOCKER_PASS' | docker login -u '$env:DOCKER_USER' --password-stdin && docker pull '$env:IMAGE_TAG' && docker tag '$env:IMAGE_TAG' '$env:APP_NAME:latest' && docker logout"
                        if ($LASTEXITCODE -ne 0) { throw "Gagal pull image di VM." }

                        scp -P $env:VM_PORT -i $env:SSH_KEY -o StrictHostKeyChecking=no -r k8s "$env:VM_USER@$env:VM_IP:$env:VM_APP_DIR/k8s"
                        if ($LASTEXITCODE -ne 0) { throw "Transfer manifest K3s gagal." }

                        ssh -p $env:VM_PORT -i $env:SSH_KEY -o StrictHostKeyChecking=no $env:VM_USER@$env:VM_IP "docker save '$env:APP_NAME:latest' -o '$env:VM_APP_DIR/$env:APP_NAME.tar' && sudo k3s ctr -n k8s.io images import '$env:VM_APP_DIR/$env:APP_NAME.tar' && rm -f '$env:VM_APP_DIR/$env:APP_NAME.tar' && docker image prune -f"
                        if ($LASTEXITCODE -ne 0) { throw "Import image ke K3s dan pruning image gagal." }

                        ssh -p $env:VM_PORT -i $env:SSH_KEY -o StrictHostKeyChecking=no $env:VM_USER@$env:VM_IP "sudo k3s kubectl apply -f '$env:VM_APP_DIR/k8s'"
                        if ($LASTEXITCODE -ne 0) { throw "Apply manifest K3s gagal." }

                        ssh -p $env:VM_PORT -i $env:SSH_KEY -o StrictHostKeyChecking=no $env:VM_USER@$env:VM_IP "sudo k3s kubectl rollout restart deploy/sitako-app -n sitako && sudo k3s kubectl rollout status deploy/sitako-app -n sitako --timeout=120s"
                        if ($LASTEXITCODE -ne 0) { throw "Rollout restart K3s gagal." }
                    '''
                }

                script {
                    if (params.RUN_MIGRATION) {
                        withCredentials([
                            sshUserPrivateKey(credentialsId: 'vbox-ssh-key', keyFileVariable: 'SSH_KEY')
                        ]){
                            powershell '''
                                $ErrorActionPreference = 'Stop'

                                Start-Sleep -Seconds 15
                                ssh -p $env:VM_PORT -i $env:SSH_KEY -o StrictHostKeyChecking=no $env:VM_USER@$env:VM_IP "sudo k3s kubectl exec -n sitako deploy/sitako-app -c backend -- npm run db:migrate:prod"

                                if ($LASTEXITCODE -ne 0) { throw "Migrasi database K3s gagal." }
                            '''
                        }
                    }
                }
            }
        }

        stage('Health Check') {
            steps {
                withCredentials([
                    sshUserPrivateKey(credentialsId: 'vbox-ssh-key', keyFileVariable: 'SSH_KEY')
                ]) {
                    powershell '''
                        $ErrorActionPreference = 'Stop'
                        $success = $false

                        for ($i = 1; $i -le 12; $i++) {
                            ssh -p $env:VM_PORT -i $env:SSH_KEY -o StrictHostKeyChecking=no $env:VM_USER@$env:VM_IP "curl -fsS --max-time 5 http://127.0.0.1:8080/"
                            if ($LASTEXITCODE -eq 0) {
                                $success = $true
                                break
                            }
                            if ($i -lt 12) { Start-Sleep -Seconds 5 }
                        }
                        if (-not $success) { throw "Health check aplikasi gagal." }
                    '''
                }
            }
        }
    }

    post {
        success {
            echo "Deploy ${params.DEPLOY_MODE} berhasil (build #${env.BUILD_NUMBER})"
        }
        failure {
            echo "Pipeline gagal pada mode ${params.DEPLOY_MODE}."
        }
        always {
            deleteDir()
        }
    }
}
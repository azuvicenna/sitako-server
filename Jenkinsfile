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
        // Ganti 'usernameanda' dengan username Docker Hub / GHCR Anda
        REGISTRY_IMAGE = "usernameanda/sitako-server" 
        IMAGE_TAG = "${REGISTRY_IMAGE}:${BUILD_NUMBER}"
        IMAGE_LATEST = "${REGISTRY_IMAGE}:latest"
        
        VM_NAME = 'sitako-vm'
        VM_APP_DIR = '/home/ubuntu/sitako'
        MULTIPASS_BIN = 'C:/Program Files/Multipass/bin/multipass.exe'
    }

    options {
        skipDefaultCheckout(true)
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 20, unit: 'MINUTES')
        timestamps()
    }

    stages {
        stage('Verify Multipass') {
            steps {
                withCredentials([
                    string(credentialsId: 'multipass-passphrase-global', variable: 'MULTIPASS_PASSPHRASE')
                ]) {
                    powershell '''
                        $ErrorActionPreference = 'Stop'
                        $multipass =$env:MULTIPASS_BIN

                        if (-not (Test-Path -LiteralPath $multipass)) {
                            throw "Multipass tidak ditemukan: $multipass"
                        }

                        & $multipass version
                        if ($LASTEXITCODE -ne 0) { throw "Multipass CLI tidak dapat dijalankan." }

                        & $multipass authenticate "$env:MULTIPASS_PASSPHRASE"
                        if ($LASTEXITCODE -ne 0) { throw "Multipass authentication gagal." }

                        & $multipass info$env:VM_NAME
                        if ($LASTEXITCODE -ne 0) { throw "VM '$env:VM_NAME' tidak dapat diakses." }
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
                    powershell '''
                        $ErrorActionPreference = 'Stop'

                        docker build -t $env:IMAGE_TAG -t$env:IMAGE_LATEST .
                        if ($LASTEXITCODE -ne 0) { throw "Docker build gagal." }

                        echo $env:DOCKER_PASS \vert{} docker login -u$env:DOCKER_USER --password-stdin
                        if ($LASTEXITCODE -ne 0) { throw "Docker login gagal." }

                        docker push $env:IMAGE_TAG
                        if ($LASTEXITCODE -ne 0) { throw "Push tag spesifik gagal." }

                        docker push $env:IMAGE_LATEST
                        if ($LASTEXITCODE -ne 0) { throw "Push tag latest gagal." }
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
                    usernamePassword(credentialsId: 'docker-registry-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')
                ]) {
                    powershell '''
                        $ErrorActionPreference = 'Stop'
                        $multipass =$env:MULTIPASS_BIN

                        & $multipass exec$env:VM_NAME -- bash -lc `
                            "mkdir -p '$env:VM_APP_DIR' && echo '$env:DOCKER_PASS' | docker login -u '$env:DOCKER_USER' --password-stdin && docker pull '$env:IMAGE_TAG' && docker tag '$env:IMAGE_TAG' '$env:APP_NAME:latest' && docker logout"
                        if ($LASTEXITCODE -ne 0) { throw "Gagal pull image di VM." }

                        & $multipass transfer docker-compose.yml "$($env:VM_NAME):$($env:VM_APP_DIR)/docker-compose.yml"
                        if ($LASTEXITCODE -ne 0) { throw "Transfer docker-compose.yml gagal." }

                        & $multipass exec $env:VM_NAME -- bash -lc `
                            "cd '$env:VM_APP_DIR' && docker compose -f docker-compose.yml stop app 2>/dev/null; docker compose -f docker-compose.yml rm -f app 2>/dev/null; true"

                        & $multipass transfer -r infra "$($env:VM_NAME):$($env:VM_APP_DIR)/infra"
                        if ($LASTEXITCODE -ne 0) { throw "Transfer infra gagal." }

                        & $multipass transfer$env:SITAKO_ENV_FILE "$($env:VM_NAME):$($env:VM_APP_DIR)/.env"
                        if ($LASTEXITCODE -ne 0) { throw "Gagal mentransfer .env ke VM." }

                        & $multipass exec $env:VM_NAME -- bash -lc "chmod 600 '$env:VM_APP_DIR/.env'"
                        if ($LASTEXITCODE -ne 0) { throw "Gagal mengatur permission .env." }

                        & $multipass exec$env:VM_NAME -- bash -lc `
                            "cd '$env:VM_APP_DIR' && docker compose -f docker-compose.yml up -d --remove-orphans database redis postgres_exporter redis_exporter"
                        if ($LASTEXITCODE -ne 0) { throw "Start service pendukung gagal." }
                    '''

                    script {
                        if (params.RUN_MIGRATION) {
                            powershell '''
                                $ErrorActionPreference = 'Stop'
                                $multipass = $env:MULTIPASS_BIN

                                Start-Sleep -Seconds 10
                                & $multipass exec $env:VM_NAME -- bash -lc `
                                    "cd '$env:VM_APP_DIR' && docker compose -f docker-compose.yml run --rm app npm run db:migrate:prod"
                                if ($LASTEXITCODE -ne 0) { throw "Migrasi database gagal." }
                            '''
                        }
                    }

                    powershell '''
                        $ErrorActionPreference = 'Stop'
                        $multipass =$env:MULTIPASS_BIN

                        & $multipass exec$env:VM_NAME -- bash -lc `
                            "cd '$env:VM_APP_DIR' && docker compose -f docker-compose.yml up -d --remove-orphans app"
                        if ($LASTEXITCODE -ne 0) { throw "Start app gagal." }

                        & $multipass exec $env:VM_NAME -- bash -lc `
                            "cd '$env:VM_APP_DIR' && docker compose -f docker-compose.yml up -d --remove-orphans prometheus && docker image prune -f"
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
                    usernamePassword(credentialsId: 'docker-registry-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')
                ]) {
                    powershell '''
                        $ErrorActionPreference = 'Stop'
                        $multipass =$env:MULTIPASS_BIN

                        & $multipass exec$env:VM_NAME -- bash -lc `
                            "mkdir -p '$env:VM_APP_DIR' && echo '$env:DOCKER_PASS' | docker login -u '$env:DOCKER_USER' --password-stdin && docker pull '$env:IMAGE_TAG' && docker tag '$env:IMAGE_TAG' '$env:APP_NAME:latest' && docker logout"
                        if ($LASTEXITCODE -ne 0) { throw "Gagal pull image di VM." }

                        & $multipass transfer docker-compose.prod.yml "$($env:VM_NAME):$($env:VM_APP_DIR)/docker-compose.prod.yml"
                        if ($LASTEXITCODE -ne 0) { throw "Transfer docker-compose.prod.yml gagal." }

                        & $multipass exec $env:VM_NAME -- bash -lc `
                            "cd '$env:VM_APP_DIR' && docker compose -f docker-compose.prod.yml stop app 2>/dev/null; docker compose -f docker-compose.prod.yml rm -f app 2>/dev/null; true"

                        & $multipass transfer -r infra "$($env:VM_NAME):$($env:VM_APP_DIR)/infra"
                        if ($LASTEXITCODE -ne 0) { throw "Transfer infra gagal." }

                        & $multipass transfer$env:SITAKO_ENV_FILE "$($env:VM_NAME):$($env:VM_APP_DIR)/.env"
                        if ($LASTEXITCODE -ne 0) { throw "Gagal mentransfer .env ke VM." }

                        & $multipass exec $env:VM_NAME -- bash -lc "chmod 600 '$env:VM_APP_DIR/.env'"
                        if ($LASTEXITCODE -ne 0) { throw "Gagal mengatur permission .env." }

                        & $multipass exec$env:VM_NAME -- bash -lc `
                            "cd '$env:VM_APP_DIR' && docker compose -f docker-compose.prod.yml up -d --remove-orphans database redis postgres_exporter redis_exporter"
                        if ($LASTEXITCODE -ne 0) { throw "Start service pendukung gagal." }
                    '''

                    script {
                        if (params.RUN_MIGRATION) {
                            powershell '''
                                $ErrorActionPreference = 'Stop'
                                $multipass = $env:MULTIPASS_BIN

                                & $multipass exec $env:VM_NAME -- bash -lc `
                                    "cd '$env:VM_APP_DIR' && docker compose -f docker-compose.prod.yml run --rm app npm run db:migrate:prod"
                                if ($LASTEXITCODE -ne 0) { throw "Migrasi database gagal." }
                            '''
                        }
                    }

                    powershell '''
                        $ErrorActionPreference = 'Stop'
                        $multipass =$env:MULTIPASS_BIN

                        & $multipass exec$env:VM_NAME -- bash -lc `
                            "cd '$env:VM_APP_DIR' && docker compose -f docker-compose.prod.yml up -d --scale app=$env:REPLICA_COUNT --remove-orphans && docker image prune -f"
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
                    usernamePassword(credentialsId: 'docker-registry-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')
                ]) {
                    powershell '''
                        $ErrorActionPreference = 'Stop'
                        $multipass = $env:MULTIPASS_BIN

                        & $multipass exec $env:VM_NAME -- bash -lc `
                            "mkdir -p '$env:VM_APP_DIR' && echo '$env:DOCKER_PASS' | docker login -u '$env:DOCKER_USER' --password-stdin && docker pull '$env:IMAGE_TAG' && docker tag '$env:IMAGE_TAG' '$env:APP_NAME:latest' && docker logout"
                        if ($LASTEXITCODE -ne 0) { throw "Gagal pull image di VM." }

                        & $multipass transfer -r k8s "$($env:VM_NAME):$($env:VM_APP_DIR)/k8s"
                        if ($LASTEXITCODE -ne 0) { throw "Transfer manifest K3s gagal." }

                        & $multipass exec$env:VM_NAME -- bash -lc `
                            "docker save '$env:APP_NAME:latest' -o '$env:VM_APP_DIR/$env:APP_NAME.tar' && sudo k3s ctr -n k8s.io images import '$env:VM_APP_DIR/$env:APP_NAME.tar' && rm -f '$env:VM_APP_DIR/$env:APP_NAME.tar' && docker image prune -f"
                        if ($LASTEXITCODE -ne 0) { throw "Import image ke K3s dan pruning image gagal." }

                        & $multipass exec $env:VM_NAME -- bash -lc "sudo k3s kubectl apply -f '$env:VM_APP_DIR/k8s'"
                        if ($LASTEXITCODE -ne 0) { throw "Apply manifest K3s gagal." }

                        & $multipass exec $env:VM_NAME -- bash -lc `
                            "sudo k3s kubectl rollout restart deploy/sitako-app -n sitako && sudo k3s kubectl rollout status deploy/sitako-app -n sitako --timeout=120s"
                        if ($LASTEXITCODE -ne 0) { throw "Rollout restart K3s gagal." }
                    '''
                }

                script {
                    if (params.RUN_MIGRATION) {
                        powershell '''
                            $ErrorActionPreference = 'Stop'
                            $multipass =$env:MULTIPASS_BIN

                            Start-Sleep -Seconds 15
                            & $multipass exec$env:VM_NAME -- sudo k3s kubectl exec `
                                -n sitako `
                                deploy/sitako-app `
                                -c backend `
                                -- npm run db:migrate:prod

                            if ($LASTEXITCODE -ne 0) { throw "Migrasi database K3s gagal." }
                        '''
                    }
                }
            }
        }

        stage('Health Check') {
            steps {
                powershell '''
                    $ErrorActionPreference = 'Stop'
                    $multipass =$env:MULTIPASS_BIN
                    $success =$false

                    for ($i = 1; $i -le 12; $i++) {
                        & $multipass exec$env:VM_NAME -- curl -fsS --max-time 5 http://127.0.0.1:8080/
                        if ($LASTEXITCODE -eq 0) {
                            $success =$true
                            break
                        }
                        if ($i -lt 12) { Start-Sleep -Seconds 5 }
                    }
                    if (-not $success) { throw "Health check aplikasi gagal." }
                '''
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
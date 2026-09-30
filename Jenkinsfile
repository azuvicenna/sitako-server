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
                script {
                    onVm('''
                        runSsh "echo 'Koneksi SSH ke VirtualBox berhasil.'"
                    ''')
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

        /*
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
        */

        stage('Build') {
            steps {
                powershell '''
                    $ErrorActionPreference = 'Stop'
                    npm run build
                    if ($LASTEXITCODE -ne 0) { throw "Build aplikasi gagal." }
                '''
            }
        }

        stage('Debug Docker') {
            steps {
                bat '''
                    whoami
                    echo DOCKER_CONFIG=%DOCKER_CONFIG%
                    echo USERPROFILE=%USERPROFILE%
                    docker context ls
                    type "%USERPROFILE%\\.docker\\config.json"
                    docker logout
                    docker pull node:22-bookworm-slim
                '''
            }
        }

        stage('Docker Build & Push') {
            steps {
                withCredentials([dockerCredentials()]) {
                    bat '''
                        echo 1. Login ke Docker Registry...
                        echo %DOCKER_PASS%| docker login -u %DOCKER_USER% --password-stdin
                        if %ERRORLEVEL% NEQ 0 exit /b %ERRORLEVEL%

                        echo 2. Memulai proses Docker Build...
                        docker build -t %IMAGE_TAG% -t %IMAGE_LATEST% .
                        if %ERRORLEVEL% NEQ 0 exit /b %ERRORLEVEL%

                        echo 3. Push image versi spesifik...
                        docker push %IMAGE_TAG%
                        if %ERRORLEVEL% NEQ 0 exit /b %ERRORLEVEL%

                        echo 4. Push image versi latest...
                        docker push %IMAGE_LATEST%
                        if %ERRORLEVEL% NEQ 0 exit /b %ERRORLEVEL%

                        echo Proses Build dan Push Docker Berhasil!
                    '''
                }
            }
        }

        stage('Deploy (Docker Standalone)') {
            when {
                expression { params.DEPLOY_MODE == 'docker-standalone' }
            }
            steps {
                script {
                    deployCompose('docker-compose.yml', '1', 'prometheus')
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
                    deployCompose('docker-compose.prod.yml', params.REPLICA_COUNT.trim(), 'nginx prometheus')
                }
            }
        }

        stage('Deploy (K3s)') {
            when {
                expression { params.DEPLOY_MODE == 'k3s' }
            }
            steps {
                script {
                    onVm('''
                        pullImageOnVm

                        runSsh "docker save '$env:IMAGE_LATEST' -o '$env:VM_APP_DIR/$env:APP_NAME.tar' && sudo k3s ctr -n k8s.io images import '$env:VM_APP_DIR/$env:APP_NAME.tar' && rm -f '$env:VM_APP_DIR/$env:APP_NAME.tar' && docker image prune -f"

                        copyToVm k8s "$env:VM_APP_DIR/"
                        copyToVm $env:K8S_SECRET_FILE "$env:VM_APP_DIR/k8s/sitako-secret.yml"
                        runSsh "chmod 600 '$env:VM_APP_DIR/k8s/sitako-secret.yml'"

                        runSsh "kubectl apply -f '$env:VM_APP_DIR/k8s/sitako-secret.yml' && kubectl apply -f '$env:VM_APP_DIR/k8s/' && kubectl rollout restart deployment/sitako-backend"
                    ''', [
                        file(credentialsId: 'sitako-k8s-secret', variable: 'K8S_SECRET_FILE'),
                        dockerCredentials()
                    ])
                }
            }
        }

        stage('Health Check') {
            steps {
                script {
                    onVm('''
                        Start-Sleep -Seconds 15

                        $healthy = $false
                        for ($attempt = 1; $attempt -le 10 -and -not $healthy; $attempt++) {
                            Write-Host "Mengecek status aplikasi... (Percobaan $attempt dari 10)"
                            $output = & ssh -q -p $env:VM_PORT @sshOptions $remote "curl -s http://localhost:8080/health"
                            $healthy = "$output" -match 'OK|UP'
                            if (-not $healthy) { Start-Sleep -Seconds 10 }
                        }

                        if (-not $healthy) { throw "Aplikasi gagal berjalan atau tidak merespons setelah 10 percobaan." }
                        Write-Host "Health check berhasil!"
                    ''')
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo "Pipeline SITAKO ($DEPLOY_MODE) selesai dengan sukses."
        }
        failure {
            echo "Pipeline SITAKO ($DEPLOY_MODE) gagal."
        }
    }
}

def dockerCredentials() {
    return usernamePassword(
        credentialsId: 'docker-registry-creds',
        usernameVariable: 'DOCKER_USER',
        passwordVariable: 'DOCKER_PASS'
    )
}

// Helper PowerShell yang dipakai semua stage yang berbicara dengan VM.
String vmPrelude() {
    return '''
        $ErrorActionPreference = 'Stop'

        $remote = "$($env:VM_USER)@$($env:VM_IP)"
        $sshOptions = @('-i', $env:SSH_KEY, '-o', 'StrictHostKeyChecking=no', '-o', 'UserKnownHostsFile=NUL', '-o', 'LogLevel=ERROR')

        $currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
        icacls "$env:SSH_KEY" /inheritance:r | Out-Null
        icacls "$env:SSH_KEY" /grant:r "${currentUser}:F" | Out-Null

        Write-Host "scp yang dipakai: $((Get-Command scp).Source)"

        function runSsh([string]$command) {
            & ssh -p $env:VM_PORT @sshOptions $remote $command
            if ($LASTEXITCODE -ne 0) { throw "Perintah SSH gagal: $command" }
        }

        function copyToVm([string]$source, [string]$target) {
            if (-not (Test-Path -LiteralPath $source)) {
                throw "'$source' tidak ditemukan di workspace ($(Get-Location))."
            }
            & scp -r -P $env:VM_PORT @sshOptions $source "${remote}:$target"
            if ($LASTEXITCODE -ne 0) { throw "Transfer '$source' gagal." }
        }

        function pullImageOnVm {
            & ssh -p $env:VM_PORT @sshOptions $remote "mkdir -p '$env:VM_APP_DIR' && echo '$env:DOCKER_PASS' | docker login -u '$env:DOCKER_USER' --password-stdin && docker pull '$env:IMAGE_TAG' && docker tag '$env:IMAGE_TAG' '$env:IMAGE_LATEST' && docker tag '$env:IMAGE_TAG' '${env:APP_NAME}:latest' && docker logout"
            if ($LASTEXITCODE -ne 0) { throw "Gagal pull image di VM." }
        }
    '''
}

// Menjalankan script PowerShell dengan SSH key (dan credential tambahan bila ada).
def onVm(String script, List extraCredentials = []) {
    withCredentials([sshUserPrivateKey(credentialsId: 'vbox-ssh-key', keyFileVariable: 'SSH_KEY')] + extraCredentials) {
        powershell(vmPrelude() + script)
    }
}

// Deploy standalone dan multi-replica sama, hanya beda compose file, jumlah replika, dan service tambahan.
def deployCompose(String composeFile, String appScale, String edgeServices) {
    withEnv(["COMPOSE_FILE=${composeFile}", "APP_SCALE=${appScale}", "EDGE_SERVICES=${edgeServices}"]) {
        onVm('''
            pullImageOnVm

            copyToVm $env:COMPOSE_FILE "$env:VM_APP_DIR/$env:COMPOSE_FILE"

            $compose = "cd '$env:VM_APP_DIR' && docker compose -f $env:COMPOSE_FILE"
            runSsh "$compose stop app 2>/dev/null; $compose rm -f app 2>/dev/null; true"

            runSsh "mkdir -p '$env:VM_APP_DIR/infra'"
            copyToVm infra/nginx "$env:VM_APP_DIR/infra/"
            copyToVm infra/prometheus.yml "$env:VM_APP_DIR/infra/prometheus.yml"
            copyToVm $env:SITAKO_ENV_FILE "$env:VM_APP_DIR/.env"
            runSsh "chmod 600 '$env:VM_APP_DIR/.env'"

            runSsh "$compose up -d --remove-orphans database redis postgres_exporter redis_exporter"

            if ($env:RUN_MIGRATION -eq 'true') {
                Start-Sleep -Seconds 10
                runSsh "$compose run --rm -T app npm run db:migrate:prod"
            }

            runSsh "$compose up -d --scale app=$env:APP_SCALE --remove-orphans app"
            runSsh "$compose up -d --remove-orphans $env:EDGE_SERVICES && docker image prune -f"
        ''', [
            file(credentialsId: 'sitako-env', variable: 'SITAKO_ENV_FILE'),
            dockerCredentials()
        ])
    }
}
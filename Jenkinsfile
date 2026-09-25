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
        IMAGE_TAG = "${APP_NAME}:${BUILD_NUMBER}"
        VM_NAME = 'sitako-vm'
        VM_APP_DIR = '/home/ubuntu/sitako'
        MULTIPASS_BIN = 'C:\\Program Files\\Multipass\\bin\\multipass.exe'
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 20, unit: 'MINUTES')
        timestamps()
    }

    stages {
        stage('Verify Multipass') {
            steps {
                withCredentials([
                    string(
                        credentialsId: 'multipass-passphrase-global',
                        variable: 'MULTIPASS_PASSPHRASE'
                    )
                ]) {
                    powershell '''
$ErrorActionPreference = 'Stop'

$multipass = $env:MULTIPASS_BIN

if (-not (Test-Path -LiteralPath $multipass)) {
    throw "Multipass tidak ditemukan: $multipass"
}

Write-Host "Multipass:"
& $multipass version

if ($LASTEXITCODE -ne 0) {
    throw "Multipass CLI tidak dapat dijalankan."
}

Write-Host "Authenticating Multipass client..."

& $multipass authenticate "$env:MULTIPASS_PASSPHRASE"

if ($LASTEXITCODE -ne 0) {
    throw "Multipass authentication gagal."
}

Write-Host "Multipass authentication berhasil."

Write-Host "Memeriksa VM..."

& $multipass info $env:VM_NAME

if ($LASTEXITCODE -ne 0) {
    throw "VM '$env:VM_NAME' tidak dapat diakses."
}

Write-Host "Multipass dan VM siap digunakan."
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

if ($LASTEXITCODE -ne 0) {
    throw "npm ci gagal."
}
'''
            }
        }

        stage('Lint') {
            steps {
                powershell '''
$ErrorActionPreference = 'Stop'

npm run lint --if-present

if ($LASTEXITCODE -ne 0) {
    throw "Lint gagal."
}
'''
            }
        }

        stage('Test') {
            steps {
                powershell '''
$ErrorActionPreference = 'Stop'

npm run test:unit --if-present

if ($LASTEXITCODE -ne 0) {
    throw "Unit test gagal."
}

npm run test:feature --if-present

if ($LASTEXITCODE -ne 0) {
    throw "Feature test gagal."
}
'''
            }
        }

        stage('Build') {
            steps {
                powershell '''
$ErrorActionPreference = 'Stop'

npm run build

if ($LASTEXITCODE -ne 0) {
    throw "Build aplikasi gagal."
}
'''
            }
        }

        stage('Docker Build (in VM)') {
            steps {
                powershell '''
$ErrorActionPreference = 'Stop'

$multipass = $env:MULTIPASS_BIN

Write-Host "Menyiapkan direktori aplikasi di VM..."

& $multipass exec $env:VM_NAME -- bash -lc "mkdir -p '$env:VM_APP_DIR' && rm -rf '$env:VM_APP_DIR/src'"

if ($LASTEXITCODE -ne 0) {
    throw "Gagal menyiapkan direktori aplikasi di VM."
}

Write-Host "Transfer source code ke VM..."

& $multipass transfer -r . "$env:VM_NAME`:$env:VM_APP_DIR/src"

if ($LASTEXITCODE -ne 0) {
    throw "Transfer source ke VM gagal."
}

Write-Host "Building Docker image di VM..."

& $multipass exec $env:VM_NAME -- bash -lc "cd '$env:VM_APP_DIR/src' && docker build -t '$env:IMAGE_TAG' -t '$env:APP_NAME`:latest' ."

if ($LASTEXITCODE -ne 0) {
    throw "Docker build gagal."
}
'''
            }
        }

        stage('Deploy (Docker Standalone)') {
            when {
                expression {
                    params.DEPLOY_MODE == 'docker-standalone'
                }
            }

            steps {
                powershell '''
$ErrorActionPreference = 'Stop'

$multipass = $env:MULTIPASS_BIN

Write-Host "Transfer konfigurasi Docker Standalone..."

& $multipass transfer `
    docker-compose.yml `
    "$env:VM_NAME`:$env:VM_APP_DIR/docker-compose.yml"

if ($LASTEXITCODE -ne 0) {
    throw "Transfer docker-compose.yml gagal."
}

& $multipass transfer `
    -r infra `
    "$env:VM_NAME`:$env:VM_APP_DIR/infra"

if ($LASTEXITCODE -ne 0) {
    throw "Transfer infra gagal."
}

Write-Host "Deploying Standalone container..."

& $multipass exec $env:VM_NAME -- bash -lc `
    "cd '$env:VM_APP_DIR' && docker compose -f docker-compose.yml up -d --remove-orphans"

if ($LASTEXITCODE -ne 0) {
    throw "Deploy Standalone gagal."
}
'''

                script {
                    if (params.RUN_MIGRATION) {
                        echo 'Menjalankan migrasi database (Standalone)...'

                        powershell '''
$ErrorActionPreference = 'Stop'

$multipass = $env:MULTIPASS_BIN

& $multipass exec $env:VM_NAME -- bash -lc `
    "cd '$env:VM_APP_DIR' && docker compose -f docker-compose.yml exec -T app npm run db:migrate:prod"

if ($LASTEXITCODE -ne 0) {
    throw "Migrasi database gagal."
}
'''
                    }
                }
            }
        }

        stage('Deploy (Docker Multi-Replica)') {
            when {
                expression {
                    params.DEPLOY_MODE == 'docker-multi-replica'
                }
            }

            steps {
                script {
                    if (!(params.REPLICA_COUNT?.trim() ==~ /^[1-9][0-9]*$/)) {
                        error('REPLICA_COUNT harus berupa angka >= 1.')
                    }
                }

                powershell '''
$ErrorActionPreference = 'Stop'

$multipass = $env:MULTIPASS_BIN

Write-Host "Transfer konfigurasi Multi-Replica..."

& $multipass transfer `
    docker-compose.prod.yml `
    "$env:VM_NAME`:$env:VM_APP_DIR/docker-compose.prod.yml"

if ($LASTEXITCODE -ne 0) {
    throw "Transfer docker-compose.prod.yml gagal."
}

& $multipass transfer `
    -r infra `
    "$env:VM_NAME`:$env:VM_APP_DIR/infra"

if ($LASTEXITCODE -ne 0) {
    throw "Transfer infra gagal."
}

Write-Host "Deploying Multi-Replica containers..."

& $multipass exec $env:VM_NAME -- bash -lc `
    "cd '$env:VM_APP_DIR' && docker compose -f docker-compose.prod.yml up -d --scale app=$env:REPLICA_COUNT --remove-orphans"

if ($LASTEXITCODE -ne 0) {
    throw "Deploy Multi-Replica gagal."
}
'''

                script {
                    if (params.RUN_MIGRATION) {
                        echo 'Menjalankan migrasi database (Multi-Replica)...'

                        powershell '''
$ErrorActionPreference = 'Stop'

$multipass = $env:MULTIPASS_BIN

& $multipass exec $env:VM_NAME -- bash -lc `
    "cd '$env:VM_APP_DIR' && docker compose -f docker-compose.prod.yml run --rm --no-deps app npm run db:migrate:prod"

if ($LASTEXITCODE -ne 0) {
    throw "Migrasi database gagal."
}
'''
                    }
                }
            }
        }

        stage('Deploy (K3s)') {
            when {
                expression {
                    params.DEPLOY_MODE == 'k3s'
                }
            }

            steps {
                powershell '''
$ErrorActionPreference = 'Stop'

$multipass = $env:MULTIPASS_BIN

Write-Host "Transfer Kubernetes manifests..."

& $multipass transfer `
    -r k8s `
    "$env:VM_NAME`:$env:VM_APP_DIR/k8s"

if ($LASTEXITCODE -ne 0) {
    throw "Transfer manifest K3s gagal."
}

Write-Host "Export & Import Docker Image ke K3s..."

& $multipass exec $env:VM_NAME -- bash -lc `
    "docker save '$env:APP_NAME`:latest' -o '$env:VM_APP_DIR/$env:APP_NAME.tar' && sudo k3s ctr -n k8s.io images import '$env:VM_APP_DIR/$env:APP_NAME.tar'"

if ($LASTEXITCODE -ne 0) {
    throw "Import image ke K3s gagal."
}

Write-Host "Applying Kubernetes Manifests..."

& $multipass exec $env:VM_NAME -- bash -lc `
    "sudo k3s kubectl apply -f '$env:VM_APP_DIR/k8s'"

if ($LASTEXITCODE -ne 0) {
    throw "Apply manifest K3s gagal."
}

Write-Host "Restarting & Verifying Rollout..."

& $multipass exec $env:VM_NAME -- bash -lc `
    "sudo k3s kubectl rollout restart deploy/sitako-app -n sitako && sudo k3s kubectl rollout status deploy/sitako-app -n sitako --timeout=120s"

if ($LASTEXITCODE -ne 0) {
    throw "Rollout restart K3s gagal."
}
'''

                script {
                    if (params.RUN_MIGRATION) {
                        echo 'Menjalankan migrasi database di Pod K3s...'

                        powershell '''
$ErrorActionPreference = 'Stop'

$multipass = $env:MULTIPASS_BIN

& $multipass exec $env:VM_NAME -- sudo k3s kubectl exec `
    -n sitako `
    deploy/sitako-app `
    -c backend `
    -- npm run db:migrate:prod

if ($LASTEXITCODE -ne 0) {
    throw "Migrasi database K3s gagal."
}
'''
                    }
                }
            }
        }

        stage('Health Check') {
            steps {
                script {
                    def vmIp = powershell(
                        script: '''
$ErrorActionPreference = 'Stop'

$output = & $env:MULTIPASS_BIN info $env:VM_NAME

if ($LASTEXITCODE -ne 0) {
    throw "Gagal mendapatkan info VM."
}

$line = $output | Select-String '^IPv4:'

if (-not $line) {
    throw "IPv4 VM tidak ditemukan."
}

$ip = ($line.ToString() -replace '^IPv4:\\s*', '').Trim()

if (-not $ip) {
    throw "IPv4 VM kosong."
}

Write-Output $ip
''',
                        returnStdout: true
                    ).trim()

                    def targetUrl = params.DEPLOY_MODE == 'docker-standalone'
                        ? "http://${vmIp}:8080/"
                        : "http://${vmIp}/"

                    echo "Memulai Health Check ke ${targetUrl}..."

                    withEnv(["TARGET_URL=${targetUrl}"]) {
                        powershell '''
$ErrorActionPreference = 'Stop'

$success = $false

for ($i = 1; $i -le 12; $i++) {
    try {
        $response = Invoke-WebRequest `
            -Uri $env:TARGET_URL `
            -UseBasicParsing `
            -TimeoutSec 5 `
            -ErrorAction Stop

        if ($response.StatusCode -eq 200) {
            Write-Host "Health check berhasil di $env:TARGET_URL"
            $success = $true
            break
        }
    }
    catch {
        Write-Host "Percobaan $i/12 belum berhasil."

        if ($i -lt 12) {
            Start-Sleep -Seconds 5
        }
    }
}

if (-not $success) {
    throw "Health check gagal setelah 12 percobaan ke $env:TARGET_URL."
}
'''
                    }
                }
            }
        }
    }

    post {
        success {
            echo "Deploy ${params.DEPLOY_MODE} ke ${env.VM_NAME} berhasil (build #${env.BUILD_NUMBER})"
        }

        failure {
            echo "Pipeline gagal pada mode ${params.DEPLOY_MODE}. Periksa log stage yang gagal."
        }

        always {
            deleteDir()
        }
    }
}

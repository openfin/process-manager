pipeline {

    agent { label 'linux-slave' }

    stages {
        stage('checkout') {
            steps {
                checkout scm
            }
        }

        stage('build-deploy') {
            steps {
                script {
                    GIT_SHORT_SHA = sh ( script: "git rev-parse --short HEAD", returnStdout: true ).trim()
                    VERSION = sh ( script: "node -pe \"require('./package.json').version\"", returnStdout: true ).trim()
                    S3_LOC = env.CDN_DEMO_S3_ROOT + 'process-manager2/'
                }
                sh "npm i"
                sh "npm run build"
                sh "echo \"${VERSION} ${GIT_SHORT_SHA}\" > ./build/version.txt"
                sh "aws s3 cp ./build ${S3_LOC}/ --recursive --exclude '*.svg' --exclude 'app.*.json' --exclude 'index.html'"
                sh "aws s3 cp ./build ${S3_LOC}/ --recursive --exclude '*' --include 'index.html' --content-type 'text/html; charset=utf-8'"
                sh "aws s3 cp ./build ${S3_LOC}/ --recursive --exclude '*' --include '*.svg' --content-type 'image/svg+xml'"
                sh "aws s3 cp ./build ${S3_LOC}/ --recursive --exclude '*' --include 'app.*.json' --exclude 'app.local.*.json' --content-type 'application/json'"
            }
        }
    }
}
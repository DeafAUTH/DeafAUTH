#!/bin/bash

# DeafAUTH Deployment Script
echo "Starting DeafAUTH deployment..."

# Check for GCP CLI
if ! command -v gcloud &> /dev/null; then
    echo "Google Cloud SDK not found. Please install it first."
    exit 1
fi

# Set project variables
PROJECT_ID="auth-458419"
PROJECT_NUMBER="690508116504"
PROJECT_NAME="DeafAuth"
REGION="us-central1"
ZONE="us-central1-a"

# Authenticate with GCP
echo "Authenticating with GCP..."
gcloud auth login

# Set the project
echo "Setting GCP project..."
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "Enabling required GCP APIs..."
gcloud services enable \
    compute.googleapis.com \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    storage.googleapis.com \
    vision.googleapis.com \
    cloudfunctions.googleapis.com

# Create VPC network
echo "Creating VPC network..."
gcloud compute networks create deaf-auth-network \
    --subnet-mode=custom

# Create subnet
echo "Creating subnet..."
gcloud compute networks subnets create deaf-auth-subnet \
    --network=deaf-auth-network \
    --range=10.0.0.0/24 \
    --region=$REGION

# Create firewall rules
echo "Setting up firewall rules..."
gcloud compute firewall-rules create allow-http \
    --network=deaf-auth-network \
    --allow=tcp:80,tcp:443 \
    --source-ranges=0.0.0.0/0

# Create Cloud Storage buckets
echo "Creating storage buckets..."
gsutil mb -l $REGION gs://deaf-auth-video-storage-$PROJECT_ID
gsutil mb -l $REGION gs://deaf-auth-model-storage-$PROJECT_ID
gsutil mb -l $REGION gs://deaf-auth-logs-$PROJECT_ID

# Deploy Cloud Run service
echo "Deploying Cloud Run service..."
gcloud run deploy deaf-auth-service \
    --source . \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --memory 4Gi \
    --cpu 2 \
    --min-instances 1 \
    --max-instances 10 \
    --project $PROJECT_ID

# Set up monitoring
echo "Setting up monitoring..."
gcloud monitoring workspaces create \
    --display-name="DeafAUTH Monitoring" \
    --project $PROJECT_ID

# Deploy TensorFlow model
echo "Deploying TensorFlow model..."
gcloud ai-platform models create deaf-auth-model \
    --region=$REGION \
    --project $PROJECT_ID

# Create model version
echo "Creating model version..."
gcloud ai-platform versions create v1 \
    --model=deaf-auth-model \
    --origin=gs://deaf-auth-model-storage-$PROJECT_ID/model \
    --runtime-version=2.8 \
    --python-version=3.7 \
    --project $PROJECT_ID

echo "Deployment completed successfully!"
echo "Project Details:"
echo "Project Name: $PROJECT_NAME"
echo "Project ID: $PROJECT_ID"
echo "Project Number: $PROJECT_NUMBER"
echo "Please check the GCP Console for detailed status and next steps."

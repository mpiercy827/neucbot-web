CONTAINER_NAME=neucbot-web

run: build-dev
	docker run -p 8000:8000 ${CONTAINER_NAME}:latest

build-dev:
	docker build -t ${CONTAINER_NAME} .

build-prod:
	docker build -t us-central1-docker.pkg.dev/ucr-ursa-major-sbc/neucbot-repo/neucbot:latest .

push-prod:
	docker push us-central1-docker.pkg.dev/ucr-ursa-major-sbc/neucbot-repo/neucbot:latest

deploy-prod:
	gcloud run deploy neucbot --image=us-central1-docker.pkg.dev/ucr-ursa-major-sbc/neucbot-repo/neucbot:latest --allow-unauthenticated --region=us-central1 --port=8000 --min-instances=1 --max-instances=5

deploy: build-prod push-prod deploy-prod

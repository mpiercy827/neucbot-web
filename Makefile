CONTAINER_NAME=neucbot-web

run: build
	docker run -p 8000:8000 ${CONTAINER_NAME}:latest

build:
	docker build -t ${CONTAINER_NAME} .


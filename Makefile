.PHONY: build dockerfile-prepare
SRC_DIR=.

build:
	docker build -t $(IMAGE_URL):$(DOCKER_TAG) --build-arg COMMIT_ID=$(COMMIT_ID) --cache-from $(IMAGE_URL):latest .

dockerfile-prepare: 
	npm install
	npm run build

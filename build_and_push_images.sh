./gradlew clean  bootRepackage buildDocker -x test -Pprod  -PnodeInstall --no-daemon

docker push arcadeanalytics/arcadeanalytics:latest

./gradlew clean  bootRepackage buildDockerSingle  -x test -Pprod  -PnodeInstall --no-daemon

docker push arcadeanalytics/arcadeanalytics-single:latest

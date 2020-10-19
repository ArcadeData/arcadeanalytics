FROM adoptopenjdk:15-jdk-hotspot

ENV SPRING_OUTPUT_ANSI_ENABLED=ALWAYS \
    JHIPSTER_SLEEP=0 \
    JAVA_OPTS=""

ADD *.war /app.war

RUN mkdir /arcade-connectors

ADD arcade-connectors/arcade-connectors-*.jar /arcade-connectors/

EXPOSE 8080

CMD echo "The application will start in ${JHIPSTER_SLEEP}s..." && \
    sleep ${JHIPSTER_SLEEP} && \
    java ${JAVA_OPTS} -Djava.security.egd=file:/dev/./urandom -jar /app.war

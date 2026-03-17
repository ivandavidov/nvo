#!/bin/zsh

set -ex

cd java
./mvnw clean package
cd target
java -jar nvo-v2.jar normalize
java -jar nvo-v2.jar 4
java -jar nvo-v2.jar 7
java -jar nvo-v2.jar 10
java -jar nvo-v2.jar 12
java -cp nvo-v2.jar nvo.JsonGenerator index
java -cp nvo-v2.jar nvo.JsonGenerator 4
java -cp nvo-v2.jar nvo.JsonGenerator 7
java -cp nvo-v2.jar nvo.JsonGenerator 10
java -cp nvo-v2.jar nvo.JsonGenerator 12

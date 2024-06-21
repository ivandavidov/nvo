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

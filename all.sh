#!/bin/zsh

set -ex

cd java
./mvnw clean package
cd target
# Generate balove pages first so schools-{grade}.js can expose city RUO availability via si[*].r.
java -cp nvo-v2.jar nvo.RuoNormalizer all
java -cp nvo-v2.jar nvo.RuoDecomplexor sofia
java -cp nvo-v2.jar nvo.RuoPage sofia
for ruo_city in plovdiv asenovgrad karlovo sopot purvomai rakovski hisaria stanbiliiski kuklen suedinenie perushtitsa krichim varna aksakovo beloslav dulgopol provadia suvorovo burgas aitos karnobat nesebar pomorie sozopol sredets tsarevo ruse biala-ruse stara-zagora kazanluk radnevo chirpan pleven belene knezha levski sliven kotel dobrich balchik kavarna tervel shumen veliki-preslav pernik radomir haskovo dimitrovgrad liubimets svilengrad simeonovgrad topolovgrad harmanli blagoevgrad bansko petrich razlog sandanski simitli iakoruda iambol elhovo straldzha veliko-turnovo gorna-oryahovitsa elena liaskovets pavlikeni svishtov strazhitsa pazardzhik velingrad peshtera rakitovo septemvri strelcha panagiurishte vratsa biala-slatina kozlodui mezdra oriahovo gabrovo drianovo sevlievo triavna; do
  java -cp nvo-v2.jar nvo.RuoDecomplexor "$ruo_city"
  java -cp nvo-v2.jar nvo.RuoPage "$ruo_city"
done
java -cp nvo-v2.jar nvo.RuoIndexPage
java -jar nvo-v2.jar normalize
java -jar nvo-v2.jar 4
java -jar nvo-v2.jar 7
java -jar nvo-v2.jar 10
java -jar nvo-v2.jar 12
java -cp nvo-v2.jar nvo.api.JsonGenerator index
java -cp nvo-v2.jar nvo.api.JsonGenerator schools
java -cp nvo-v2.jar nvo.api.JsonGenerator cities
java -cp nvo-v2.jar nvo.api.JsonGenerator 4
java -cp nvo-v2.jar nvo.api.JsonGenerator 7
java -cp nvo-v2.jar nvo.api.JsonGenerator 10
java -cp nvo-v2.jar nvo.api.JsonGenerator 12
# Per-school pages read the schools/{code}.json produced by the 'schools' step above.
java -cp nvo-v2.jar nvo.api.JsonGenerator school-pages
java -cp nvo-v2.jar nvo.SitemapGenerator

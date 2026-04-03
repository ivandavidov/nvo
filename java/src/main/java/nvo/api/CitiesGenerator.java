package nvo.api;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;

import nvo.Cities;

import java.nio.file.Files;
import java.nio.file.Path;

import static nvo.api.GeneratorUtils.cleanDirectory;
import static nvo.api.JsonGenerator.OUTPUT_BASE;

public class CitiesGenerator {

    public void generate() throws Exception {
        Gson gson = new GsonBuilder().create();

        JsonObject allCities = new JsonObject();
        Path citiesDir = Path.of(OUTPUT_BASE, "cities");
        cleanDirectory(citiesDir);

        for (Cities.City city : Cities.ORDERED) {
            String slug = city.hrefName();

            JsonObject cj = new JsonObject();
            cj.addProperty("fullName", city.fullName());
            cj.addProperty("shortName", city.shortName());
            cj.addProperty("orderPosition", city.orderPosition());
            allCities.add(slug, cj);

            // Write individual cities/{slug}.json
            JsonObject individual = new JsonObject();
            individual.addProperty("slug", slug);
            individual.addProperty("fullName", city.fullName());
            individual.addProperty("shortName", city.shortName());
            individual.addProperty("orderPosition", city.orderPosition());
            Files.writeString(citiesDir.resolve(slug + ".json"), gson.toJson(individual) + "\n");
        }

        // Write bulk cities.json
        JsonObject root = new JsonObject();
        root.add("cities", allCities);
        Files.writeString(Path.of(OUTPUT_BASE, "cities.json"), gson.toJson(root) + "\n");

        System.out.println("Generated: " + Path.of(OUTPUT_BASE, "cities.json")
                + " (" + Cities.ORDERED.size() + " cities)");
    }
}

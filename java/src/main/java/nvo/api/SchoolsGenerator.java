package nvo.api;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonNull;
import com.google.gson.JsonObject;

import nvo.School;

import java.nio.file.Files;
import java.nio.file.Path;

import static nvo.api.GeneratorUtils.cleanDirectory;
import static nvo.api.JsonGenerator.OUTPUT_BASE;

public class SchoolsGenerator {

    public void generate() throws Exception {
        Gson gson = new GsonBuilder().serializeNulls().create();

        // Build bulk schools.json
        JsonObject allSchools = new JsonObject();
        Path schoolsDir = Path.of(OUTPUT_BASE, "schools");
        cleanDirectory(schoolsDir);

        School.schoolCodes.entrySet().stream()
                .sorted(java.util.Comparator.comparingInt(e -> Integer.parseInt(e.getKey())))
                .forEach(entry -> {
                    String code = entry.getKey();
                    String[] vals = entry.getValue();
                    // vals: [isPrivate, shortName, fullName] or [isPrivate, shortName, fullName, website]
                    boolean isPrivate = "1".equals(vals[0]);
                    String shortName = vals[1];
                    String fullName = vals[2];
                    String website = vals.length > 3 ? vals[3] : null;

                    JsonObject sj = new JsonObject();
                    sj.addProperty("shortName", shortName);
                    sj.addProperty("fullName", fullName);
                    if (website != null) {
                        sj.addProperty("website", website);
                    } else {
                        sj.add("website", JsonNull.INSTANCE);
                    }
                    sj.addProperty("isPrivate", isPrivate);
                    allSchools.add(code, sj);

                    // Write individual schools/{code}.json
                    try {
                        JsonObject individual = new JsonObject();
                        individual.addProperty("code", code);
                        individual.addProperty("shortName", shortName);
                        individual.addProperty("fullName", fullName);
                        if (website != null) {
                            individual.addProperty("website", website);
                        } else {
                            individual.add("website", JsonNull.INSTANCE);
                        }
                        individual.addProperty("isPrivate", isPrivate);
                        Files.writeString(schoolsDir.resolve(code + ".json"), gson.toJson(individual) + "\n");
                    } catch (Exception ex) {
                        throw new RuntimeException(ex);
                    }
                });

        // Write bulk schools.json
        JsonObject root = new JsonObject();
        root.add("schools", allSchools);
        Files.writeString(Path.of(OUTPUT_BASE, "schools.json"), gson.toJson(root) + "\n");

        System.out.println("Generated: " + Path.of(OUTPUT_BASE, "schools.json")
                + " (" + School.schoolCodes.size() + " schools)");
    }
}

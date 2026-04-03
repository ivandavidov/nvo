package nvo.api;

public class SchoolData {
    public String csvName;
    public Double[] belScore = new Double[JsonGenerator.NUM_YEARS];
    public Double[] matScore = new Double[JsonGenerator.NUM_YEARS];
    public Integer[] belStudents = new Integer[JsonGenerator.NUM_YEARS];
    public Integer[] matStudents = new Integer[JsonGenerator.NUM_YEARS];
}

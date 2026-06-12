package nvo.api;

public class SchoolData {
    public String csvName;
    public final Double[] belScore;
    public final Double[] matScore;
    public final Integer[] belStudents;
    public final Integer[] matStudents;

    /** Arrays are sized to the grade's own year count so a grade never carries phantom slots. */
    public SchoolData(int numYears) {
        belScore = new Double[numYears];
        matScore = new Double[numYears];
        belStudents = new Integer[numYears];
        matStudents = new Integer[numYears];
    }
}

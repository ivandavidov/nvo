package nvo;

import java.util.Objects;

public class Record {
    private String city;
    private String code;
    private String school;
    private Double first;
    private Double second;

    public Record() {
        // nothing
    }

    public Record(String city, String code, String school, Double first, Double second) {
        this.city = city;
        this.code = code;
        this.school = school;
        this.first = first;
        this.second = second;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getSchool() {
        return school;
    }

    public void setSchool(String school) {
        this.school = school;
    }

    public Double getFirst() {
        return first;
    }

    public void setFirst(Double first) {
        this.first = first;
    }

    public Double getSecond() {
        return second;
    }

    public void setSecond(Double second) {
        this.second = second;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Record record = (Record) o;
        return city.equals(record.city) &&
                code.equals(record.code) &&
                school.equals(record.school) &&
                Objects.equals(first, record.first) &&
                Objects.equals(second, record.second);
    }

    @Override
    public int hashCode() {
        return Objects.hash(city, code, school, first, second);
    }

    @Override
    public String toString() {
        return "Record {" +
                "city='" + city + '\'' +
                ", code='" + code + '\'' +
                ", school='" + school + '\'' +
                ", first=" + first +
                ", second=" + second +
                '}';
    }
}

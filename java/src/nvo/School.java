package nvo;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

public class School implements Comparable<School> {
    String label;
    String name;
    String code;
    List<Double> first = new ArrayList<>();
    List<Double> second = new ArrayList<>();

    public School() {
        // nothing
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public List<Double> getFirst() {
        return first;
    }

    public void setFirst(List<Double> first) {
        this.first = first;
    }

    public List<Double> getSecond() {
        return second;
    }

    public void setSecond(List<Double> second) {
        this.second = second;
    }

    public double calculateMedian() {
        int delimiters = 0;
        double sum = 0.0d;
        for(int i = 1; i <=3; i++ ) {
            int index = first.size() - i;
            if(index < 0) {
                break;
            }
            if(first.get(index) > 0.0d) {
                ++delimiters;
                sum += first.get(index);
            }
            if(second.get(index) > 0.0d) {
                ++delimiters;
                sum += second.get(index);
            }
        }
        if(delimiters > 0) {
            return sum / delimiters;
        }
        return 0.0d;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        School school = (School) o;
        return label.equals(school.label) &&
                name.equals(school.name) &&
                name.equals(school.code) &&
                first.equals(school.first) &&
                second.equals(school.second);
    }

    @Override
    public int hashCode() {
        return Objects.hash(label, name, first, second, code);
    }

    @Override
    public String toString() {
        return "School {" +
                "code='" + code + '\'' +
                ", label='" + label + '\'' +
                ", name='" + name + '\'' +
                ", first=" + first +
                ", second=" + second +
                '}';
    }

    @Override
    public int compareTo(School o) {
        return calculateMedian() < o.calculateMedian() ? 1 : -1;
    }
}

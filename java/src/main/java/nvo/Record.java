package nvo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
@ToString
class Record {
    private String city;
    private String code;
    private String school;
    private Double belScore;
    private Double matScore;
    private Integer belStudents;
    private Integer matStudents;
}

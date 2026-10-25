package nvo.api;

import nvo.SchoolType;

import java.util.List;

public record RankedSchool(String code, List<String> citySlugs, String shortName, String fullName,
                           SchoolType type, SchoolData sd) {

    public boolean isPrivate() {
        return type.isPrivate();
    }
}

package nvo.api;

import java.util.List;

public record RankedSchool(String code, List<String> citySlugs, String shortName, String fullName,
                           boolean isPrivate, SchoolData sd) {}

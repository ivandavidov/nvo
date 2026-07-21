package nvo;

import com.opencsv.CSVWriter;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.FileInputStream;
import java.io.FileWriter;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

public class RuoNormalizer {

    private static final String INPUT_DIR = ProjectConfig.DATA_RUO_SOFIA_DIR;
    private static final String OUTPUT_DIR = ProjectConfig.DATA_NORMALIZED_DIR;

    private static final String[] CSV_HEADER = {
        "year", "klasirane", "school_code", "school_name", "profile_code", "profile_name",
        "min_score_total", "min_score_male", "min_score_female",
        "max_score_total", "max_score_male", "max_score_female"
    };

    public static void main(String... args) throws Exception {
        if (args.length == 0) {
            System.err.println("Expected argument: 2023, 2024, 2025, 2026, or all");
            System.exit(1);
        }

        RuoNormalizer normalizer = new RuoNormalizer();
        switch (args[0]) {
            case "2023" -> normalizer.normalizeYear(2023);
            case "2024" -> normalizer.normalizeYear(2024);
            case "2025" -> normalizer.normalizeYear(2025);
            case "2026" -> normalizer.normalizeYear(2026);
            case "all" -> {
                normalizer.normalizeYear(2023);
                normalizer.normalizeYear(2024);
                normalizer.normalizeYear(2025);
                normalizer.normalizeYear(2026);
            }
            default -> {
                System.err.println("Invalid argument: " + args[0] + ". Expected: 2023, 2024, 2025, 2026, or all");
                System.exit(1);
            }
        }
    }

    private void normalizeYear(int year) throws Exception {
        switch (year) {
            case 2023 -> normalize2023();
            case 2024 -> normalize2024();
            case 2025 -> normalize2025();
            case 2026 -> normalize2026();
            default -> throw new IllegalArgumentException("Unsupported year: " + year);
        }
    }

    // ── Per-year methods ─────────────────────────────────────────────────────

    private void normalize2023() throws Exception {
        List<String[]> rows = new ArrayList<>();
        rows.addAll(normalizeKlasirane(2023, 1, 5));  // 11-column format (no Брой паралелки)
        rows.addAll(normalizeKlasirane(2023, 2, 6));  // 12-column format (Брой паралелки at col 5)
        rows.addAll(normalizeKlasirane(2023, 3, 6));  // 12-column format
        rows.addAll(normalizeKlasirane(2023, 4, 6));  // 12-column format
        writeCSV(2023, rows);
    }

    private void normalize2024() throws Exception {
        List<String[]> rows = new ArrayList<>();
        rows.addAll(normalizeKlasirane(2024, 1, 5));
        rows.addAll(normalizeKlasirane(2024, 2, 5));
        rows.addAll(normalizeKlasirane(2024, 3, 5));
        rows.addAll(normalizeKlasirane(2024, 4, 5));
        writeCSV(2024, rows);
    }

    private void normalize2025() throws Exception {
        List<String[]> rows = new ArrayList<>();
        rows.addAll(normalizeKlasirane(2025, 1, 5));
        rows.addAll(normalizeKlasirane(2025, 2, 5));
        rows.addAll(normalizeKlasirane(2025, 3, 5));
        rows.addAll(normalizeKlasirane(2025, 4, 5));
        writeCSV(2025, rows);
    }

    private void normalize2026() throws Exception {
        // Klasirane 1: 11-column layout with a leading № column (code at col 1, scores at 5).
        // Klasirane 2: different layout — NO № column (code at col 0, scores at 4), still with
        // the min/max gender split.
        List<String[]> rows = new ArrayList<>(normalizeKlasirane(2026, 1, 5));
        rows.addAll(normalizeKlasirane(2026, 2, 0, 4));
        writeCSV(2026, rows);
    }

    // ── Core parsing ─────────────────────────────────────────────────────────

    /**
     * Reads all sheets from the XLSX file for the given year/klasirane and extracts data rows.
     *
     * @param scoreColOffset 0-based index of the first score column (min_score_total).
     *                       5 for 11-column files, 6 for 12-column files (extra Брой паралелки column).
     */
    private List<String[]> normalizeKlasirane(int year, int klasirane, int scoreColOffset) throws Exception {
        return normalizeKlasirane(year, klasirane, 1, scoreColOffset);
    }

    /**
     * @param codeCol 0-based column of the school code. 1 for the layout with a leading №
     *                column, 0 for the layout without it (Sofia 2026 klasirane 2).
     */
    private List<String[]> normalizeKlasirane(int year, int klasirane, int codeCol, int scoreColOffset) throws Exception {
        String filename = resolveFilename(year, klasirane);
        List<String[]> rows = new ArrayList<>();

        try (FileInputStream fis = new FileInputStream(Path.of(INPUT_DIR, filename).toFile());
             Workbook workbook = new XSSFWorkbook(fis)) {

            for (int i = 0; i < workbook.getNumberOfSheets(); i++) {
                rows.addAll(parseSheet(workbook.getSheetAt(i), year, klasirane, codeCol, scoreColOffset));
            }
        }

        System.out.println("Normalized: " + filename + " -> " + rows.size() + " rows");
        return rows;
    }

    private List<String[]> parseSheet(Sheet sheet, int year, int klasirane, int codeCol, int scoreColOffset) {
        List<String[]> rows = new ArrayList<>();

        for (Row row : sheet) {
            // Data rows are identified by a numeric school code at codeCol; header/blank rows
            // (text or empty there) are skipped.
            String schoolCode = readNumericCellAsId(row.getCell(codeCol));
            String schoolName = readStringCell(row.getCell(codeCol + 1));
            if (schoolCode == null || schoolName == null || schoolName.isBlank()) {
                continue;
            }

            rows.add(new String[]{
                String.valueOf(year),
                String.valueOf(klasirane),
                schoolCode,
                schoolName,
                readIdCell(row.getCell(codeCol + 2)),
                readStringCell(row.getCell(codeCol + 3)),
                readScoreCell(row.getCell(scoreColOffset)),
                readScoreCell(row.getCell(scoreColOffset + 1)),
                readScoreCell(row.getCell(scoreColOffset + 2)),
                readScoreCell(row.getCell(scoreColOffset + 3)),
                readScoreCell(row.getCell(scoreColOffset + 4)),
                readScoreCell(row.getCell(scoreColOffset + 5))
            });
        }

        return rows;
    }

    // ── Cell helpers ─────────────────────────────────────────────────────────

    /** Returns true if the cell contains a positive whole number (identifies data rows). */
    private boolean isPositiveInteger(Cell cell) {
        if (cell == null || cell.getCellType() != CellType.NUMERIC) return false;
        double v = cell.getNumericCellValue();
        return v > 0 && v == Math.floor(v);
    }

    /** Reads a numeric cell as a plain integer string — used for school codes. */
    private String readNumericCellAsId(Cell cell) {
        if (cell == null || cell.getCellType() != CellType.NUMERIC) return null;
        return String.valueOf((long) cell.getNumericCellValue());
    }

    /**
     * Reads a cell that can be either NUMERIC or STRING — used for profile codes.
     * String type preserves leading zeros (e.g. "0814"); numeric type is cast to long.
     */
    private String readIdCell(Cell cell) {
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case NUMERIC -> String.valueOf((long) cell.getNumericCellValue());
            case STRING  -> cell.getStringCellValue().trim();
            default      -> "";
        };
    }

    private String readStringCell(Cell cell) {
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case STRING  -> cell.getStringCellValue().trim();
            case NUMERIC -> String.valueOf((long) cell.getNumericCellValue());
            default      -> null;
        };
    }

    /**
     * Reads a score cell and returns a clean decimal string.
     * Uses BigDecimal to avoid floating-point representation issues.
     * Returns "0" for blank/missing cells (no students of that gender).
     */
    private String readScoreCell(Cell cell) {
        if (cell == null || cell.getCellType() == CellType.BLANK) return "0";
        if (cell.getCellType() != CellType.NUMERIC) return "0";
        return BigDecimal.valueOf(cell.getNumericCellValue()).stripTrailingZeros().toPlainString();
    }

    // ── Output ───────────────────────────────────────────────────────────────

    private void writeCSV(int year, List<String[]> rows) throws IOException {
        String outputPath = OUTPUT_DIR + "ruo-sofia-" + year + "-normalized.csv";
        try (CSVWriter writer = new CSVWriter(new FileWriter(outputPath, false))) {
            writer.writeNext(CSV_HEADER);
            writer.writeAll(rows);
        }
        System.out.println("Written: " + outputPath + " (" + rows.size() + " total rows)");
    }

    private String resolveFilename(int year, int klasirane) {
        return String.format("min_max_%d_klasirane_%d.xlsx", klasirane, year);
    }
}

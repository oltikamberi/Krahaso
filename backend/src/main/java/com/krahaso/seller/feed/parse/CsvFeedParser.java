package com.krahaso.seller.feed.parse;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.apache.commons.csv.DuplicateHeaderMode;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Component
public class CsvFeedParser implements FeedParser {

    private static final char[] CANDIDATE_DELIMITERS = {',', ';', '\t', '|'};

    @Override
    public boolean supports(String filename, String contentType) {
        String name = filename == null ? "" : filename.toLowerCase(Locale.ROOT);
        String type = contentType == null ? "" : contentType.toLowerCase(Locale.ROOT);
        return name.endsWith(".csv") || name.endsWith(".tsv") || type.contains("csv");
    }

    @Override
    public List<FeedRow> parse(byte[] content) {
        String text = new String(content, StandardCharsets.UTF_8);
        if (text.startsWith("\uFEFF")) {
            text = text.substring(1);
        }

        CSVFormat format = CSVFormat.DEFAULT.builder()
                .setDelimiter(detectDelimiter(text))
                .setHeader()
                .setSkipHeaderRecord(true)
                .setIgnoreEmptyLines(true)
                .setIgnoreSurroundingSpaces(true)
                .setTrim(true)
                .setAllowMissingColumnNames(true)
                .setDuplicateHeaderMode(DuplicateHeaderMode.ALLOW_ALL)
                .get();

        List<FeedRow> rows = new ArrayList<>();
        try (CSVParser parser = CSVParser.parse(text, format)) {
            int rowNumber = 0;
            for (CSVRecord record : parser) {
                rowNumber++;
                rows.add(FeedFieldMapper.toRow(rowNumber, record.toMap()));
            }
        } catch (IOException unreadable) {
            throw new UncheckedIOException(unreadable);
        }
        return rows;
    }

    /** Picks whichever candidate separator appears most often in the header line. */
    private char detectDelimiter(String text) {
        int lineEnd = text.indexOf('\n');
        String header = lineEnd < 0 ? text : text.substring(0, lineEnd);

        char best = ',';
        long bestCount = 0;
        for (char candidate : CANDIDATE_DELIMITERS) {
            long count = header.chars().filter(character -> character == candidate).count();
            if (count > bestCount) {
                bestCount = count;
                best = candidate;
            }
        }
        return best;
    }
}

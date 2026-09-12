package com.krahaso.seller.feed.parse;

import java.util.List;

/** Turns raw feed bytes into rows. One implementation per file format. */
public interface FeedParser {

    boolean supports(String filename, String contentType);

    List<FeedRow> parse(byte[] content);
}

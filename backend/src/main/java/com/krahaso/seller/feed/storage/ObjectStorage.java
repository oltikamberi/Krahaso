package com.krahaso.seller.feed.storage;

import java.io.InputStream;

/** Where raw seller feed files live. Backed by S3-compatible storage. */
public interface ObjectStorage {

    /** Stores the bytes under {@code key} and returns the key. */
    String put(String key, byte[] content, String contentType);

    InputStream open(String key);
}

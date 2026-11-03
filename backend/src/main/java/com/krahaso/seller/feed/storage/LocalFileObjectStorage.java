package com.krahaso.seller.feed.storage;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Disk-backed storage for environments without an S3 endpoint (e.g. a single
 * Render instance in beta). Files are parsed right after upload, so an ephemeral
 * disk is acceptable there. Select with {@code KRAHASO_STORAGE_TYPE=local}.
 */
@Service
@ConditionalOnProperty(name = "krahaso.storage.type", havingValue = "local")
public class LocalFileObjectStorage implements ObjectStorage {

    private static final Logger log = LoggerFactory.getLogger(LocalFileObjectStorage.class);

    private final Path root;

    public LocalFileObjectStorage(@Value("${krahaso.storage.local-dir}") String dir) {
        this.root = Path.of(dir).toAbsolutePath().normalize();
    }

    @PostConstruct
    void ensureDirectory() {
        try {
            Files.createDirectories(root);
            log.info("Using local object storage at {}", root);
        } catch (IOException e) {
            throw new UncheckedIOException("Cannot create storage dir " + root, e);
        }
    }

    @Override
    public String put(String key, byte[] content, String contentType) {
        Path target = resolve(key);
        try {
            Files.createDirectories(target.getParent());
            Files.write(target, content);
        } catch (IOException e) {
            throw new UncheckedIOException("Cannot write " + key, e);
        }
        return key;
    }

    @Override
    public InputStream open(String key) {
        try {
            return Files.newInputStream(resolve(key));
        } catch (IOException e) {
            throw new UncheckedIOException("Cannot read " + key, e);
        }
    }

    /** Keeps keys inside the root so a crafted key cannot escape the directory. */
    private Path resolve(String key) {
        Path p = root.resolve(key).normalize();
        if (!p.startsWith(root)) {
            throw new IllegalArgumentException("Invalid storage key: " + key);
        }
        return p;
    }
}

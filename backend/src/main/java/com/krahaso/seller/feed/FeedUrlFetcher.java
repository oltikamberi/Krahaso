package com.krahaso.seller.feed;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.net.InetAddress;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.UnknownHostException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;

/**
 * Downloads a seller-supplied feed URL.
 *
 * <p>The URL comes from an untrusted user and is fetched by our server, which is
 * a server-side request forgery risk: a seller could aim a "feed" at an internal
 * service or a cloud metadata endpoint and read the response through the preview
 * screen. So every hostname is resolved and checked against private address
 * ranges, and redirects are followed by hand so each hop is checked too — a
 * public URL is free to redirect to a private one.
 */
@Component
public class FeedUrlFetcher {

    private static final Logger log = LoggerFactory.getLogger(FeedUrlFetcher.class);

    private static final Set<String> ALLOWED_SCHEMES = Set.of("http", "https");
    private static final Set<Integer> REDIRECT_CODES = Set.of(301, 302, 303, 307, 308);
    private static final int MAX_REDIRECTS = 3;
    private static final String USER_AGENT = "KrahasoFeedBot/1.0 (+https://krahaso.com)";

    private final HttpClient client;
    private final Duration timeout;
    private final long maxBytes;
    private final boolean allowPrivateHosts;

    public FeedUrlFetcher(
            @Value("${krahaso.feed.fetch-timeout}") Duration timeout,
            @Value("${krahaso.feed.max-download-bytes}") long maxBytes,
            @Value("${krahaso.feed.allow-private-hosts}") boolean allowPrivateHosts) {
        this.timeout = timeout;
        this.maxBytes = maxBytes;
        this.allowPrivateHosts = allowPrivateHosts;
        this.client = HttpClient.newBuilder()
                .connectTimeout(timeout)
                // Redirects are handled manually so every hop can be validated
                .followRedirects(HttpClient.Redirect.NEVER)
                .build();
    }

    /** Thrown for anything that makes a feed URL unusable; the message reaches the seller. */
    public static class FeedFetchException extends RuntimeException {
        public FeedFetchException(String message) {
            super(message);
        }

        public FeedFetchException(String message, Throwable cause) {
            super(message, cause);
        }
    }

    public record FeedFetchResult(
            byte[] content,
            String contentType,
            String etag,
            String lastModified,
            boolean notModified) {
    }

    /**
     * @param etag         validator from the previous fetch, or null
     * @param lastModified validator from the previous fetch, or null
     */
    public FeedFetchResult fetch(String url, String etag, String lastModified) {
        URI target = validate(parse(url));

        for (int hop = 0; hop <= MAX_REDIRECTS; hop++) {
            HttpResponse<InputStream> response = send(target, etag, lastModified);
            int status = response.statusCode();

            if (REDIRECT_CODES.contains(status)) {
                target = validate(redirectTarget(response, target));
                continue;
            }

            if (status == 304) {
                closeQuietly(response.body());
                return new FeedFetchResult(new byte[0], null, etag, lastModified, true);
            }

            if (status >= 400) {
                closeQuietly(response.body());
                throw new FeedFetchException("Serveri u përgjigj me kodin " + status);
            }

            byte[] content = readCapped(response.body());
            if (content.length == 0) {
                throw new FeedFetchException("Feed-i është bosh");
            }

            return new FeedFetchResult(
                    content,
                    header(response, "content-type").orElse("application/octet-stream"),
                    header(response, "etag").orElse(null),
                    header(response, "last-modified").orElse(null),
                    false);
        }

        throw new FeedFetchException("Feed-i ka shumë ridrejtime");
    }

    private HttpResponse<InputStream> send(URI target, String etag, String lastModified) {
        HttpRequest.Builder request = HttpRequest.newBuilder(target)
                .GET()
                .timeout(timeout)
                .header("User-Agent", USER_AGENT)
                .header("Accept", "text/csv, application/xml, text/xml, */*");

        // Skip re-downloading a feed the seller has not changed
        if (etag != null) {
            request.header("If-None-Match", etag);
        }
        if (lastModified != null) {
            request.header("If-Modified-Since", lastModified);
        }

        try {
            return client.send(request.build(), HttpResponse.BodyHandlers.ofInputStream());
        } catch (IOException unreachable) {
            throw new FeedFetchException("Adresa nuk u arrit: " + describe(unreachable), unreachable);
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
            throw new FeedFetchException("Shkarkimi u ndërpre", interrupted);
        }
    }

    private URI parse(String url) {
        try {
            return new URI(url.trim());
        } catch (URISyntaxException malformed) {
            throw new FeedFetchException("Adresa e feed-it nuk është e vlefshme");
        }
    }

    private URI redirectTarget(HttpResponse<InputStream> response, URI from) {
        closeQuietly(response.body());
        String location = header(response, "location")
                .orElseThrow(() -> new FeedFetchException("Ridrejtim pa adresë"));
        // Location may be relative to the URL we just requested
        return from.resolve(parse(location));
    }

    /** Rejects anything that is not a public http(s) endpoint. */
    public URI validate(URI target) {
        String scheme = target.getScheme() == null ? "" : target.getScheme().toLowerCase(Locale.ROOT);
        if (!ALLOWED_SCHEMES.contains(scheme)) {
            throw new FeedFetchException("Vetëm adresat http dhe https lejohen");
        }

        String host = target.getHost();
        if (host == null || host.isBlank()) {
            throw new FeedFetchException("Adresa e feed-it nuk është e vlefshme");
        }

        if (allowPrivateHosts) {
            return target;
        }

        InetAddress[] addresses;
        try {
            addresses = InetAddress.getAllByName(host);
        } catch (UnknownHostException unknown) {
            throw new FeedFetchException("Domeni nuk u zgjidh: " + host);
        }

        for (InetAddress address : addresses) {
            if (isPrivate(address)) {
                log.warn("Blocked feed URL pointing at a private address: {} -> {}", host, address);
                throw new FeedFetchException("Adresa e feed-it duhet të jetë publike");
            }
        }
        return target;
    }

    private boolean isPrivate(InetAddress address) {
        if (address.isLoopbackAddress()
                || address.isAnyLocalAddress()
                || address.isLinkLocalAddress()
                || address.isSiteLocalAddress()
                || address.isMulticastAddress()) {
            return true;
        }

        byte[] bytes = address.getAddress();
        // IPv6 unique local (fc00::/7), which isSiteLocalAddress does not cover
        if (bytes.length == 16 && (bytes[0] & 0xFE) == 0xFC) {
            return true;
        }
        // IPv4 shared address space (100.64.0.0/10) used by carrier-grade NAT
        return bytes.length == 4 && (bytes[0] & 0xFF) == 100 && (bytes[1] & 0xC0) == 64;
    }

    /** Reads at most maxBytes so a huge or endless response cannot exhaust memory. */
    private byte[] readCapped(InputStream body) {
        try (InputStream stream = body) {
            byte[] content = stream.readNBytes((int) Math.min(maxBytes + 1, Integer.MAX_VALUE));
            if (content.length > maxBytes) {
                throw new FeedFetchException(
                        "Feed-i është më i madh se " + (maxBytes / (1024 * 1024)) + " MB");
            }
            return content;
        } catch (IOException truncated) {
            throw new FeedFetchException("Shkarkimi dështoi: " + describe(truncated), truncated);
        }
    }

    /** Connection failures often carry no message, so fall back to the exception type. */
    private String describe(Throwable failure) {
        return failure.getMessage() == null
                ? failure.getClass().getSimpleName()
                : failure.getMessage();
    }

    private Optional<String> header(HttpResponse<?> response, String name) {
        return response.headers().firstValue(name).filter(value -> !value.isBlank());
    }

    private void closeQuietly(InputStream stream) {
        try {
            stream.close();
        } catch (IOException ignored) {
            // Nothing useful to do; the body is being discarded
        }
    }
}

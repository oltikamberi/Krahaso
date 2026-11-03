package com.krahaso.product;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Identity fingerprint of a retailer listing, extracted from the title when
 * the store does not publish a specs JSON.
 *
 * <p>Two listings of the same OEM chassis (e.g. Dell PV15250) still split when
 * RAM, storage, CPU or GPU disagree. Missing values never block; conflicting
 * values always do.
 */
public final class ProductIdentity {

    static final String RAM = "ram";
    static final String STORAGE = "storage";
    static final String CPU = "cpu";
    static final String GPU = "gpu";
    static final String SCREEN = "screen";
    static final String HZ = "hz";
    static final String MODEL = "model";
    static final String FAMILY = "family";

    private static final Set<String> IDENTITY_KEYS = Set.of(
            RAM, STORAGE, CPU, GPU, SCREEN, HZ, MODEL, FAMILY);

    private static final Set<String> BRANDS = Set.of(
            "apple", "samsung", "xiaomi", "huawei", "lenovo", "hp", "dell", "asus",
            "acer", "lg", "sony", "philips", "bosch", "beko", "hisense", "tcl",
            "oppo", "realme", "motorola", "nokia", "honor", "redmi", "poco", "msi",
            "gigabyte", "thomson", "sencor", "candy", "haier", "midea", "gorenje",
            "whirlpool", "aoc", "benq", "viewsonic", "trust", "huzaro", "havit",
            "hyperx", "logitech", "razer", "lamart", "rowenta", "krups");

    private static final Set<String> GENERIC_BRANDS = Set.of(
            "laptop", "laptopi", "notebook", "monitor", "televizor", "televizore",
            "telefon", "telefone", "tastiere", "tastiera", "karrige", "tavoline",
            "aparat", "thithese", "fshese", "rrobalarese");

    private static final Set<String> LINE_WORDS = Set.of(
            "vostro", "inspiron", "latitude", "xps", "precision", "alienware",
            "probook", "pavilion", "omen", "elitebook", "zbook", "envy", "omnibook",
            "ideapad", "thinkpad", "thinkbook", "legion", "yoga", "loq", "essential",
            "katana", "stealth", "raider", "sword", "modern", "prestige", "pulse",
            "nitro", "swift", "aspire", "predator", "travelmate",
            "vivobook", "zenbook", "expertbook", "tuf", "rog", "strix", "flow",
            "macbook", "galaxy", "redmi", "poco", "iphone", "ipad", "pixel",
            "ultrasharp", "odyssey", "slim", "idea");

    private static final Set<String> FAMILY_NOISE = Set.of(
            "laptop", "laptopi", "notebook", "ultrabook", "nb", "pc",
            "telefon", "telefone", "telefona", "smartphone", "celular", "mobile", "phone",
            "televizor", "televizore", "television", "tv", "monitor", "gaming",
            "smart", "uhd", "fhd", "qhd", "qled", "oled", "mini", "led", "nano",
            "cell", "ips", "va", "tn", "hdr", "srgb",
            "intel", "amd", "nvidia", "geforce", "graphics", "integrated", "iris",
            "core", "processor", "procesori", "cpu", "gpu", "ram", "ssd", "hdd",
            "nvme", "ddr4", "ddr5", "lpddr5", "lpddr5x", "lpddr4", "sdram",
            "windows", "w11", "win11", "win", "pro", "home", "noos", "dos",
            "fingerprint", "backlit", "backlight", "webcam", "wifi", "wlan",
            "bluetooth", "usb", "hdmi", "dp", "typec", "thunderbolt",
            "black", "white", "grey", "gray", "silver", "blue", "gold", "green",
            "zi", "zeze", "bardhe", "gri", "argjendt", "argjendte", "hirt",
            "carbon", "natural", "starlight", "midnight", "lavender",
            "with", "me", "per", "dhe", "nga", "the", "and", "for", "up", "to",
            "full", "hd", "fullhd", "inch", "inc", "cm", "kg", "w", "wh",
            "series", "serie", "model", "edition", "klasik", "new", "eu", "usa",
            "global", "dual", "sim", "ai", "copilot");

    private static final Set<String> GENERATION = Set.of(
            "g3", "g4", "g5", "g6", "g7", "g8", "g9", "g10", "g11",
            "gen2", "gen3", "gen4", "gen5");

    private static final Set<String> PHONE_SERIES = Set.of(
            "iphone", "ipad", "galaxy", "redmi", "poco", "pixel", "note");

    private static final Set<String> PHONE_VARIANTS = Set.of(
            "pro", "max", "plus", "mini", "air", "fe", "ultra", "note", "lite");

    private static final Set<String> LINE_VARIANTS = Set.of("slim", "2in1");

    private static final Set<String> VARIANTS;

    static {
        Set<String> variants = new HashSet<>();
        variants.addAll(PHONE_VARIANTS);
        variants.addAll(LINE_VARIANTS);
        VARIANTS = Set.copyOf(variants);
    }

    private static final Set<Integer> NOT_CHASSIS = Set.of(
            4, 6, 8, 12, 16, 24, 32, 64, 128, 256, 512, 1024, 2048,
            1080, 1440, 1600, 1920, 2160, 2560, 3200, 3840, 4096,
            60, 75, 90, 100, 120, 144, 165, 180, 200, 240, 280, 360, 500,
            14, 15, 17, 21, 23, 27, 34, 43, 49, 50, 55, 65, 70, 77, 85, 98,
            2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027);

    private static final Pattern SCREEN_PATTERN = Pattern.compile(
            "(\\d{1,2}(?:[.,]\\d)?)\\s*(?:\"|''|″|inch|inc)\\b");
    private static final Pattern HZ_PATTERN = Pattern.compile("(\\d{2,3})\\s*hz\\b");
    private static final Pattern SLASH_CAP = Pattern.compile(
            "\\b(\\d{1,2})\\s*(?:gb)?\\s*/\\s*(\\d{3,4})\\s*(gb|tb)?\\b");
    private static final Pattern LABELED_RAM = Pattern.compile(
            "\\b(\\d{1,2})\\s*(gb|tb)\\s*(?:ram|ddr\\d*|lpddr[\\dx]*)\\b");
    private static final Pattern LABELED_RAM_FLIP = Pattern.compile(
            "\\b(?:ram|ddr\\d*|lpddr[\\dx]*)\\s*(\\d{1,2})\\s*(gb|tb)\\b");
    private static final Pattern LABELED_STORAGE = Pattern.compile(
            "\\b(\\d{1,4})\\s*(gb|tb)\\s*(?:ssd|hdd|nvme|emmc|ufs)\\b");
    private static final Pattern STORAGE_FLIP = Pattern.compile(
            "\\b(?:ssd|hdd|nvme)\\s*(\\d{1,4})\\s*(gb|tb)\\b");
    private static final Pattern GPU_NVIDIA = Pattern.compile(
            "\\b(?:geforce\\s+)?(rtx|gtx)\\s*(\\d{3,4})\\s*(ti|super)?\\b");
    private static final Pattern GPU_AMD = Pattern.compile(
            "\\b(?:radeon\\s+)?rx\\s*(\\d{3,4})\\b");
    private static final Pattern GPU_RAD_MOBILE = Pattern.compile(
            "\\bradeon\\s+(\\d{3,4}m)\\b");
    private static final Pattern GPU_IRIS = Pattern.compile("\\biris\\s*x[e]?\\b");
    private static final Pattern GPU_UHD = Pattern.compile("\\buhd\\b");
    private static final Pattern GPU_VRAM = Pattern.compile(
            "\\b(?:rtx|gtx|rx)\\s*\\d{3,4}[a-z]*\\s*(?:ti|super)?\\s*(\\d{1,2})\\s*gb\\b");
    private static final Pattern CPU_ULTRA = Pattern.compile(
            "\\b(?:intel\\s+)?(?:core\\s+)?ultra\\s*([579])\\s*[- ]?(\\d{3}[a-z]?)\\b");
    private static final Pattern CPU_I = Pattern.compile(
            "\\b(?:intel\\s+)?(?:core\\s+)?i\\s*([3579])\\s*[- ]?(\\d{4,5}[a-z]{0,2})\\b");
    private static final Pattern CPU_CORE_N = Pattern.compile(
            "\\b(?:intel\\s+)?core\\s*([3-9])\\s*[- ](\\d{2,4}[a-z])\\b");
    private static final Pattern CPU_RYZEN_FULL = Pattern.compile(
            "\\bryzen\\s*([3579])\\s*(?:ai\\s*)?(\\d{4}[a-z]{0,2})\\b");
    private static final Pattern CPU_R_COMPACT = Pattern.compile(
            "\\br([3579])[- ]?(\\d{4}[a-z]{0,2})\\b");
    private static final Pattern CPU_RYZEN_FAM = Pattern.compile(
            "\\bryzen\\s*([3579])\\b");
    private static final Pattern CPU_APPLE_M = Pattern.compile(
            "\\bm([1-4])(?:\\s*(pro|max|air|ultra))?\\b");
    private static final Pattern CAP_TOKEN = Pattern.compile(
            "\\b(\\d{1,4})\\s*(gb|tb)\\b");
    private static final Pattern OEM_TOKEN = Pattern.compile(
            "\\b(?=[a-z]*\\d)(?=\\d*[a-z])[a-z0-9]{6,}\\b");

    private final Map<String, String> values;

    private ProductIdentity(Map<String, String> values) {
        this.values = Map.copyOf(values);
    }

    public static ProductIdentity of(String name, String brand, Map<String, Object> stored) {
        Map<String, String> merged = new HashMap<>(extract(name, brand).values);
        if (stored != null) {
            for (Map.Entry<String, String> entry : canonicalizeStored(stored).entrySet()) {
                merged.putIfAbsent(entry.getKey(), entry.getValue());
            }
        }
        return new ProductIdentity(merged);
    }

    public static String matchKey(String name, String brand) {
        ProductIdentity id = extract(name, brand);
        String brandTok = brandToken(name, brand);
        List<String> parts = new ArrayList<>();
        if (!brandTok.isBlank()) {
            parts.add(brandTok);
        }
        add(parts, id.values.get(MODEL));
        add(parts, id.values.get(CPU));
        add(parts, id.values.get(RAM));
        add(parts, id.values.get(STORAGE));
        add(parts, id.values.get(GPU));
        String family = id.values.get(FAMILY);
        if (family != null) {
            for (String token : family.split(" ")) {
                if (!parts.contains(token)) {
                    parts.add(token);
                }
            }
        }
        boolean phone = id.values.getOrDefault(FAMILY, "").contains("iphone")
                || id.values.getOrDefault(FAMILY, "").contains("ipad")
                || id.values.getOrDefault(FAMILY, "").contains("galaxy")
                || id.values.getOrDefault(FAMILY, "").contains("redmi")
                || id.values.getOrDefault(FAMILY, "").contains("poco")
                || id.values.getOrDefault(FAMILY, "").contains("pixel");
        boolean strong = id.values.containsKey(MODEL)
                || (id.values.containsKey(CPU)
                && (id.values.containsKey(RAM) || id.values.containsKey(STORAGE)))
                || (phone && id.values.containsKey(STORAGE));
        if (!strong) {
            parts.add(0, "weak");
        }
        return String.join(" ", parts).trim();
    }

    /** Human-readable specs map persisted on {@link Product}. */
    public static Map<String, Object> specsMap(String name, String brand) {
        ProductIdentity id = extract(name, brand);
        Map<String, Object> out = new HashMap<>();
        putHuman(out, "RAM", id.values.get(RAM));
        putHuman(out, "Disku", id.values.get(STORAGE));
        putHuman(out, "Procesori", id.values.get(CPU));
        putHuman(out, "Grafika", id.values.get(GPU));
        putHuman(out, "Ekrani", formatScreen(id.values.get(SCREEN)));
        putHuman(out, "Model", id.values.get(MODEL));
        putHuman(out, "Hz", id.values.get(HZ) == null ? null : id.values.get(HZ) + " Hz");
        return out;
    }

    boolean compatibleWith(ProductIdentity other) {
        if (other == null) {
            return true;
        }
        boolean sameOem = oemModelsAgree(values.get(MODEL), other.values.get(MODEL));
        for (String key : IDENTITY_KEYS) {
            if (sameOem && (FAMILY.equals(key) || SCREEN.equals(key) || HZ.equals(key))) {
                continue;
            }
            String left = values.get(key);
            String right = other.values.get(key);
            if (left == null || left.isBlank() || right == null || right.isBlank()) {
                continue;
            }
            if (!valuesAgree(key, left, right)) {
                return false;
            }
        }
        return true;
    }

    Map<String, String> values() {
        return values;
    }

    static boolean specsCompatible(Map<String, Object> a, Map<String, Object> b) {
        return of(null, null, a).compatibleWith(of(null, null, b));
    }

    // ── extraction ──────────────────────────────────────────────────────────

    static ProductIdentity extract(String name, String brand) {
        String text = fold((brand == null ? "" : brand + " ") + (name == null ? "" : name));
        Map<String, String> out = new HashMap<>();
        String working = text;

        Matcher screen = SCREEN_PATTERN.matcher(working);
        if (screen.find()) {
            out.put(SCREEN, normalizeScreen(screen.group(1)));
            working = screen.replaceFirst(" ");
        }

        Matcher hz = HZ_PATTERN.matcher(working);
        if (hz.find()) {
            out.put(HZ, hz.group(1));
            working = hz.replaceFirst(" ");
        }

        String gpu = firstGpu(working);
        if (gpu != null) {
            out.put(GPU, gpu);
        }
        working = GPU_VRAM.matcher(working).replaceAll(" ");

        String cpu = firstCpu(working);
        if (cpu != null) {
            out.put(CPU, cpu);
            working = stripCpu(working);
        }

        parseMemory(working, out);

        String model = firstOemModel(working, out.get(CPU));
        if (model != null) {
            out.put(MODEL, model);
        }

        String family = familyTokens(working, out);
        if (!family.isBlank()) {
            out.put(FAMILY, family);
        }

        return new ProductIdentity(out);
    }

    private static void parseMemory(String working, Map<String, String> out) {
        Matcher slash = SLASH_CAP.matcher(working);
        if (slash.find()) {
            int a = Integer.parseInt(slash.group(1));
            int b = Integer.parseInt(slash.group(2));
            String bUnit = slash.group(3) == null ? "gb" : slash.group(3);
            if (a <= 64 && toGb(b, bUnit) >= 64) {
                out.put(RAM, a + "gb");
                out.put(STORAGE, toGb(b, bUnit) + "gb");
                working = slash.replaceFirst(" ");
            }
        }

        Matcher ram = LABELED_RAM.matcher(working);
        if (!ram.find()) {
            ram = LABELED_RAM_FLIP.matcher(working);
        }
        if (ram.find() && !out.containsKey(RAM)) {
            out.put(RAM, toGb(Integer.parseInt(ram.group(1)), ram.group(2)) + "gb");
            working = ram.replaceFirst(" ");
        }

        Matcher storage = LABELED_STORAGE.matcher(working);
        if (!storage.find()) {
            storage = STORAGE_FLIP.matcher(working);
        }
        if (storage.find() && !out.containsKey(STORAGE)) {
            out.put(STORAGE, toGb(Integer.parseInt(storage.group(1)), storage.group(2)) + "gb");
            working = storage.replaceFirst(" ");
        }

        if (out.containsKey(RAM) && out.containsKey(STORAGE)) {
            return;
        }

        List<int[]> caps = new ArrayList<>();
        Matcher cap = CAP_TOKEN.matcher(working);
        while (cap.find()) {
            caps.add(new int[]{toGb(Integer.parseInt(cap.group(1)), cap.group(2))});
        }
        caps.sort((x, y) -> Integer.compare(x[0], y[0]));
        if (caps.size() >= 2) {
            if (!out.containsKey(RAM) && caps.getFirst()[0] <= 64) {
                out.put(RAM, caps.getFirst()[0] + "gb");
            }
            if (!out.containsKey(STORAGE) && caps.getLast()[0] >= 64) {
                out.put(STORAGE, caps.getLast()[0] + "gb");
            }
        } else if (caps.size() == 1) {
            int gb = caps.getFirst()[0];
            if (!out.containsKey(STORAGE) && gb >= 128) {
                out.put(STORAGE, gb + "gb");
            } else if (!out.containsKey(RAM) && gb <= 64) {
                out.put(RAM, gb + "gb");
            }
        }
    }

    private static String firstGpu(String text) {
        Matcher nvidia = GPU_NVIDIA.matcher(text);
        if (nvidia.find()) {
            StringBuilder g = new StringBuilder(nvidia.group(1)).append(nvidia.group(2));
            if (nvidia.group(3) != null) {
                g.append(nvidia.group(3));
            }
            return g.toString();
        }
        Matcher amd = GPU_AMD.matcher(text);
        if (amd.find()) {
            return "rx" + amd.group(1);
        }
        Matcher mobile = GPU_RAD_MOBILE.matcher(text);
        if (mobile.find()) {
            return "radeon" + mobile.group(1);
        }
        if (GPU_IRIS.matcher(text).find()) {
            return "irisxe";
        }
        if (GPU_UHD.matcher(text).find()) {
            return "uhd";
        }
        return null;
    }

    private static String firstCpu(String text) {
        Matcher ultra = CPU_ULTRA.matcher(text);
        if (ultra.find()) {
            return "ultra" + ultra.group(1) + ultra.group(2);
        }
        Matcher coreN = CPU_CORE_N.matcher(text);
        if (coreN.find()) {
            return "core" + coreN.group(1) + coreN.group(2);
        }
        Matcher i = CPU_I.matcher(text);
        if (i.find()) {
            return "i" + i.group(1) + i.group(2);
        }
        Matcher ryzen = CPU_RYZEN_FULL.matcher(text);
        if (ryzen.find()) {
            return "ryzen" + ryzen.group(1) + ryzen.group(2);
        }
        Matcher compact = CPU_R_COMPACT.matcher(text);
        if (compact.find() && !text.contains("ryzen")) {
            return "r" + compact.group(1) + compact.group(2);
        }
        Matcher fam = CPU_RYZEN_FAM.matcher(text);
        if (fam.find()) {
            return "ryzen" + fam.group(1);
        }
        Matcher apple = CPU_APPLE_M.matcher(text);
        if (apple.find()) {
            String m = "m" + apple.group(1);
            if (apple.group(2) != null) {
                m += apple.group(2);
            }
            return m;
        }
        return null;
    }

    private static String stripCpu(String text) {
        String stripped = CPU_ULTRA.matcher(text).replaceAll(" ");
        stripped = CPU_CORE_N.matcher(stripped).replaceAll(" ");
        stripped = CPU_I.matcher(stripped).replaceAll(" ");
        stripped = CPU_RYZEN_FULL.matcher(stripped).replaceAll(" ");
        stripped = CPU_RYZEN_FAM.matcher(stripped).replaceAll(" ");
        stripped = CPU_APPLE_M.matcher(stripped).replaceAll(" ");
        return stripped;
    }

    private static String firstOemModel(String text, String cpu) {
        String best = null;
        Matcher matcher = OEM_TOKEN.matcher(text.replace('-', ' '));
        while (matcher.find()) {
            String token = matcher.group();
            if (isCpuShaped(token) || token.equals(cpu)) {
                continue;
            }
            if (token.matches("\\d+gb") || token.matches("\\d+tb") || token.matches("\\d+hz")) {
                continue;
            }
            if (best == null || token.length() > best.length()) {
                best = token;
            }
        }
        return best;
    }

    private static String familyTokens(String text, Map<String, String> identity) {
        String cleaned = text
                .replaceAll("\\d+(?:[.,]\\d)?\\s*(?:gb|tb|hz|inch|inc|cm|kg|w)\\b", " ")
                .replaceAll("2\\s*-\\s*in\\s*-\\s*1", "2in1")
                .replaceAll("[^a-z0-9]+", " ");
        Set<String> tokens = new LinkedHashSet<>();
        String[] words = cleaned.split("\\s+");
        boolean phone = false;
        for (String raw : words) {
            if (PHONE_SERIES.contains(raw)) {
                phone = true;
                tokens.add(raw);
            }
        }
        for (String raw : words) {
            if (raw.isBlank()) {
                continue;
            }
            if (raw.equals(identity.get(MODEL)) || raw.equals(identity.get(CPU))
                    || raw.equals(identity.get(GPU)) || raw.equals(identity.get(RAM))
                    || raw.equals(identity.get(STORAGE))) {
                continue;
            }
            if (isCpuShaped(raw)) {
                continue;
            }
            if (phone && PHONE_VARIANTS.contains(raw)) {
                tokens.add(raw);
                continue;
            }
            if (LINE_VARIANTS.contains(raw)) {
                tokens.add(raw);
                continue;
            }
            if (LINE_WORDS.contains(raw) || GENERATION.contains(raw) || raw.matches("v\\d{2}")) {
                tokens.add(raw);
                continue;
            }
            if (phone && raw.matches("\\d{1,2}")) {
                tokens.add(raw);
                continue;
            }
            if (BRANDS.contains(raw) || FAMILY_NOISE.contains(raw) || raw.length() < 2) {
                continue;
            }
            if (raw.matches("\\d{3,4}")) {
                int n = Integer.parseInt(raw);
                if (!NOT_CHASSIS.contains(n)) {
                    tokens.add(raw);
                }
            }
        }
        List<String> sorted = new ArrayList<>(tokens);
        sorted.sort(String::compareTo);
        return String.join(" ", sorted);
    }

    private static String brandToken(String name, String brand) {
        String foldedName = fold(name == null ? "" : name);
        for (String token : foldedName.split("[^a-z0-9]+")) {
            if (BRANDS.contains(token)) {
                return token;
            }
        }
        String b = fold(brand == null ? "" : brand).split("[^a-z0-9]+")[0];
        if (b.isBlank() || GENERIC_BRANDS.contains(b) || FAMILY_NOISE.contains(b)) {
            return "";
        }
        return BRANDS.contains(b) ? b : b;
    }

    // ── agreement ───────────────────────────────────────────────────────────

    private static boolean valuesAgree(String key, String left, String right) {
        return switch (key) {
            case CPU -> cpuAgree(left, right);
            case FAMILY -> familyAgree(left, right);
            case MODEL -> modelAgree(left, right);
            case RAM, STORAGE -> Objects.equals(left, right);
            default -> left.equals(right);
        };
    }

    /**
     * Specific SKUs (i7-1355U vs i5-1334U, Ryzen 5 7520U vs Ryzen 3 7320U)
     * must match exactly. A family-only label ("ryzen5") never equals a
     * specific chip. Longer marketing strings may wrap the same SKU.
     */
    static boolean cpuAgree(String a, String b) {
        if (a.equals(b)) {
            return true;
        }
        String digitsA = cpuSku(a);
        String digitsB = cpuSku(b);
        if (!digitsA.isEmpty() && !digitsB.isEmpty()) {
            return digitsA.equals(digitsB);
        }
        if (!digitsA.isEmpty() || !digitsB.isEmpty()) {
            return false;
        }
        return a.equals(b);
    }

    private static String cpuSku(String cpu) {
        Matcher m = Pattern.compile("(\\d{3,5}[a-z]{0,2})").matcher(cpu);
        String best = "";
        while (m.find()) {
            if (m.group(1).length() > best.length()) {
                best = m.group(1);
            }
        }
        return best;
    }

    private static boolean familyAgree(String a, String b) {
        Set<String> left = allFamily(a);
        Set<String> right = allFamily(b);
        if (left.isEmpty() || right.isEmpty()) {
            return true;
        }
        Set<String> variantsL = new HashSet<>(left);
        variantsL.retainAll(VARIANTS);
        Set<String> variantsR = new HashSet<>(right);
        variantsR.retainAll(VARIANTS);
        if (!variantsL.equals(variantsR)) {
            return false;
        }
        Set<String> restL = distinctiveFamily(a);
        Set<String> restR = distinctiveFamily(b);
        if (restL.isEmpty() || restR.isEmpty()) {
            return true;
        }
        if (restL.equals(restR)) {
            return true;
        }
        return restL.containsAll(restR) || restR.containsAll(restL);
    }

    private static Set<String> allFamily(String family) {
        Set<String> out = new HashSet<>();
        for (String token : family.split("\\s+")) {
            if (!token.isBlank()) {
                out.add(token);
            }
        }
        return out;
    }

    private static Set<String> distinctiveFamily(String family) {
        Set<String> out = new HashSet<>();
        for (String token : family.split("\\s+")) {
            if (!token.isBlank() && !GENERATION.contains(token) && !VARIANTS.contains(token)) {
                out.add(token);
            }
        }
        return out;
    }

    private static boolean oemModelsAgree(String a, String b) {
        return isOemModel(a) && isOemModel(b) && modelAgree(a, b);
    }

    private static boolean modelAgree(String a, String b) {
        if (a.equals(b)) {
            return true;
        }
        // Same SKU with a trailing colour / region suffix, never 2523 vs 2524.
        if (a.length() >= 6 && b.length() >= 6 && (a.startsWith(b) || b.startsWith(a))) {
            String longer = a.length() > b.length() ? a : b;
            String shorter = a.length() > b.length() ? b : a;
            String extra = longer.substring(shorter.length());
            return extra.chars().noneMatch(Character::isDigit);
        }
        return false;
    }

    static boolean isCpuShaped(String token) {
        return token.matches("i[3579]\\d{3,5}[a-z]*")
                || token.matches("r[3579]\\d{3,5}[a-z]*")
                || token.startsWith("ryzen")
                || token.matches("ultra[579]\\d.*")
                || token.matches("core[3-9]\\d.*");
    }

    private static boolean isOemModel(String model) {
        return model != null && model.length() >= 6 && !isCpuShaped(model);
    }

    // ── stored specs ────────────────────────────────────────────────────────

    private static Map<String, String> canonicalizeStored(Map<String, Object> specs) {
        Map<String, String> out = new HashMap<>();
        for (Map.Entry<String, Object> entry : specs.entrySet()) {
            if (entry.getValue() == null) {
                continue;
            }
            String key = canonicalStoredKey(entry.getKey());
            String value = normalizeStoredValue(key, String.valueOf(entry.getValue()));
            if (key.isBlank() || value.isBlank()) {
                continue;
            }
            if (MODEL.equals(key) && isCpuShaped(value)) {
                out.putIfAbsent(CPU, value);
                continue;
            }
            out.put(key, value);
        }
        return out;
    }

    private static String canonicalStoredKey(String key) {
        String k = fold(key).replaceAll("[^a-z0-9]", "");
        return switch (k) {
            case "ram", "memorie" -> RAM;
            case "memorja", "memory", "storage", "disku", "disk", "ssd", "hdd" -> STORAGE;
            case "procesori", "processor", "cpu" -> CPU;
            case "grafika", "graphics", "gpu", "vga" -> GPU;
            case "ekrani", "screen", "display" -> SCREEN;
            case "kapaciteti", "capacity" -> STORAGE;
            case "rrotullime", "rpm" -> "rpm";
            case "rezolucioni", "resolution" -> "resolution";
            case "model", "modeli" -> MODEL;
            case "familja", "family", "seria", "series" -> FAMILY;
            case "hz", "refresh", "refreshrate" -> HZ;
            default -> k;
        };
    }

    private static String normalizeStoredValue(String key, String value) {
        String folded = fold(value);
        return switch (key) {
            case RAM, STORAGE -> {
                Matcher m = Pattern.compile("(\\d+)\\s*(gb|tb)").matcher(folded);
                if (m.find()) {
                    yield toGb(Integer.parseInt(m.group(1)), m.group(2)) + "gb";
                }
                yield folded.replaceAll("[^a-z0-9]", "");
            }
            case SCREEN -> {
                Matcher m = Pattern.compile("(\\d{1,2}(?:[.,]\\d)?)").matcher(folded);
                yield m.find() ? normalizeScreen(m.group(1)) : folded.replaceAll("[^0-9]", "");
            }
            case HZ -> folded.replaceAll("[^0-9]", "");
            case CPU, GPU, MODEL, FAMILY -> folded.replaceAll("[^a-z0-9]+", "");
            default -> folded.replaceAll("[^a-z0-9]", "");
        };
    }

    // ── helpers ─────────────────────────────────────────────────────────────

    static String fold(String input) {
        if (input == null) {
            return "";
        }
        String n = Normalizer.normalize(input, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .replace("™", " ")
                .replace("®", " ")
                .replace("©", " ");
        return n.toLowerCase(Locale.ROOT);
    }

    private static int toGb(int amount, String unit) {
        if ("tb".equalsIgnoreCase(unit)) {
            return amount * 1024;
        }
        return amount;
    }

    private static String normalizeScreen(String raw) {
        return raw.replace(',', '.').replaceAll("\\.0$", "");
    }

    private static String formatScreen(String screen) {
        return screen == null ? null : screen + "\"";
    }

    private static void add(List<String> parts, String value) {
        if (value != null && !value.isBlank() && !parts.contains(value)) {
            parts.add(value);
        }
    }

    private static void putHuman(Map<String, Object> out, String key, String value) {
        if (value == null || value.isBlank()) {
            return;
        }
        if ("RAM".equals(key) || "Disku".equals(key)) {
            out.put(key, value.replace("gb", " GB").replace("1024 GB", "1 TB"));
            return;
        }
        out.put(key, value.toUpperCase(Locale.ROOT));
    }
}

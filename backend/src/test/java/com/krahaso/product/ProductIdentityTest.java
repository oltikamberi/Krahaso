package com.krahaso.product;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class ProductIdentityTest {

    private static boolean match(String nameA, String nameB) {
        return ProductIdentity.of(nameA, null, null)
                .compatibleWith(ProductIdentity.of(nameB, null, null));
    }

    private static Map<String, String> specs(String name) {
        return ProductIdentity.of(name, null, null).values();
    }

    @Nested
    @DisplayName("laptops — same chassis, different configuration")
    class Laptops {

        @Test
        @DisplayName("Dell PV15250 i7 16/512 matches the same config at another store")
        void sameDellConfigMatches() {
            assertThat(match(
                    "Laptop Dell Pro 15 Essential PV15250, 15.6\", Intel Core i7-1355U, 16GB RAM, 512GB SSD, Intel UHD Graphics, i zi",
                    "LAPTOP DELL PRO 15 PV15250 CORE i7-1355U 16GB/512GB SSD"
            )).isTrue();
        }

        @Test
        @DisplayName("same Dell chassis with i7 vs i5 does not match")
        void dellCpuMustAgree() {
            assertThat(match(
                    "Laptop Dell Pro 15 Essential PV15250, 15.6\", Intel Core i7-1355U, 16GB RAM, 512GB SSD",
                    "Laptop Dell Pro 15 Essential PV15250 15.6\" FHD 120Hz i5-1334U 16GB 512GB SSD FP"
            )).isFalse();
        }

        @Test
        @DisplayName("same Dell chassis with 16GB vs 8GB RAM does not match")
        void dellRamMustAgree() {
            assertThat(match(
                    "Laptop Dell Pro 15 Essential PV15250, 15.6\", Intel Core i7-1355U, 16GB RAM, 512GB SSD",
                    "Laptop Dell Pro 15 Essential PV15250, 15.6\", Intel Core i7-1355U, 8GB RAM, 512GB SSD"
            )).isFalse();
        }

        @Test
        @DisplayName("HP 250 G10 is not an HP ProBook 450 G10 even with the same CPU/RAM")
        void hpChassisMustAgree() {
            assertThat(match(
                    "LAPTOP HP 250 G10 CORE i5-1334U 16GB/512GB SSD",
                    "Laptop HP ProBook 450 G10, 15.6\", Intel Core i5-1334U, 16GB RAM, 512GB SSD, intel Iris X Graphics, i argjendtë"
            )).isFalse();
        }

        @Test
        @DisplayName("IdeaPad 15AMN8 Ryzen 5 is not Ryzen 3")
        void ryzenSkuMustAgree() {
            assertThat(match(
                    "LAPTOP LENOVO IDEAPAD SLIM 3 15AMN8 AMD RYZEN 5 7520U 8GB/512GB SSD",
                    "Laptop Lenovo IdeaPad Slim 3 15AMN8, 15.6\", AMD Ryzen 3 7320U, 8GB RAM, 512GB SSD"
            )).isFalse();
        }

        @Test
        @DisplayName("truncated Ryzen 3 title still does not match Ryzen 5 7520U")
        void truncatedRyzenDoesNotMatchSpecificSku() {
            assertThat(match(
                    "LAPTOP LENOVO IDEAPAD SLIM 3 15AMN8 AMD RYZEN 5 7520U 8GB/512GB SSD",
                    "Laptop Lenovo IdeaPad Slim 3 15AMN8, 15.6\", AMD Ryzen 3 30, 8GB RAM, 512GB SSD"
            )).isFalse();
        }

        @Test
        @DisplayName("RTX 4050 vs RTX 3050 does not match")
        void gpuMustAgree() {
            assertThat(match(
                    "LAPTOP MSI i5-13420H 15.6\" 16GB RAM 512GB SSD GeForce RTX 4050 6GB",
                    "LAPTOP MSI i5-13420H 15.6\" 16GB RAM 512GB SSD GeForce RTX 3050 6GB"
            )).isFalse();
        }

        @Test
        @DisplayName("GPU VRAM is not treated as system RAM")
        void gpuVramIsNotRam() {
            Map<String, String> specs = specs(
                    "LAPTOP MSI i5-13420H 15.6\" FHD 144HZ | 16GB RAM 512GB SSD GeForce RTX 4050 6GB");
            assertThat(specs.get("ram")).isEqualTo("16gb");
            assertThat(specs.get("storage")).isEqualTo("512gb");
            assertThat(specs.get("gpu")).isEqualTo("rtx4050");
        }

        @Test
        @DisplayName("Core 3-100U is extracted so it cannot collide with a blank CPU")
        void core3IsExtracted() {
            Map<String, String> specs = specs(
                    "Laptop Dell Pro 15 Essential PV15250, 15.6\", Intel Core 3-100U, 8GB RAM, 512GB SSD");
            assertThat(specs.get("cpu")).isEqualTo("core3100u");
            assertThat(specs.get("ram")).isEqualTo("8gb");
        }
    }

    @Nested
    @DisplayName("phones")
    class Phones {

        @Test
        @DisplayName("same Redmi 17 4/128 matches")
        void samePhoneMatches() {
            assertThat(match(
                    "Telefon Xiaomi REDMI 17 Oak Green 4/128GB",
                    "Xiaomi Redmi 17 4GB/128GB"
            )).isTrue();
        }

        @Test
        @DisplayName("4/128 vs 6/128 does not match")
        void phoneRamMustAgree() {
            assertThat(match(
                    "Telefon Xiaomi REDMI 17 Oak Green 4/128GB",
                    "Telefon Xiaomi REDMI 17 Black 6/128GB"
            )).isFalse();
        }

        @Test
        @DisplayName("8/256 vs 8/512 does not match")
        void phoneStorageMustAgree() {
            assertThat(match(
                    "Telefon Xiaomi REDMI Note 17 Pro 5G Black 8/256GB",
                    "Telefon Xiaomi REDMI Note 17 Pro 5G Black 8/512GB"
            )).isFalse();
        }

        @Test
        @DisplayName("Note 17 is not Note 17 Pro")
        void phoneVariantMustAgree() {
            assertThat(match(
                    "Telefon Xiaomi REDMI Note 17 Black 6/256GB",
                    "Telefon Xiaomi REDMI Note 17 Pro 5G Black 6/256GB"
            )).isFalse();
        }

        @Test
        @DisplayName("iPhone 15 128GB is not iPhone 15 256GB")
        void iphoneStorageMustAgree() {
            assertThat(match(
                    "Apple iPhone 15 - blue - 5G smartphone - 128GB - GSM",
                    "Apple iPhone 15 256GB Blue"
            )).isFalse();
        }
    }

    @Nested
    @DisplayName("monitors / TVs")
    class Displays {

        @Test
        @DisplayName("AW2524HF matches across stores")
        void sameMonitorMatches() {
            assertThat(match(
                    "Monitor Dell Alienware AW2524HF, 24.5\", FullHD, i zi",
                    "MONITOR LED DELL AW2524HF"
            )).isTrue();
        }

        @Test
        @DisplayName("AW2524HF is not AW2523HF")
        void monitorModelMustAgree() {
            assertThat(match(
                    "Monitor Dell Alienware AW2524HF, 24.5\", FullHD, i zi",
                    "MONITOR DELL ALIENWARE AW2523HF 24.5\" Full HD"
            )).isFalse();
        }
    }

    @Test
    @DisplayName("CPU family-only never equals a specific SKU")
    void genericCpuDoesNotEqualSpecific() {
        assertThat(ProductIdentity.cpuAgree("ryzen5", "ryzen57520u")).isFalse();
        assertThat(ProductIdentity.cpuAgree("i71355u", "intelcorei71355u")).isTrue();
        assertThat(ProductIdentity.cpuAgree("i71355u", "i51334u")).isFalse();
    }

    @Test
    @DisplayName("match_key includes CPU so i5 and i7 Dell SKUs never share a bucket")
    void matchKeyIncludesCpu() {
        String i7 = ProductIdentity.matchKey(
                "Laptop Dell Pro 15 Essential PV15250 Intel Core i7-1355U 16GB RAM 512GB SSD", "Dell");
        String i5 = ProductIdentity.matchKey(
                "Laptop Dell Pro 15 Essential PV15250 Intel Core i5-1334U 16GB RAM 512GB SSD", "Dell");
        assertThat(i7).contains("i71355u");
        assertThat(i5).contains("i51334u");
        assertThat(i7).isNotEqualTo(i5);
    }
}

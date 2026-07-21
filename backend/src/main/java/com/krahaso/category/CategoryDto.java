package com.krahaso.category;

import java.io.Serializable;

public record CategoryDto(Long id, String slug, String name, String icon) implements Serializable {

    static CategoryDto from(Category category) {
        return new CategoryDto(category.getId(), category.getSlug(), category.getName(), category.getIcon());
    }
}

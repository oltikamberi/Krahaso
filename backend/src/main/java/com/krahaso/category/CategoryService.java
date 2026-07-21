package com.krahaso.category;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Cacheable("categories")
    public List<CategoryDto> findAll() {
        return categoryRepository.findAll(Sort.by("name")).stream()
                .map(CategoryDto::from)
                .toList();
    }
}

package com.krahaso;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class KrahasoApplication {

	public static void main(String[] args) {
		SpringApplication.run(KrahasoApplication.class, args);
	}

}

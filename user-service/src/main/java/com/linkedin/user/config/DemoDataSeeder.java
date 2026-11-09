package com.linkedin.user.config;

import com.linkedin.user.model.User;
import com.linkedin.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DemoDataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Value("${app.seed-demo-users:false}")
    private boolean seedDemoUsers;

    public DemoDataSeeder(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public void run(String... args) {
        if (!seedDemoUsers) {
            return;
        }

        if (!userRepository.existsByEmailIgnoreCase("alice@nodework.com")) {
            User alice = new User();
            alice.setEmail("alice@nodework.com");
            alice.setName("Alice Chen");
            alice.setPasswordHash(passwordEncoder.encode("Demo@1234!"));
            alice.setTitle("Staff Distributed Systems Architect");
            alice.setHeadline("Staff Distributed Systems Architect at CloudScale | Microservices & Distributed Systems");
            alice.setCompany("CloudScale Systems");
            alice.setLocation("San Francisco, CA");
            alice.setAbout("Passionate distributed systems engineer building resilient, high-throughput architectures.");
            alice.setAvatarUrl("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80");
            alice.setCoverUrl("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80");
            alice.setSkills(List.of("Java", "Spring Boot", "Kubernetes", "Kafka", "PostgreSQL", "System Architecture"));
            userRepository.save(alice);
        }

        if (!userRepository.existsByEmailIgnoreCase("bob@nodework.com")) {
            User bob = new User();
            bob.setEmail("bob@nodework.com");
            bob.setName("Bob Smith");
            bob.setPasswordHash(passwordEncoder.encode("Demo@1234!"));
            bob.setTitle("Principal Frontend Engineer");
            bob.setHeadline("Principal Frontend Engineer | React, TypeScript & Design Systems");
            bob.setCompany("DesignOps");
            bob.setLocation("Seattle, WA");
            bob.setAbout("Obsessed with pixel perfection, performance budgets, and ergonomic component libraries.");
            bob.setAvatarUrl("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80");
            bob.setCoverUrl("https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&auto=format&fit=crop&q=80");
            bob.setSkills(List.of("React", "TypeScript", "Vite", "TailwindCSS", "Design Systems", "Web Performance"));
            userRepository.save(bob);
        }
    }
}

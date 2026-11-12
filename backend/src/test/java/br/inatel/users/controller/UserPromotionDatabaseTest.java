package br.inatel.users.controller;

import br.inatel.users.model.Role;
import br.inatel.users.model.User;
import br.inatel.users.repository.UserRepository;
import br.inatel.users.service.TokenService;
import br.inatel.users.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:sqlite::memory:",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.datasource.hikari.maximum-pool-size=1",
        "app.auth.initial-admin.enabled=false"
})
@AutoConfigureMockMvc
class UserPromotionDatabaseTest {
    @Autowired MockMvc mvc;
    @Autowired UserService users;
    @Autowired UserRepository repository;
    @Autowired TokenService tokens;

    private User participant;
    private String adminToken;

    @BeforeEach
    void setUp() {
        repository.deleteAll();
        var admin = users.create("Admin", "admin@inatel.br", "Senha123", Role.ADMIN);
        participant = users.create("Participant", "participant@inatel.br", "Senha123", Role.PARTICIPANT);
        adminToken = tokens.issue(admin);
    }

    @Test
    void adminPromotesParticipantAndNewLoginReflectsPersistedRole() throws Exception {
        String previousToken = tokens.issue(participant);

        mvc.perform(patch("/api/users/{id}/promote", participant.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(participant.getId()))
                .andExpect(jsonPath("$.name").value("Participant"))
                .andExpect(jsonPath("$.email").value("participant@inatel.br"))
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andExpect(jsonPath("$.password").doesNotExist());

        assertThat(repository.findById(participant.getId()).orElseThrow().getRole()).isEqualTo(Role.ADMIN);
        assertThat(tokens.resolve(previousToken).orElseThrow().role()).isEqualTo(Role.PARTICIPANT);
        var login = users.authenticate(participant.getEmail(), "Senha123");
        assertThat(login.role()).isEqualTo(Role.ADMIN);
        assertThat(tokens.resolve(login.token()).orElseThrow().role()).isEqualTo(Role.ADMIN);
    }

    @Test
    void participantCannotPromoteSelf() throws Exception {
        mvc.perform(patch("/api/users/{id}/promote", participant.getId())
                        .header("Authorization", "Bearer " + tokens.issue(participant)))
                .andExpect(status().isForbidden());

        assertThat(repository.findById(participant.getId()).orElseThrow().getRole()).isEqualTo(Role.PARTICIPANT);
    }

    @Test
    void participantCannotPromoteAnotherUser() throws Exception {
        var other = users.create("Other", "other@inatel.br", "Senha123", Role.PARTICIPANT);
        mvc.perform(patch("/api/users/{id}/promote", other.getId())
                        .header("Authorization", "Bearer " + tokens.issue(participant)))
                .andExpect(status().isForbidden());

        assertThat(repository.findById(other.getId()).orElseThrow().getRole()).isEqualTo(Role.PARTICIPANT);
    }

    @Test
    void rejectsMissingAndInvalidTokens() throws Exception {
        mvc.perform(patch("/api/users/{id}/promote", participant.getId()))
                .andExpect(status().isUnauthorized());
        mvc.perform(patch("/api/users/{id}/promote", participant.getId())
                        .header("Authorization", "Bearer invalid"))
                .andExpect(status().isUnauthorized());
        assertThat(repository.findById(participant.getId()).orElseThrow().getRole()).isEqualTo(Role.PARTICIPANT);
    }

    @Test
    void returnsNotFoundForUnknownUser() throws Exception {
        mvc.perform(patch("/api/users/{id}/promote", Long.MAX_VALUE)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("User not found"));
    }

    @Test
    void promotingExistingAdminIsIdempotent() throws Exception {
        var admin = repository.findByEmail("admin@inatel.br").orElseThrow();
        long before = repository.count();
        mvc.perform(patch("/api/users/{id}/promote", admin.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ADMIN"));
        assertThat(repository.count()).isEqualTo(before);
        assertThat(repository.findById(admin.getId()).orElseThrow().getPassword()).isEqualTo(admin.getPassword());
    }
}

package br.inatel.users.controller;

import br.inatel.users.model.Role;
import br.inatel.users.repository.UserRepository;
import br.inatel.users.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Path;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
        "spring.datasource.driver-class-name=org.sqlite.JDBC",
        "spring.jpa.database-platform=org.hibernate.community.dialect.SQLiteDialect",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.datasource.hikari.maximum-pool-size=1"
})
@AutoConfigureMockMvc
@Transactional
class AuthDatabaseTest {
    private static final Path DATABASE_FILE = Path.of(System.getProperty("java.io.tmpdir"),
            "gestao-lab-auth-" + UUID.randomUUID() + ".db");

    @DynamicPropertySource
    static void configureDatabase(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> "jdbc:sqlite:" + DATABASE_FILE);
    }

    @Autowired MockMvc mvc;
    @Autowired UserService users;
    @Autowired UserRepository repository;
    @Autowired EntityManager entityManager;
    @Autowired ObjectMapper mapper;

    @ParameterizedTest
    @EnumSource(Role.class)
    void loginReadsPersistedCredentialsAndAuthenticatesRequest(Role role) throws Exception {
        var user = users.create("RF01", "rf01@inatel.br", "Senha123", role);
        entityManager.flush();
        entityManager.clear();
        assertThat(repository.findByEmail(user.getEmail()).orElseThrow().getPassword())
                .startsWith("$2a$").isNotEqualTo("Senha123");
        entityManager.clear();
        var result = mvc.perform(post("/api/auth/login").contentType("application/json")
                        .content("{\"email\":\"rf01@inatel.br\",\"password\":\"Senha123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(user.getId()))
                .andExpect(jsonPath("$.role").value(role.name()))
                .andExpect(jsonPath("$.password").doesNotExist()).andReturn();
        String token = mapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
        // There are no domain HTTP endpoints yet; an unknown route is 404 only after authentication.
        mvc.perform(get("/api/private-proof")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/private-proof").header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    @Test
    void publicRegistrationCreatesParticipantAndAllowsLogin() throws Exception {
        var result = mvc.perform(post("/api/auth/register").contentType("application/json")
                        .content("{\"name\":\"Novo\",\"email\":\"novo@inatel.br\",\"password\":\"Senha123\",\"role\":\"ADMIN\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.userId").isNumber())
                .andExpect(jsonPath("$.name").value("Novo"))
                .andExpect(jsonPath("$.email").value("novo@inatel.br"))
                .andExpect(jsonPath("$.role").value("PARTICIPANT"))
                .andExpect(jsonPath("$.password").doesNotExist()).andReturn();
        entityManager.flush();
        entityManager.clear();
        var saved = repository.findByEmail("novo@inatel.br").orElseThrow();
        assertThat(saved.getPassword()).startsWith("$2a$").isNotEqualTo("Senha123");
        mvc.perform(post("/api/auth/login").contentType("application/json")
                        .content("{\"email\":\"novo@inatel.br\",\"password\":\"Senha123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.userId").value(mapper.readTree(result.getResponse().getContentAsString()).get("userId").asLong()));
    }

    @Test
    void rejectsDuplicateRegistration() throws Exception {
        users.create("RF01", "rf01@inatel.br", "Senha123", Role.PARTICIPANT);
        mvc.perform(post("/api/auth/register").contentType("application/json")
                        .content("{\"name\":\"Outro\",\"email\":\"rf01@inatel.br\",\"password\":\"Senha123\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Email already registered"));
    }

    @ParameterizedTest
    @org.junit.jupiter.params.provider.ValueSource(strings = {
            "{}", "{", "null",
            "{\"name\":\" \" ,\"email\":\"novo@inatel.br\",\"password\":\"Senha123\"}",
            "{\"name\":\"Novo\",\"email\":\"invalido\",\"password\":\"Senha123\"}",
            "{\"name\":\"Novo\",\"email\":\"novo@inatel.br\",\"password\":\"fraca\"}"
    })
    void rejectsInvalidRegistration(String body) throws Exception {
        long before = repository.count();
        mvc.perform(post("/api/auth/register").contentType("application/json").content(body))
                .andExpect(status().isBadRequest());
        assertThat(repository.count()).isEqualTo(before);
    }

    @Test
    void rejectsWrongPasswordAndUnknownUserAgainstDatabase() throws Exception {
        users.create("RF01", "rf01@inatel.br", "Senha123", Role.PARTICIPANT);
        entityManager.flush();
        entityManager.clear();
        for (String email : new String[]{"rf01@inatel.br", "missing@inatel.br"}) {
            mvc.perform(post("/api/auth/login").contentType("application/json")
                            .content("{\"email\":\"" + email + "\",\"password\":\"wrong\"}"))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.message").value("Invalid email or password"));
        }
    }
}

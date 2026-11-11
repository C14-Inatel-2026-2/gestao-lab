package br.inatel.users.controller;

import br.inatel.users.model.Role;
import br.inatel.users.repository.UserRepository;
import br.inatel.users.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

// Use only a disposable database: Hibernate creates and drops the schema for this test.
@EnabledIfEnvironmentVariable(named = "RF01_TEST_DATABASE_URL", matches = "jdbc:postgresql:.*")
@SpringBootTest(properties = {
        "spring.datasource.url=${RF01_TEST_DATABASE_URL}",
        "spring.datasource.username=${RF01_TEST_DATABASE_USER}",
        "spring.datasource.password=${RF01_TEST_DATABASE_PASSWORD}",
        "spring.datasource.driver-class-name=org.postgresql.Driver",
        "spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
@AutoConfigureMockMvc
@Transactional
class AuthDatabaseTest {
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

package br.inatel.labs.controller;

import br.inatel.labs.model.Laboratory;
import br.inatel.labs.repository.LaboratoryRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:sqlite::memory:",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.datasource.hikari.maximum-pool-size=1",
        "app.auth.initial-admin.enabled=false"
})
@AutoConfigureMockMvc
@Transactional
class LaboratoryHttpTest {
    @Autowired MockMvc mvc;
    @Autowired LaboratoryRepository repository;
    @Autowired EntityManager entityManager;

    @Test
    @WithMockUser(roles = "PARTICIPANT")
    void shouldListPersistedLaboratories() throws Exception {
        repository.save(new Laboratory("Lab Software"));
        repository.saveAndFlush(new Laboratory("Lab Redes"));
        entityManager.clear();

        mvc.perform(get("/api/labs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[*].name", containsInAnyOrder("Lab Software", "Lab Redes")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void shouldFindPersistedLaboratoryById() throws Exception {
        Laboratory laboratory = repository.saveAndFlush(new Laboratory("Lab Software"));
        entityManager.clear();

        mvc.perform(get("/api/labs/{id}", laboratory.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(laboratory.getId()))
                .andExpect(jsonPath("$.name").value("Lab Software"));
    }

    @Test
    @WithMockUser(roles = "PARTICIPANT")
    void shouldReturnEmptyListWhenNoLaboratoriesExist() throws Exception {
        mvc.perform(get("/api/labs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    @WithMockUser(roles = "PARTICIPANT")
    void shouldReturnNotFoundForUnknownLaboratory() throws Exception {
        mvc.perform(get("/api/labs/{id}", -1L))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Laboratory not found"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"/api/labs", "/api/labs/1"})
    void shouldRequireAuthentication(String path) throws Exception {
        mvc.perform(get(path)).andExpect(status().isUnauthorized());
    }
}

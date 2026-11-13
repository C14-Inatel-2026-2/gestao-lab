package br.inatel.labs.controller;

import br.inatel.devices.model.Device;
import br.inatel.labs.dto.LaboratoryRequest;
import br.inatel.labs.model.Laboratory;
import br.inatel.labs.repository.LaboratoryRepository;
import br.inatel.loans.model.Loan;
import br.inatel.users.model.Role;
import br.inatel.users.model.User;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
    @Autowired ObjectMapper objectMapper;

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

    @Test
    @WithMockUser(roles = "ADMIN")
    void shouldCreateAndRetrieveLaboratory() throws Exception {
        var result = mvc.perform(post("/api/labs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Lab Software\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").value("Lab Software"))
                .andReturn();

        long id = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
        entityManager.flush();
        entityManager.clear();

        mvc.perform(get("/api/labs/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.name").value("Lab Software"));
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "{}", "{\"name\":null}", "{\"name\":\"\"}", "{\"name\":\"   \"}", "{\"name\":", "null", ""
    })
    @WithMockUser(roles = "ADMIN")
    void shouldRejectInvalidCreateRequests(String body) throws Exception {
        mvc.perform(post("/api/labs").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isNotEmpty());

        assertThat(repository.count()).isZero();
    }

    @Test
    @WithMockUser(roles = "PARTICIPANT")
    void shouldForbidParticipantFromCreatingLaboratory() throws Exception {
        mvc.perform(post("/api/labs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Lab Software\"}"))
                .andExpect(status().isForbidden());

        assertThat(repository.count()).isZero();
    }

    @Test
    void shouldRequireAuthenticationToCreateLaboratory() throws Exception {
        mvc.perform(post("/api/labs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Lab Software\"}"))
                .andExpect(status().isUnauthorized());

        assertThat(repository.count()).isZero();
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void shouldUpdateAndPersistLaboratoryName() throws Exception {
        Laboratory laboratory = repository.saveAndFlush(new Laboratory("Nome original"));

        mvc.perform(put("/api/labs/{id}", laboratory.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Nome atualizado\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(laboratory.getId()))
                .andExpect(jsonPath("$.name").value("Nome atualizado"));

        entityManager.flush();
        entityManager.clear();
        assertThat(repository.findById(laboratory.getId()).orElseThrow().getName())
                .isEqualTo("Nome atualizado");
        assertThat(repository.count()).isEqualTo(1);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = "   ")
    @WithMockUser(roles = "ADMIN")
    void shouldPreserveLaboratoryWhenUpdatedNameIsInvalid(String name) throws Exception {
        Laboratory laboratory = repository.saveAndFlush(new Laboratory("Nome original"));

        mvc.perform(put("/api/labs/{id}", laboratory.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LaboratoryRequest(name))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Laboratory name is required"));

        entityManager.clear();
        assertThat(repository.findById(laboratory.getId()).orElseThrow().getName())
                .isEqualTo("Nome original");
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void shouldReturnNotFoundWhenUpdatingUnknownLaboratory() throws Exception {
        mvc.perform(put("/api/labs/{id}", -1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Nome atualizado\"}"))
                .andExpect(status().isNotFound());

        assertThat(repository.count()).isZero();
    }

    @Test
    @WithMockUser(roles = "PARTICIPANT")
    void shouldForbidParticipantFromUpdatingLaboratory() throws Exception {
        Laboratory laboratory = repository.saveAndFlush(new Laboratory("Nome original"));

        mvc.perform(put("/api/labs/{id}", laboratory.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Nome atualizado\"}"))
                .andExpect(status().isForbidden());

        entityManager.clear();
        assertThat(repository.findById(laboratory.getId()).orElseThrow().getName())
                .isEqualTo("Nome original");
    }

    @Test
    void shouldRequireAuthenticationToUpdateLaboratory() throws Exception {
        Laboratory laboratory = repository.saveAndFlush(new Laboratory("Nome original"));

        mvc.perform(put("/api/labs/{id}", laboratory.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Nome atualizado\"}"))
                .andExpect(status().isUnauthorized());

        entityManager.clear();
        assertThat(repository.findById(laboratory.getId()).orElseThrow().getName())
                .isEqualTo("Nome original");
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void shouldDeleteOnlyLaboratoryWithoutLinks() throws Exception {
        Laboratory available = repository.saveAndFlush(new Laboratory("Lab livre"));
        Laboratory inUse = repository.saveAndFlush(new Laboratory("Lab em uso"));
        entityManager.persist(new Device("Multimetro", null, inUse));
        persistLoan(inUse);
        entityManager.flush();
        entityManager.clear();

        mvc.perform(delete("/api/labs/{id}", available.getId()))
                .andExpect(status().isNoContent());

        entityManager.flush();
        entityManager.clear();
        assertThat(repository.existsById(available.getId())).isFalse();
        assertThat(repository.existsById(inUse.getId())).isTrue();
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void shouldRejectDeletionWhenLaboratoryHasDevices() throws Exception {
        Laboratory laboratory = repository.saveAndFlush(new Laboratory("Lab dispositivos"));
        Device device = new Device("Multimetro", null, laboratory);
        entityManager.persist(device);
        entityManager.flush();
        entityManager.clear();

        mvc.perform(delete("/api/labs/{id}", laboratory.getId()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Laboratory has linked devices or loans"));

        entityManager.clear();
        assertThat(repository.existsById(laboratory.getId())).isTrue();
        assertThat(entityManager.find(Device.class, device.getId())).isNotNull();
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void shouldRejectDeletionWhenLaboratoryHasLoans() throws Exception {
        Laboratory laboratory = repository.saveAndFlush(new Laboratory("Lab emprestimos"));
        Loan loan = persistLoan(laboratory);
        entityManager.flush();
        entityManager.clear();

        mvc.perform(delete("/api/labs/{id}", laboratory.getId()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Laboratory has linked devices or loans"));

        entityManager.clear();
        assertThat(repository.existsById(laboratory.getId())).isTrue();
        assertThat(entityManager.find(Loan.class, loan.getId())).isNotNull();
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void shouldReturnNotFoundWhenDeletingUnknownLaboratory() throws Exception {
        mvc.perform(delete("/api/labs/{id}", -1L))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = "PARTICIPANT")
    void shouldForbidParticipantFromDeletingLaboratory() throws Exception {
        Laboratory laboratory = repository.saveAndFlush(new Laboratory("Lab Software"));

        mvc.perform(delete("/api/labs/{id}", laboratory.getId()))
                .andExpect(status().isForbidden());

        assertThat(repository.existsById(laboratory.getId())).isTrue();
    }

    @Test
    void shouldRequireAuthenticationToDeleteLaboratory() throws Exception {
        Laboratory laboratory = repository.saveAndFlush(new Laboratory("Lab Software"));

        mvc.perform(delete("/api/labs/{id}", laboratory.getId()))
                .andExpect(status().isUnauthorized());

        assertThat(repository.existsById(laboratory.getId())).isTrue();
    }

    private Loan persistLoan(Laboratory laboratory) {
        User user = new User("Participante", "loan@example.test", "unused", Role.PARTICIPANT);
        entityManager.persist(user);
        LocalDateTime start = LocalDateTime.of(2026, 11, 13, 8, 0);
        Loan loan = new Loan(user, laboratory, start, start.plusHours(1));
        entityManager.persist(loan);
        return loan;
    }
}

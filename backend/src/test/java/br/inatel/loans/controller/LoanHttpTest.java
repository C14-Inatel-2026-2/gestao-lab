package br.inatel.loans.controller;

import br.inatel.labs.model.Laboratory;
import br.inatel.labs.service.LaboratoryService;
import br.inatel.loans.exception.InvalidLoanException;
import br.inatel.loans.model.Loan;
import br.inatel.loans.service.LoanService;
import br.inatel.users.config.SecurityConfig;
import br.inatel.users.controller.AuthExceptionHandler;
import br.inatel.users.model.Role;
import br.inatel.users.model.User;
import br.inatel.users.repository.UserRepository;
import br.inatel.users.service.TokenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(LoanController.class)
@Import({SecurityConfig.class, TokenService.class, AuthExceptionHandler.class, LoanExceptionHandler.class})
class LoanHttpTest {

    private static final String VALID_BODY =
            "{\"laboratoryId\":2,\"startDateTime\":\"2026-09-15T08:00:00\",\"endDateTime\":\"2026-09-15T10:00:00\"}";

    @Autowired MockMvc mvc;
    @Autowired TokenService tokens;
    @MockBean LoanService loanService;
    @MockBean LaboratoryService laboratoryService;
    @MockBean UserRepository userRepository;
    @MockBean Clock clock;

    private final LocalDateTime start = LocalDateTime.of(2026, 9, 15, 8, 0);
    private final LocalDateTime end = LocalDateTime.of(2026, 9, 15, 10, 0);

    private User user;
    private Laboratory laboratory;
    private String token;

    @BeforeEach
    void setUp() {
        when(clock.instant()).thenReturn(Instant.parse("2026-01-01T00:00:00Z"));
        user = new User("Ana Silva", "ana@inatel.br", "hashed", Role.PARTICIPANT);
        laboratory = new Laboratory("Lab IoT");
        ReflectionTestUtils.setField(user, "id", 1L);
        ReflectionTestUtils.setField(laboratory, "id", 2L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(laboratoryService.findById(2L)).thenReturn(laboratory);
        token = tokens.issue(user);
    }

    @Test
    void createsLoanForAuthenticatedUserWithoutExposingSensitiveData() throws Exception {
        Loan loan = new Loan(user, laboratory, start, end);
        ReflectionTestUtils.setField(loan, "id", 3L);
        when(loanService.create(user, laboratory, start, end)).thenReturn(loan);

        mvc.perform(post("/api/loans").header("Authorization", "Bearer " + token)
                        .contentType("application/json").content(VALID_BODY))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(3))
                .andExpect(jsonPath("$.userId").value(1))
                .andExpect(jsonPath("$.laboratoryId").value(2))
                .andExpect(jsonPath("$.startDateTime").value("2026-09-15T08:00:00"))
                .andExpect(jsonPath("$.endDateTime").value("2026-09-15T10:00:00"))
                .andExpect(jsonPath("$.user").doesNotExist())
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    void rejectsRequestWithoutToken() throws Exception {
        mvc.perform(post("/api/loans").contentType("application/json").content(VALID_BODY))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(loanService);
    }

    @Test
    void rejectsMissingLaboratoryId() throws Exception {
        String body = "{\"startDateTime\":\"2026-09-15T08:00:00\",\"endDateTime\":\"2026-09-15T10:00:00\"}";

        mvc.perform(post("/api/loans").header("Authorization", "Bearer " + token)
                        .contentType("application/json").content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Laboratory id must not be null"));

        verifyNoInteractions(loanService);
    }

    @Test
    void rejectsMissingEndDateTime() throws Exception {
        String body = "{\"laboratoryId\":2,\"startDateTime\":\"2026-09-15T08:00:00\"}";

        mvc.perform(post("/api/loans").header("Authorization", "Bearer " + token)
                        .contentType("application/json").content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("End date/time must not be null"));

        verifyNoInteractions(loanService);
    }

    @Test
    void returnsBadRequestWithServiceMessageWhenLoanIsInvalid() throws Exception {
        when(loanService.create(user, laboratory, start, end))
                .thenThrow(new InvalidLoanException("End date/time must be after start date/time"));

        mvc.perform(post("/api/loans").header("Authorization", "Bearer " + token)
                        .contentType("application/json").content(VALID_BODY))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("End date/time must be after start date/time"));
    }

    @Test
    void returnsBadRequestWhenLaboratoryDoesNotExist() throws Exception {
        when(laboratoryService.findById(99L))
                .thenThrow(new IllegalArgumentException("Laboratory not found"));
        String body = "{\"laboratoryId\":99,\"startDateTime\":\"2026-09-15T08:00:00\","
                + "\"endDateTime\":\"2026-09-15T10:00:00\"}";

        mvc.perform(post("/api/loans").header("Authorization", "Bearer " + token)
                        .contentType("application/json").content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Laboratory not found"));

        verifyNoInteractions(loanService);
    }

    @ParameterizedTest
    @ValueSource(strings = {"{", "",
            "{\"laboratoryId\":2,\"startDateTime\":\"not-a-date\",\"endDateTime\":\"2026-09-15T10:00:00\"}"})
    void rejectsMalformedOrAbsentBody(String body) throws Exception {
        mvc.perform(post("/api/loans").header("Authorization", "Bearer " + token)
                        .contentType("application/json").content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Malformed request"));

        verifyNoInteractions(loanService);
    }
}

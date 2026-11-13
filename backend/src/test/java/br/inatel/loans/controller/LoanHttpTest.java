package br.inatel.loans.controller;

import br.inatel.devices.exception.DeviceNotFoundException;
import br.inatel.devices.model.Device;
import br.inatel.devices.service.DeviceService;
import br.inatel.labs.model.Laboratory;
import br.inatel.labs.service.LaboratoryService;
import br.inatel.loans.exception.InvalidLoanException;
import br.inatel.loans.exception.LoanNotFoundException;
import br.inatel.loans.model.Loan;
import br.inatel.loans.model.LoanStatus;
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
import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(LoanController.class)
@Import({SecurityConfig.class, TokenService.class, AuthExceptionHandler.class, LoanExceptionHandler.class})
class LoanHttpTest {

    private static final String VALID_BODY =
            "{\"laboratoryId\":2,\"deviceId\":4,\"startDateTime\":\"2026-09-15T08:00:00\","
                    + "\"endDateTime\":\"2026-09-15T10:00:00\"}";

    @Autowired MockMvc mvc;
    @Autowired TokenService tokens;
    @MockBean LoanService loanService;
    @MockBean LaboratoryService laboratoryService;
    @MockBean DeviceService deviceService;
    @MockBean UserRepository userRepository;
    @MockBean Clock clock;

    private final LocalDateTime start = LocalDateTime.of(2026, 9, 15, 8, 0);
    private final LocalDateTime end = LocalDateTime.of(2026, 9, 15, 10, 0);

    private User user;
    private Laboratory laboratory;
    private Device device;
    private String token;
    private String adminToken;

    @BeforeEach
    void setUp() {
        when(clock.instant()).thenReturn(Instant.parse("2026-01-01T00:00:00Z"));
        user = new User("Ana Silva", "ana@inatel.br", "hashed", Role.PARTICIPANT);
        laboratory = new Laboratory("Lab IoT");
        device = new Device("Multimeter", null, laboratory);
        ReflectionTestUtils.setField(user, "id", 1L);
        ReflectionTestUtils.setField(laboratory, "id", 2L);
        ReflectionTestUtils.setField(device, "id", 4L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(laboratoryService.findById(2L)).thenReturn(laboratory);
        when(deviceService.findById(4L)).thenReturn(device);
        token = tokens.issue(user);

        User admin = new User("Admin", "admin@inatel.br", "hashed", Role.ADMIN);
        ReflectionTestUtils.setField(admin, "id", 9L);
        adminToken = tokens.issue(admin);
    }

    private Loan loan(LoanStatus status) {
        Loan loan = new Loan(user, laboratory, device, start, end);
        loan.setStatus(status);
        ReflectionTestUtils.setField(loan, "id", 3L);
        return loan;
    }

    // ---- POST /api/loans ----

    @Test
    void createsLoanForAuthenticatedUserWithoutExposingSensitiveData() throws Exception {
        when(loanService.create(user, laboratory, device, start, end)).thenReturn(loan(LoanStatus.REQUESTED));

        mvc.perform(post("/api/loans").header("Authorization", "Bearer " + token)
                        .contentType("application/json").content(VALID_BODY))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(3))
                .andExpect(jsonPath("$.userId").value(1))
                .andExpect(jsonPath("$.laboratoryId").value(2))
                .andExpect(jsonPath("$.deviceId").value(4))
                .andExpect(jsonPath("$.status").value("REQUESTED"))
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
        String body = "{\"deviceId\":4,\"startDateTime\":\"2026-09-15T08:00:00\","
                + "\"endDateTime\":\"2026-09-15T10:00:00\"}";

        mvc.perform(post("/api/loans").header("Authorization", "Bearer " + token)
                        .contentType("application/json").content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Laboratory id must not be null"));

        verifyNoInteractions(loanService);
    }

    @Test
    void rejectsMissingDeviceId() throws Exception {
        String body = "{\"laboratoryId\":2,\"startDateTime\":\"2026-09-15T08:00:00\","
                + "\"endDateTime\":\"2026-09-15T10:00:00\"}";

        mvc.perform(post("/api/loans").header("Authorization", "Bearer " + token)
                        .contentType("application/json").content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Device id must not be null"));

        verifyNoInteractions(loanService);
    }

    @Test
    void rejectsMissingEndDateTime() throws Exception {
        String body = "{\"laboratoryId\":2,\"deviceId\":4,\"startDateTime\":\"2026-09-15T08:00:00\"}";

        mvc.perform(post("/api/loans").header("Authorization", "Bearer " + token)
                        .contentType("application/json").content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("End date/time must not be null"));

        verifyNoInteractions(loanService);
    }

    @Test
    void returnsBadRequestWithServiceMessageWhenLoanIsInvalid() throws Exception {
        when(loanService.create(user, laboratory, device, start, end))
                .thenThrow(new InvalidLoanException("Device is already booked for this period"));

        mvc.perform(post("/api/loans").header("Authorization", "Bearer " + token)
                        .contentType("application/json").content(VALID_BODY))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Device is already booked for this period"));
    }

    @Test
    void returnsBadRequestWhenLaboratoryDoesNotExist() throws Exception {
        when(laboratoryService.findById(99L))
                .thenThrow(new IllegalArgumentException("Laboratory not found"));
        String body = "{\"laboratoryId\":99,\"deviceId\":4,\"startDateTime\":\"2026-09-15T08:00:00\","
                + "\"endDateTime\":\"2026-09-15T10:00:00\"}";

        mvc.perform(post("/api/loans").header("Authorization", "Bearer " + token)
                        .contentType("application/json").content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Laboratory not found"));

        verifyNoInteractions(loanService);
    }

    @Test
    void returnsNotFoundWhenDeviceDoesNotExist() throws Exception {
        when(deviceService.findById(99L)).thenThrow(new DeviceNotFoundException("Device not found"));
        String body = "{\"laboratoryId\":2,\"deviceId\":99,\"startDateTime\":\"2026-09-15T08:00:00\","
                + "\"endDateTime\":\"2026-09-15T10:00:00\"}";

        mvc.perform(post("/api/loans").header("Authorization", "Bearer " + token)
                        .contentType("application/json").content(body))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Device not found"));

        verifyNoInteractions(loanService);
    }

    @ParameterizedTest
    @ValueSource(strings = {"{", "",
            "{\"laboratoryId\":2,\"deviceId\":4,\"startDateTime\":\"not-a-date\",\"endDateTime\":\"2026-09-15T10:00:00\"}"})
    void rejectsMalformedOrAbsentBody(String body) throws Exception {
        mvc.perform(post("/api/loans").header("Authorization", "Bearer " + token)
                        .contentType("application/json").content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Malformed request"));

        verifyNoInteractions(loanService);
    }

    // ---- GET /api/loans ----

    @Test
    void listsEveryLoanForAdmin() throws Exception {
        when(loanService.listAll()).thenReturn(List.of(loan(LoanStatus.REQUESTED)));

        mvc.perform(get("/api/loans").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(3))
                .andExpect(jsonPath("$[0].status").value("REQUESTED"));
    }

    @Test
    void listsOnlyOwnLoansForParticipant() throws Exception {
        when(loanService.listByUser(1L)).thenReturn(List.of(loan(LoanStatus.APPROVED)));

        mvc.perform(get("/api/loans").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].userId").value(1))
                .andExpect(jsonPath("$[0].status").value("APPROVED"));
    }

    @Test
    void rejectsListWithoutToken() throws Exception {
        mvc.perform(get("/api/loans"))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(loanService);
    }

    // ---- PATCH approve / reject / return ----

    @Test
    void approvesLoanAsAdmin() throws Exception {
        when(loanService.approve(3L)).thenReturn(loan(LoanStatus.APPROVED));

        mvc.perform(patch("/api/loans/3/approve").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(3))
                .andExpect(jsonPath("$.status").value("APPROVED"));
    }

    @Test
    void forbidsParticipantFromApproving() throws Exception {
        mvc.perform(patch("/api/loans/3/approve").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Access denied"));

        verifyNoInteractions(loanService);
    }

    @Test
    void rejectsApprovalWithoutToken() throws Exception {
        mvc.perform(patch("/api/loans/3/approve"))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(loanService);
    }

    @Test
    void returnsNotFoundWhenApprovingUnknownLoan() throws Exception {
        when(loanService.approve(99L)).thenThrow(new LoanNotFoundException("Loan not found"));

        mvc.perform(patch("/api/loans/99/approve").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Loan not found"));
    }

    @Test
    void returnsBadRequestWhenApprovalIsNotAllowed() throws Exception {
        when(loanService.approve(3L))
                .thenThrow(new InvalidLoanException("Device is under maintenance"));

        mvc.perform(patch("/api/loans/3/approve").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Device is under maintenance"));
    }

    @Test
    void rejectsLoanAsAdmin() throws Exception {
        when(loanService.reject(3L)).thenReturn(loan(LoanStatus.REJECTED));

        mvc.perform(patch("/api/loans/3/reject").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"));
    }

    @Test
    void forbidsParticipantFromRejecting() throws Exception {
        mvc.perform(patch("/api/loans/3/reject").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        verifyNoInteractions(loanService);
    }

    @Test
    void registersReturnAsAdmin() throws Exception {
        when(loanService.registerReturn(3L)).thenReturn(loan(LoanStatus.RETURNED));

        mvc.perform(patch("/api/loans/3/return").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RETURNED"));
    }

    @Test
    void forbidsParticipantFromRegisteringReturn() throws Exception {
        mvc.perform(patch("/api/loans/3/return").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        verifyNoInteractions(loanService);
    }

    @Test
    void returnsBadRequestWhenReturnIsRegisteredTwice() throws Exception {
        when(loanService.registerReturn(3L))
                .thenThrow(new InvalidLoanException("Only approved loans can be returned"));

        mvc.perform(patch("/api/loans/3/return").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Only approved loans can be returned"));
    }
}

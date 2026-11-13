package br.inatel.loans.controller;

import br.inatel.devices.exception.DeviceNotFoundException;
import br.inatel.devices.model.Device;
import br.inatel.devices.service.DeviceService;
import br.inatel.labs.model.Laboratory;
import br.inatel.labs.service.LaboratoryService;
import br.inatel.loans.dto.LoanRequest;
import br.inatel.loans.dto.LoanResponse;
import br.inatel.loans.exception.InvalidLoanException;
import br.inatel.loans.model.Loan;
import br.inatel.loans.model.LoanStatus;
import br.inatel.loans.service.LoanService;
import br.inatel.users.model.Role;
import br.inatel.users.model.User;
import br.inatel.users.repository.UserRepository;
import br.inatel.users.service.TokenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LoanControllerTest {

    @Mock
    private LoanService loanService;

    @Mock
    private LaboratoryService laboratoryService;

    @Mock
    private DeviceService deviceService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private LoanController loanController;

    private final TokenService.Identity identity =
            new TokenService.Identity(1L, "ana@inatel.br", Role.PARTICIPANT);
    private final TokenService.Identity adminIdentity =
            new TokenService.Identity(9L, "admin@inatel.br", Role.ADMIN);
    private final LocalDateTime start = LocalDateTime.of(2026, 9, 15, 8, 0);
    private final LocalDateTime end = start.plusHours(2);

    private User user;
    private Laboratory laboratory;
    private Device device;

    @BeforeEach
    void setUp() {
        user = new User("Ana Silva", "ana@inatel.br", "hashed", Role.PARTICIPANT);
        laboratory = new Laboratory("Lab IoT");
        device = new Device("Multimeter", null, laboratory);
        ReflectionTestUtils.setField(user, "id", 1L);
        ReflectionTestUtils.setField(laboratory, "id", 2L);
        ReflectionTestUtils.setField(device, "id", 4L);
    }

    private Loan loan(LoanStatus status) {
        Loan loan = new Loan(user, laboratory, device, start, end);
        loan.setStatus(status);
        ReflectionTestUtils.setField(loan, "id", 3L);
        return loan;
    }

    @Test
    @DisplayName("Should return 201 Created and LoanResponse using the authenticated user")
    void shouldReturnCreatedWhenLoanIsValid() {
        Loan loan = loan(LoanStatus.REQUESTED);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(laboratoryService.findById(2L)).thenReturn(laboratory);
        when(deviceService.findById(4L)).thenReturn(device);
        when(loanService.create(user, laboratory, device, start, end)).thenReturn(loan);

        ResponseEntity<LoanResponse> response =
                loanController.create(identity, new LoanRequest(2L, 4L, start, end));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().id()).isEqualTo(3L);
        assertThat(response.getBody().userId()).isEqualTo(1L);
        assertThat(response.getBody().laboratoryId()).isEqualTo(2L);
        assertThat(response.getBody().deviceId()).isEqualTo(4L);
        assertThat(response.getBody().status()).isEqualTo(LoanStatus.REQUESTED);
        verify(loanService).create(user, laboratory, device, start, end);
    }

    @Test
    @DisplayName("Should propagate InvalidLoanException thrown by the service")
    void shouldPropagateInvalidLoanException() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(laboratoryService.findById(2L)).thenReturn(laboratory);
        when(deviceService.findById(4L)).thenReturn(device);
        when(loanService.create(user, laboratory, device, start, start))
                .thenThrow(new InvalidLoanException("End date/time must be after start date/time"));

        assertThatThrownBy(() -> loanController.create(identity, new LoanRequest(2L, 4L, start, start)))
                .isInstanceOf(InvalidLoanException.class)
                .hasMessage("End date/time must be after start date/time");
    }

    @Test
    @DisplayName("Should propagate error and skip the service when the laboratory does not exist")
    void shouldPropagateLaboratoryNotFound() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(laboratoryService.findById(99L))
                .thenThrow(new IllegalArgumentException("Laboratory not found"));

        assertThatThrownBy(() -> loanController.create(identity, new LoanRequest(99L, 4L, start, end)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Laboratory not found");

        verifyNoInteractions(loanService);
    }

    @Test
    @DisplayName("Should propagate error and skip the service when the device does not exist")
    void shouldPropagateDeviceNotFound() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(laboratoryService.findById(2L)).thenReturn(laboratory);
        when(deviceService.findById(99L)).thenThrow(new DeviceNotFoundException("Device not found"));

        assertThatThrownBy(() -> loanController.create(identity, new LoanRequest(2L, 99L, start, end)))
                .isInstanceOf(DeviceNotFoundException.class)
                .hasMessage("Device not found");

        verifyNoInteractions(loanService);
    }

    @Test
    @DisplayName("Should reject the request when the authenticated user no longer exists")
    void shouldRejectWhenAuthenticatedUserDoesNotExist() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> loanController.create(identity, new LoanRequest(2L, 4L, start, end)))
                .isInstanceOf(InvalidLoanException.class)
                .hasMessage("User not found");

        verifyNoInteractions(loanService);
    }

    @Test
    @DisplayName("Should list every loan for an admin")
    void shouldListAllLoansForAdmin() {
        when(loanService.listAll()).thenReturn(List.of(loan(LoanStatus.REQUESTED)));

        List<LoanResponse> response = loanController.list(adminIdentity);

        assertThat(response).hasSize(1);
        assertThat(response.get(0).id()).isEqualTo(3L);
        verify(loanService).listAll();
    }

    @Test
    @DisplayName("Should list only the own loans for a participant")
    void shouldListOwnLoansForParticipant() {
        when(loanService.listByUser(1L)).thenReturn(List.of(loan(LoanStatus.APPROVED)));

        List<LoanResponse> response = loanController.list(identity);

        assertThat(response).hasSize(1);
        assertThat(response.get(0).status()).isEqualTo(LoanStatus.APPROVED);
        verify(loanService).listByUser(1L);
    }

    @Test
    @DisplayName("Should approve a loan through the service")
    void shouldApproveLoan() {
        when(loanService.approve(3L)).thenReturn(loan(LoanStatus.APPROVED));

        LoanResponse response = loanController.approve(3L);

        assertThat(response.status()).isEqualTo(LoanStatus.APPROVED);
    }

    @Test
    @DisplayName("Should reject a loan through the service")
    void shouldRejectLoan() {
        when(loanService.reject(3L)).thenReturn(loan(LoanStatus.REJECTED));

        LoanResponse response = loanController.reject(3L);

        assertThat(response.status()).isEqualTo(LoanStatus.REJECTED);
    }

    @Test
    @DisplayName("Should register the return of a loan through the service")
    void shouldRegisterReturn() {
        when(loanService.registerReturn(3L)).thenReturn(loan(LoanStatus.RETURNED));

        LoanResponse response = loanController.registerReturn(3L);

        assertThat(response.status()).isEqualTo(LoanStatus.RETURNED);
    }
}

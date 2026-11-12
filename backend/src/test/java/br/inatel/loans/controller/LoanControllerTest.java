package br.inatel.loans.controller;

import br.inatel.labs.model.Laboratory;
import br.inatel.labs.service.LaboratoryService;
import br.inatel.loans.dto.LoanRequest;
import br.inatel.loans.dto.LoanResponse;
import br.inatel.loans.exception.InvalidLoanException;
import br.inatel.loans.model.Loan;
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
    private UserRepository userRepository;

    @InjectMocks
    private LoanController loanController;

    private final TokenService.Identity identity =
            new TokenService.Identity(1L, "ana@inatel.br", Role.PARTICIPANT);
    private final LocalDateTime start = LocalDateTime.of(2026, 9, 15, 8, 0);
    private final LocalDateTime end = start.plusHours(2);

    private User user;
    private Laboratory laboratory;

    @BeforeEach
    void setUp() {
        user = new User("Ana Silva", "ana@inatel.br", "hashed", Role.PARTICIPANT);
        laboratory = new Laboratory("Lab IoT");
        ReflectionTestUtils.setField(user, "id", 1L);
        ReflectionTestUtils.setField(laboratory, "id", 2L);
    }

    @Test
    @DisplayName("Should return 201 Created and LoanResponse using the authenticated user")
    void shouldReturnCreatedWhenLoanIsValid() {
        Loan loan = new Loan(user, laboratory, start, end);
        ReflectionTestUtils.setField(loan, "id", 3L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(laboratoryService.findById(2L)).thenReturn(laboratory);
        when(loanService.create(user, laboratory, start, end)).thenReturn(loan);

        ResponseEntity<LoanResponse> response =
                loanController.create(identity, new LoanRequest(2L, start, end));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().id()).isEqualTo(3L);
        assertThat(response.getBody().userId()).isEqualTo(1L);
        assertThat(response.getBody().laboratoryId()).isEqualTo(2L);
        verify(loanService).create(user, laboratory, start, end);
    }

    @Test
    @DisplayName("Should propagate InvalidLoanException thrown by the service")
    void shouldPropagateInvalidLoanException() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(laboratoryService.findById(2L)).thenReturn(laboratory);
        when(loanService.create(user, laboratory, start, start))
                .thenThrow(new InvalidLoanException("End date/time must be after start date/time"));

        assertThatThrownBy(() -> loanController.create(identity, new LoanRequest(2L, start, start)))
                .isInstanceOf(InvalidLoanException.class)
                .hasMessage("End date/time must be after start date/time");
    }

    @Test
    @DisplayName("Should propagate error and skip the service when the laboratory does not exist")
    void shouldPropagateLaboratoryNotFound() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(laboratoryService.findById(99L))
                .thenThrow(new IllegalArgumentException("Laboratory not found"));

        assertThatThrownBy(() -> loanController.create(identity, new LoanRequest(99L, start, end)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Laboratory not found");

        verifyNoInteractions(loanService);
    }

    @Test
    @DisplayName("Should reject the request when the authenticated user no longer exists")
    void shouldRejectWhenAuthenticatedUserDoesNotExist() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> loanController.create(identity, new LoanRequest(2L, start, end)))
                .isInstanceOf(InvalidLoanException.class)
                .hasMessage("User not found");

        verifyNoInteractions(loanService);
    }
}

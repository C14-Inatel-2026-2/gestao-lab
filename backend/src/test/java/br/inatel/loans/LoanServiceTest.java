package br.inatel.loans;

import br.inatel.devices.model.Device;
import br.inatel.devices.model.DeviceStatus;
import br.inatel.devices.service.DeviceService;
import br.inatel.labs.model.Laboratory;
import br.inatel.loans.exception.InvalidLoanException;
import br.inatel.loans.exception.LoanNotFoundException;
import br.inatel.loans.model.Loan;
import br.inatel.loans.model.LoanStatus;
import br.inatel.loans.repository.LoanRepository;
import br.inatel.loans.service.LoanService;
import br.inatel.users.model.Role;
import br.inatel.users.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.function.Executable;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LoanServiceTest {

    @Mock
    private LoanRepository repository;

    @Mock
    private DeviceService deviceService;

    private LoanService service;
    private User user;
    private Laboratory laboratory;
    private Device device;
    private LocalDateTime start;
    private LocalDateTime end;

    @BeforeEach
    void setUp() {
        service = new LoanService(repository, deviceService);
        user = new User("Lucas", "lucas@inatel.br", "Senha123", Role.PARTICIPANT);
        laboratory = new Laboratory("Laboratorio de Software");
        ReflectionTestUtils.setField(laboratory, "id", 1L);
        device = new Device("Multimeter", null, laboratory);
        ReflectionTestUtils.setField(device, "id", 5L);
        start = LocalDateTime.of(2026, 9, 15, 8, 0);
        end = LocalDateTime.of(2026, 9, 15, 10, 0);
    }

    private Loan loanWithStatus(LoanStatus status) {
        Loan loan = new Loan(user, laboratory, device, start, end);
        loan.setStatus(status);
        ReflectionTestUtils.setField(loan, "id", 10L);
        return loan;
    }

    private void assertInvalidLoan(String expectedMessage, Executable action) {
        InvalidLoanException exception = assertThrows(InvalidLoanException.class, action);
        assertEquals(expectedMessage, exception.getMessage());
        verifyNoInteractions(repository);
        verifyNoInteractions(deviceService);
    }

    private void stubOverlap(boolean overlaps) {
        when(repository.existsByDeviceIdAndStatusAndStartDateTimeLessThanAndEndDateTimeGreaterThan(
                5L, LoanStatus.APPROVED, end, start)).thenReturn(overlaps);
    }

    // ---- create ----

    @Test
    void shouldCreateValidLoan() {
        when(repository.save(any(Loan.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Loan loan = service.create(user, laboratory, device, start, end);

        assertEquals(user, loan.getUser());
        assertEquals(laboratory, loan.getLaboratory());
        assertEquals(device, loan.getDevice());
        assertEquals(start, loan.getStartDateTime());
        assertEquals(end, loan.getEndDateTime());
        assertEquals(LoanStatus.REQUESTED, loan.getStatus());
    }

    @Test
    void shouldRejectNullUser() {
        assertInvalidLoan("User must not be null",
                () -> service.create(null, laboratory, device, start, end));
    }

    @Test
    void shouldRejectNullLaboratory() {
        assertInvalidLoan("Laboratory must not be null",
                () -> service.create(user, null, device, start, end));
    }

    @Test
    void shouldRejectNullDevice() {
        assertInvalidLoan("Device must not be null",
                () -> service.create(user, laboratory, null, start, end));
    }

    @Test
    void shouldRejectNullStartDateTime() {
        assertInvalidLoan("Start date/time must not be null",
                () -> service.create(user, laboratory, device, null, end));
    }

    @Test
    void shouldRejectNullEndDateTime() {
        assertInvalidLoan("End date/time must not be null",
                () -> service.create(user, laboratory, device, start, null));
    }

    @Test
    void shouldRejectEndDateTimeBeforeStartDateTime() {
        assertInvalidLoan("End date/time must be after start date/time",
                () -> service.create(user, laboratory, device, start, start.minusHours(1)));
    }

    @Test
    void shouldRejectEndDateTimeEqualToStartDateTime() {
        assertInvalidLoan("End date/time must be after start date/time",
                () -> service.create(user, laboratory, device, start, start));
    }

    @Test
    void shouldRejectDeviceFromAnotherLaboratory() {
        Laboratory otherLaboratory = new Laboratory("Laboratorio de Redes");
        ReflectionTestUtils.setField(otherLaboratory, "id", 2L);

        assertInvalidLoan("Device does not belong to the laboratory",
                () -> service.create(user, otherLaboratory, device, start, end));
    }

    @Test
    void shouldRejectDeviceInMaintenance() {
        device.setStatus(DeviceStatus.MAINTENANCE);

        assertInvalidLoan("Device is under maintenance",
                () -> service.create(user, laboratory, device, start, end));
    }

    @Test
    void shouldRejectPeriodThatOverlapsAnApprovedLoan() {
        stubOverlap(true);

        InvalidLoanException exception = assertThrows(InvalidLoanException.class,
                () -> service.create(user, laboratory, device, start, end));

        assertEquals("Device is already booked for this period", exception.getMessage());
        verify(repository, never()).save(any(Loan.class));
    }

    @Test
    void shouldAcceptBorrowedDeviceWhenPeriodDoesNotOverlap() {
        device.setStatus(DeviceStatus.BORROWED);
        stubOverlap(false);
        when(repository.save(any(Loan.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Loan loan = service.create(user, laboratory, device, start, end);

        assertEquals(LoanStatus.REQUESTED, loan.getStatus());
    }

    @Test
    void shouldSendBuiltLoanToRepository() {
        when(repository.save(any(Loan.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        service.create(user, laboratory, device, start, end);

        ArgumentCaptor<Loan> captor = ArgumentCaptor.forClass(Loan.class);
        verify(repository, times(1)).save(captor.capture());
        assertEquals(user, captor.getValue().getUser());
        assertEquals(laboratory, captor.getValue().getLaboratory());
        assertEquals(device, captor.getValue().getDevice());
    }

    @Test
    void shouldPropagateRepositoryFailure() {
        when(repository.save(any(Loan.class)))
                .thenThrow(new RuntimeException("database unavailable"));

        assertThrows(RuntimeException.class,
                () -> service.create(user, laboratory, device, start, end));
    }

    // ---- approve ----

    @Test
    void shouldApproveRequestedLoanAndMarkDeviceAsBorrowed() {
        Loan loan = loanWithStatus(LoanStatus.REQUESTED);
        when(repository.findById(10L)).thenReturn(Optional.of(loan));
        stubOverlap(false);
        when(repository.save(loan)).thenReturn(loan);

        Loan approved = service.approve(10L);

        assertEquals(LoanStatus.APPROVED, approved.getStatus());
        verify(deviceService).updateStatus(5L, DeviceStatus.BORROWED);
    }

    @Test
    void shouldRejectApprovalOfUnknownLoan() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        LoanNotFoundException exception = assertThrows(LoanNotFoundException.class,
                () -> service.approve(99L));

        assertEquals("Loan not found", exception.getMessage());
        verifyNoInteractions(deviceService);
    }

    @Test
    void shouldRejectApprovalWhenLoanIsNotRequested() {
        Loan loan = loanWithStatus(LoanStatus.APPROVED);
        when(repository.findById(10L)).thenReturn(Optional.of(loan));

        InvalidLoanException exception = assertThrows(InvalidLoanException.class,
                () -> service.approve(10L));

        assertEquals("Only requested loans can be approved", exception.getMessage());
        verify(repository, never()).save(any(Loan.class));
        verifyNoInteractions(deviceService);
    }

    @Test
    void shouldCheckMaintenanceAgainOnApproval() {
        Loan loan = loanWithStatus(LoanStatus.REQUESTED);
        device.setStatus(DeviceStatus.MAINTENANCE);
        when(repository.findById(10L)).thenReturn(Optional.of(loan));

        InvalidLoanException exception = assertThrows(InvalidLoanException.class,
                () -> service.approve(10L));

        assertEquals("Device is under maintenance", exception.getMessage());
        assertEquals(LoanStatus.REQUESTED, loan.getStatus());
        verify(repository, never()).save(any(Loan.class));
        verifyNoInteractions(deviceService);
    }

    @Test
    void shouldCheckConflictAgainOnApproval() {
        Loan loan = loanWithStatus(LoanStatus.REQUESTED);
        when(repository.findById(10L)).thenReturn(Optional.of(loan));
        stubOverlap(true);

        InvalidLoanException exception = assertThrows(InvalidLoanException.class,
                () -> service.approve(10L));

        assertEquals("Device is already booked for this period", exception.getMessage());
        assertEquals(LoanStatus.REQUESTED, loan.getStatus());
        verify(repository, never()).save(any(Loan.class));
        verifyNoInteractions(deviceService);
    }

    // ---- reject ----

    @Test
    void shouldRejectRequestedLoanWithoutTouchingTheDevice() {
        Loan loan = loanWithStatus(LoanStatus.REQUESTED);
        when(repository.findById(10L)).thenReturn(Optional.of(loan));
        when(repository.save(loan)).thenReturn(loan);

        Loan rejected = service.reject(10L);

        assertEquals(LoanStatus.REJECTED, rejected.getStatus());
        verifyNoInteractions(deviceService);
    }

    @Test
    void shouldNotRejectLoanThatIsNotRequested() {
        Loan loan = loanWithStatus(LoanStatus.APPROVED);
        when(repository.findById(10L)).thenReturn(Optional.of(loan));

        InvalidLoanException exception = assertThrows(InvalidLoanException.class,
                () -> service.reject(10L));

        assertEquals("Only requested loans can be rejected", exception.getMessage());
        verify(repository, never()).save(any(Loan.class));
    }

    @Test
    void shouldRejectRejectionOfUnknownLoan() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(LoanNotFoundException.class, () -> service.reject(99L));
    }

    // ---- return ----

    @Test
    void shouldReturnApprovedLoanAndFreeTheDevice() {
        Loan loan = loanWithStatus(LoanStatus.APPROVED);
        device.setStatus(DeviceStatus.BORROWED);
        when(repository.findById(10L)).thenReturn(Optional.of(loan));
        when(repository.save(loan)).thenReturn(loan);

        Loan returned = service.registerReturn(10L);

        assertEquals(LoanStatus.RETURNED, returned.getStatus());
        verify(deviceService).updateStatus(5L, DeviceStatus.AVAILABLE);
    }

    @Test
    void shouldKeepDeviceInMaintenanceWhenLoanIsReturned() {
        Loan loan = loanWithStatus(LoanStatus.APPROVED);
        device.setStatus(DeviceStatus.MAINTENANCE);
        when(repository.findById(10L)).thenReturn(Optional.of(loan));
        when(repository.save(loan)).thenReturn(loan);

        Loan returned = service.registerReturn(10L);

        assertEquals(LoanStatus.RETURNED, returned.getStatus());
        verifyNoInteractions(deviceService);
    }

    @Test
    void shouldNotRegisterTheSameReturnTwice() {
        Loan loan = loanWithStatus(LoanStatus.RETURNED);
        when(repository.findById(10L)).thenReturn(Optional.of(loan));

        InvalidLoanException exception = assertThrows(InvalidLoanException.class,
                () -> service.registerReturn(10L));

        assertEquals("Only approved loans can be returned", exception.getMessage());
        verify(repository, never()).save(any(Loan.class));
        verifyNoInteractions(deviceService);
    }

    @Test
    void shouldNotReturnLoanThatWasNeverApproved() {
        Loan loan = loanWithStatus(LoanStatus.REQUESTED);
        when(repository.findById(10L)).thenReturn(Optional.of(loan));

        assertThrows(InvalidLoanException.class, () -> service.registerReturn(10L));

        verifyNoInteractions(deviceService);
    }

    @Test
    void shouldRejectReturnOfUnknownLoan() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(LoanNotFoundException.class, () -> service.registerReturn(99L));
    }

    @Test
    void shouldKeepDeviceBorrowedWhileAnotherLoanIsStillApproved() {
        Loan loan = loanWithStatus(LoanStatus.APPROVED);
        device.setStatus(DeviceStatus.BORROWED);
        when(repository.findById(10L)).thenReturn(Optional.of(loan));
        when(repository.save(loan)).thenReturn(loan);
        when(repository.existsByDeviceIdAndStatus(5L, LoanStatus.APPROVED)).thenReturn(true);

        Loan returned = service.registerReturn(10L);

        assertEquals(LoanStatus.RETURNED, returned.getStatus());
        verify(deviceService).updateStatus(5L, DeviceStatus.BORROWED);
        verify(deviceService, never()).updateStatus(5L, DeviceStatus.AVAILABLE);
    }

    // ---- list ----

    @Test
    void shouldListAllLoans() {
        List<Loan> loans = List.of(loanWithStatus(LoanStatus.REQUESTED));
        when(repository.findAll()).thenReturn(loans);

        assertSame(loans, service.listAll());
    }

    @Test
    void shouldListLoansOfAUser() {
        List<Loan> loans = List.of(loanWithStatus(LoanStatus.APPROVED));
        when(repository.findByUserId(1L)).thenReturn(loans);

        assertSame(loans, service.listByUser(1L));
    }
}

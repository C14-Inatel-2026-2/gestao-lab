package br.inatel.loans.service;

import br.inatel.devices.model.Device;
import br.inatel.devices.model.DeviceStatus;
import br.inatel.devices.service.DeviceService;
import br.inatel.labs.model.Laboratory;
import br.inatel.loans.exception.InvalidLoanException;
import br.inatel.loans.exception.LoanNotFoundException;
import br.inatel.loans.model.Loan;
import br.inatel.loans.model.LoanStatus;
import br.inatel.loans.repository.LoanRepository;
import br.inatel.users.model.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Service
public class LoanService {

    private final LoanRepository repository;
    private final DeviceService deviceService;

    public LoanService(LoanRepository repository, DeviceService deviceService) {
        this.repository = repository;
        this.deviceService = deviceService;
    }

    public Loan create(User user, Laboratory laboratory, Device device,
                       LocalDateTime startDateTime, LocalDateTime endDateTime) {
        if (user == null) {
            throw new InvalidLoanException("User must not be null");
        }
        if (laboratory == null) {
            throw new InvalidLoanException("Laboratory must not be null");
        }
        if (device == null) {
            throw new InvalidLoanException("Device must not be null");
        }
        if (startDateTime == null) {
            throw new InvalidLoanException("Start date/time must not be null");
        }
        if (endDateTime == null) {
            throw new InvalidLoanException("End date/time must not be null");
        }
        if (!endDateTime.isAfter(startDateTime)) {
            throw new InvalidLoanException("End date/time must be after start date/time");
        }
        if (!Objects.equals(device.getLaboratory().getId(), laboratory.getId())) {
            throw new InvalidLoanException("Device does not belong to the laboratory");
        }
        ensureDeviceCanBeLoaned(device, startDateTime, endDateTime);

        Loan loan = new Loan(user, laboratory, device, startDateTime, endDateTime);
        return repository.save(loan);
    }

    /**
     * Approves a requested loan. The availability is checked again because the device
     * may have gone to maintenance or been booked since the request was made.
     */
    @Transactional
    public Loan approve(Long id) {
        Loan loan = findLoan(id);
        requireStatus(loan, LoanStatus.REQUESTED, "Only requested loans can be approved");
        ensureDeviceCanBeLoaned(loan.getDevice(), loan.getStartDateTime(), loan.getEndDateTime());

        loan.setStatus(LoanStatus.APPROVED);
        Loan saved = repository.save(loan);
        deviceService.updateStatus(loan.getDevice().getId(), DeviceStatus.BORROWED);
        return saved;
    }

    @Transactional
    public Loan reject(Long id) {
        Loan loan = findLoan(id);
        requireStatus(loan, LoanStatus.REQUESTED, "Only requested loans can be rejected");

        loan.setStatus(LoanStatus.REJECTED);
        return repository.save(loan);
    }

    /**
     * Registers the return of an approved loan. The loan is kept as history and the
     * device becomes available again, unless it is in maintenance.
     */
    @Transactional
    public Loan registerReturn(Long id) {
        Loan loan = findLoan(id);
        requireStatus(loan, LoanStatus.APPROVED, "Only approved loans can be returned");

        loan.setStatus(LoanStatus.RETURNED);
        Loan saved = repository.save(loan);
        if (loan.getDevice().getStatus() != DeviceStatus.MAINTENANCE) {
            deviceService.updateStatus(loan.getDevice().getId(), DeviceStatus.AVAILABLE);
        }
        return saved;
    }

    public List<Loan> listAll() {
        return repository.findAll();
    }

    public List<Loan> listByUser(Long userId) {
        return repository.findByUserId(userId);
    }

    private Loan findLoan(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new LoanNotFoundException("Loan not found"));
    }

    private void requireStatus(Loan loan, LoanStatus expected, String message) {
        if (loan.getStatus() != expected) {
            throw new InvalidLoanException(message);
        }
    }

    private void ensureDeviceCanBeLoaned(Device device, LocalDateTime start, LocalDateTime end) {
        if (device.getStatus() == DeviceStatus.MAINTENANCE) {
            throw new InvalidLoanException("Device is under maintenance");
        }
        if (repository.existsByDeviceIdAndStatusAndStartDateTimeLessThanAndEndDateTimeGreaterThan(
                device.getId(), LoanStatus.APPROVED, end, start)) {
            throw new InvalidLoanException("Device is already booked for this period");
        }
    }
}

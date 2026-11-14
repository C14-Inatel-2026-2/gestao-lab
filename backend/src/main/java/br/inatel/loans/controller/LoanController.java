package br.inatel.loans.controller;

import br.inatel.devices.model.Device;
import br.inatel.devices.service.DeviceService;
import br.inatel.labs.model.Laboratory;
import br.inatel.labs.service.LaboratoryService;
import br.inatel.loans.dto.LoanRequest;
import br.inatel.loans.dto.LoanResponse;
import br.inatel.loans.model.Loan;
import br.inatel.loans.service.LoanService;
import br.inatel.users.exception.UserNotFoundException;
import br.inatel.users.model.Role;
import br.inatel.users.model.User;
import br.inatel.users.repository.UserRepository;
import br.inatel.users.service.TokenService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller handling device loan endpoints.
 * It only translates HTTP to service calls; business rules live in {@link LoanService}.
 */
@RestController
@RequestMapping("/api/loans")
public class LoanController {

    private final LoanService loanService;
    private final LaboratoryService laboratoryService;
    private final DeviceService deviceService;
    private final UserRepository userRepository;

    public LoanController(LoanService loanService,
                          LaboratoryService laboratoryService,
                          DeviceService deviceService,
                          UserRepository userRepository) {
        this.loanService = loanService;
        this.laboratoryService = laboratoryService;
        this.deviceService = deviceService;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<LoanResponse> create(@AuthenticationPrincipal TokenService.Identity identity,
                                               @Valid @RequestBody LoanRequest request) {
        User user = userRepository.findById(identity.userId())
                .orElseThrow(UserNotFoundException::new);
        Laboratory laboratory = laboratoryService.findById(request.laboratoryId());
        Device device = deviceService.findById(request.deviceId());

        Loan loan = loanService.create(user, laboratory, device, request.startDateTime(), request.endDateTime());

        return ResponseEntity.status(201).body(LoanResponse.from(loan));
    }

    /**
     * Admins see every loan; any other user sees only their own.
     */
    @GetMapping
    public List<LoanResponse> list(@AuthenticationPrincipal TokenService.Identity identity) {
        List<Loan> loans = identity.role() == Role.ADMIN
                ? loanService.listAll()
                : loanService.listByUser(identity.userId());
        return loans.stream().map(LoanResponse::from).toList();
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public LoanResponse approve(@PathVariable Long id) {
        return LoanResponse.from(loanService.approve(id));
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public LoanResponse reject(@PathVariable Long id) {
        return LoanResponse.from(loanService.reject(id));
    }

    @PatchMapping("/{id}/return")
    @PreAuthorize("hasRole('ADMIN')")
    public LoanResponse registerReturn(@PathVariable Long id) {
        return LoanResponse.from(loanService.registerReturn(id));
    }
}

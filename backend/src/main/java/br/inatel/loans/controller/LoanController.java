package br.inatel.loans.controller;

import br.inatel.labs.model.Laboratory;
import br.inatel.labs.service.LaboratoryService;
import br.inatel.loans.dto.LoanRequest;
import br.inatel.loans.dto.LoanResponse;
import br.inatel.loans.exception.InvalidLoanException;
import br.inatel.loans.model.Loan;
import br.inatel.loans.service.LoanService;
import br.inatel.users.model.User;
import br.inatel.users.repository.UserRepository;
import br.inatel.users.service.TokenService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller handling laboratory loan endpoints.
 * It only translates HTTP to service calls; business rules live in {@link LoanService}.
 */
@RestController
@RequestMapping("/api/loans")
public class LoanController {

    private final LoanService loanService;
    private final LaboratoryService laboratoryService;
    private final UserRepository userRepository;

    public LoanController(LoanService loanService,
                          LaboratoryService laboratoryService,
                          UserRepository userRepository) {
        this.loanService = loanService;
        this.laboratoryService = laboratoryService;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<LoanResponse> create(@AuthenticationPrincipal TokenService.Identity identity,
                                               @Valid @RequestBody LoanRequest request) {
        User user = userRepository.findById(identity.userId())
                .orElseThrow(() -> new InvalidLoanException("User not found"));
        Laboratory laboratory = laboratoryService.findById(request.laboratoryId());

        Loan loan = loanService.create(user, laboratory, request.startDateTime(), request.endDateTime());

        return ResponseEntity.status(201).body(LoanResponse.from(loan));
    }
}

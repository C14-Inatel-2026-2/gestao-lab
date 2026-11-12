package br.inatel.loans;

import br.inatel.labs.model.Laboratory;
import br.inatel.labs.repository.LaboratoryRepository;
import br.inatel.loans.model.Loan;
import br.inatel.loans.repository.LoanRepository;
import br.inatel.users.model.Role;
import br.inatel.users.model.User;
import br.inatel.users.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class LoanRepositoryTest {

    @Autowired
    private LoanRepository loanRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LaboratoryRepository laboratoryRepository;

    @Test
    @DisplayName("Should persist loan linked to user and laboratory")
    void shouldPersistLoanLinkedToUserAndLaboratory() {
        User user = userRepository.save(new User("Ana Silva", "loan.user@inatel.br", "Senha123", Role.PARTICIPANT));
        Laboratory laboratory = laboratoryRepository.save(new Laboratory("Lab Loans"));
        LocalDateTime start = LocalDateTime.of(2026, 9, 15, 8, 0);
        LocalDateTime end = start.plusHours(2);

        Loan saved = loanRepository.save(new Loan(user, laboratory, start, end));

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getUser().getId()).isEqualTo(user.getId());
        assertThat(saved.getLaboratory().getId()).isEqualTo(laboratory.getId());
        assertThat(saved.getStartDateTime()).isEqualTo(start);
        assertThat(saved.getEndDateTime()).isEqualTo(end);
    }
}
package br.inatel.users.config;

import br.inatel.users.dto.RegisterRequest;
import br.inatel.users.model.Role;
import br.inatel.users.repository.UserRepository;
import br.inatel.users.service.UserService;
import jakarta.validation.Validator;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.auth.initial-admin.enabled", havingValue = "true")
public class InitialAdminInitializer implements ApplicationRunner {
    private final UserRepository repository;
    private final UserService users;
    private final Validator validator;
    private final RegisterRequest credentials;

    public InitialAdminInitializer(UserRepository repository, UserService users, Validator validator,
                                   @Value("${app.auth.initial-admin.name:}") String name,
                                   @Value("${app.auth.initial-admin.email:}") String email,
                                   @Value("${app.auth.initial-admin.password:}") String password) {
        this.repository = repository;
        this.users = users;
        this.validator = validator;
        this.credentials = new RegisterRequest(name, email, password);
    }

    @Override
    public void run(ApplicationArguments args) {
        // Preserve existing administrators and their credentials on every restart.
        if (repository.existsByRole(Role.ADMIN)) {
            return;
        }
        if (!validator.validate(credentials).isEmpty() || !users.isPasswordValid(credentials.password())) {
            throw new IllegalStateException("Valid initial administrator name, email and password are required");
        }
        if (repository.existsByEmail(credentials.email())) {
            throw new IllegalStateException("Initial administrator email is already registered");
        }
        users.create(credentials.name(), credentials.email(), credentials.password(), Role.ADMIN);
    }
}

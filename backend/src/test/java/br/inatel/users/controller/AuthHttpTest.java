package br.inatel.users.controller;

import br.inatel.users.config.SecurityConfig;
import br.inatel.users.model.Role;
import br.inatel.users.model.User;
import br.inatel.users.repository.UserRepository;
import br.inatel.users.service.TokenService;
import br.inatel.users.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Clock;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest({AuthController.class, UserController.class})
@Import({SecurityConfig.class, TokenService.class, UserService.class, AuthExceptionHandler.class,
        AuthHttpTest.ProtectedEndpoints.class})
class AuthHttpTest {
    @Test
    void unexpectedFailureDoesNotExposeInternalDetails() throws Exception {
        when(repository.findByEmail("failure@inatel.br"))
                .thenThrow(new IllegalStateException("private database details"));
        mvc.perform(post("/api/auth/login").contentType("application/json")
                        .content("{\"email\":\"failure@inatel.br\",\"password\":\"Senha123\"}"))
                .andExpect(status().isInternalServerError())
                .andExpect(content().json("{\"message\":\"Internal server error\"}", true));
    }

    @Test
    void invalidServiceArgumentsUseSafeValidationMessage() throws Exception {
        when(repository.findByEmail("failure@inatel.br"))
                .thenThrow(new IllegalArgumentException("private validation details"));
        mvc.perform(post("/api/auth/register").contentType("application/json")
                        .content("{\"name\":\"User\",\"email\":\"failure@inatel.br\",\"password\":\"Senha123\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(content().json("{\"message\":\"Invalid registration data\"}", true));
    }

    @Test
    void invalidUserIdentifierReturnsStandardError() throws Exception {
        String token = login(Role.ADMIN);
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .patch("/api/users/invalid/promote")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith("application/json"))
                .andExpect(jsonPath("$.message").value("Invalid user id"));
    }

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired PasswordEncoder encoder;
    @MockBean UserRepository repository;
    @MockBean Clock clock;

    private final Instant now = Instant.parse("2026-01-01T00:00:00Z");

    @BeforeEach
    void setUp() {
        when(clock.instant()).thenReturn(now);
    }

    @ParameterizedTest
    @EnumSource(Role.class)
    void loginAuthenticatesFollowingRequestsAndIdentifiesRole(Role role) throws Exception {
        String token = login(role);
        mvc.perform(get("/test/private").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("lucas@inatel.br"))
                .andExpect(jsonPath("$.authority").value("ROLE_" + role.name()));
        // A successful request must not authenticate the next request implicitly.
        mvc.perform(get("/test/private")).andExpect(status().isUnauthorized());
    }

    @Test
    void deniesParticipantAndAllowsAdminOnRoleRestrictedMethod() throws Exception {
        String participant = login(Role.PARTICIPANT);
        mvc.perform(get("/test/admin").header("Authorization", "Bearer " + participant))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.message").value("Access denied"));
        String admin = login(Role.ADMIN);
        mvc.perform(get("/test/admin").header("Authorization", "Bearer " + admin))
                .andExpect(status().isOk());
    }

    @Test
    void rejectsExpiredTokenAtExpirationBoundary() throws Exception {
        String token = login(Role.ADMIN);
        when(clock.instant()).thenReturn(now.plusSeconds(3600));
        mvc.perform(get("/test/private").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }

    @ParameterizedTest
    @ValueSource(strings = {"Bearer unknown", "Bearer ", "Basic dXNlcjpwYXNz"})
    void rejectsInvalidAuthorization(String authorization) throws Exception {
        mvc.perform(get("/test/private").header("Authorization", authorization))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string("WWW-Authenticate", "Bearer"));
    }

    @Test
    void invalidPasswordAndUnknownEmailHaveSameResponse() throws Exception {
        when(repository.findByEmail("lucas@inatel.br")).thenReturn(Optional.of(
                new User("Lucas", "lucas@inatel.br", encoder.encode("Senha123"), Role.ADMIN)));
        for (String email : new String[]{"lucas@inatel.br", "unknown@inatel.br"}) {
            mvc.perform(post("/api/auth/login").contentType("application/json")
                            .content(mapper.writeValueAsString(Map.of("email", email, "password", "wrong"))))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.message").value("Invalid email or password"))
                    .andExpect(jsonPath("$.token").doesNotExist());
        }
    }

    @ParameterizedTest
    @ValueSource(strings = {"{}", "{\"email\":\"\",\"password\":\" \"}",
            "{\"email\":null,\"password\":null}"})
    void rejectsMissingCredentials(String body) throws Exception {
        mvc.perform(post("/api/auth/login").contentType("application/json").content(body))
                .andExpect(status().isUnauthorized());
    }

    @ParameterizedTest
    @ValueSource(strings = {"{", "null", ""})
    void rejectsMalformedOrAbsentBody(String body) throws Exception {
        mvc.perform(post("/api/auth/login").contentType("application/json").content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Malformed request"));
    }

    @Test
    void healthCheckRemainsPublic() throws Exception {
        mvc.perform(get("/actuator/health")).andExpect(status().isOk());
    }

    private String login(Role role) throws Exception {
        when(repository.findByEmail("lucas@inatel.br")).thenReturn(Optional.of(
                new User("Lucas", "lucas@inatel.br", encoder.encode("Senha123"), role)));
        var result = mvc.perform(post("/api/auth/login").contentType("application/json")
                        .content("{\"email\":\"lucas@inatel.br\",\"password\":\"Senha123\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.role").value(role.name()))
                .andExpect(jsonPath("$.password").doesNotExist()).andReturn();
        String token = mapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
        assertThat(token).isNotBlank();
        return token;
    }

    // These endpoints exist only in tests; domain permission policies remain with their owners.
    @RestController
    static class ProtectedEndpoints {
        @GetMapping("/test/private")
        public Map<String, String> identity(Authentication authentication) {
            var identity = (TokenService.Identity) authentication.getPrincipal();
            return Map.of("email", identity.email(), "authority", authentication.getAuthorities().iterator().next().getAuthority());
        }

        @PreAuthorize("hasRole('ADMIN')")
        @GetMapping("/test/admin")
        public String admin() { return "ok"; }

        @GetMapping("/actuator/health")
        public Map<String, String> health() { return Map.of("status", "UP"); }
    }
}

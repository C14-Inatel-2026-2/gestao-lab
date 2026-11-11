package br.inatel.users.controller;

import br.inatel.users.model.Role;
import br.inatel.users.model.User;
import br.inatel.users.service.TokenService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;

import static org.assertj.core.api.Assertions.assertThat;

// A real server exercises servlet error dispatch, which MockMvc does not perform.
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "spring.datasource.url=jdbc:sqlite::memory:",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.datasource.hikari.maximum-pool-size=1"
})
class AuthServerTest {
    @Autowired TestRestTemplate http;
    @Autowired TokenService tokens;

    @Test
    void validTokenPreservesNotFoundResponse() {
        String token = tokens.issue(new User("Lucas", "lucas@inatel.br", "unused", Role.PARTICIPANT));
        var headers = new HttpHeaders();
        headers.setBearerAuth(token);
        var response = http.exchange("/api/private-proof", HttpMethod.GET,
                new HttpEntity<>(headers), String.class);
        assertThat(response.getStatusCode().value()).isEqualTo(404);
    }

    @Test
    void missingOrInvalidTokenStillRequiresAuthentication() {
        assertThat(http.getForEntity("/api/private-proof", String.class).getStatusCode().value()).isEqualTo(401);
        var headers = new HttpHeaders();
        headers.setBearerAuth("invalid");
        assertThat(http.exchange("/api/private-proof", HttpMethod.GET,
                new HttpEntity<>(headers), String.class).getStatusCode().value()).isEqualTo(401);
        assertThat(http.getForEntity("/error", String.class).getStatusCode().value()).isEqualTo(401);
    }
}

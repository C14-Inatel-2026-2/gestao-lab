package br.inatel.users.service;

import br.inatel.users.model.Role;
import br.inatel.users.model.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TokenService {
    public record Identity(Long userId, String email, Role role) {}
    private record Session(Identity identity, Instant expiresAt) {
        boolean isExpiredAt(Instant now) {
            return !expiresAt.isAfter(now);
        }
    }

    private final ConcurrentHashMap<String, Session> sessions = new ConcurrentHashMap<>();
    private final Clock clock;
    private final Duration ttl;

    public TokenService(Clock clock, @Value("${app.auth.token-ttl:PT1H}") Duration ttl) {
        if (ttl.isNegative() || ttl.isZero()) {
            throw new IllegalArgumentException("Token lifetime must be positive");
        }
        this.clock = clock;
        this.ttl = ttl;
    }

    public String issue(User user) {
        Instant now = clock.instant();
        // Remove expired sessions so inactive tokens do not accumulate indefinitely.
        sessions.entrySet().removeIf(entry -> entry.getValue().isExpiredAt(now));
        String token = UUID.randomUUID().toString();
        sessions.put(token, new Session(new Identity(user.getId(), user.getEmail(), user.getRole()), now.plus(ttl)));
        return token;
    }

    public Optional<Identity> resolve(String token) {
        Session session = sessions.get(token);
        if (session == null) return Optional.empty();
        if (session.isExpiredAt(clock.instant())) {
            sessions.remove(token, session);
            return Optional.empty();
        }
        return Optional.of(session.identity());
    }
}

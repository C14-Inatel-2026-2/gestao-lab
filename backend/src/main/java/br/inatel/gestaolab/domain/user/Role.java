package br.inatel.gestaolab.domain.user;

/**
 * Access control roles defined for gestao-lab users.
 * Supports ADMIN (manages lab, items, approvals) and PARTICIPANT (requests loans).
 */
public enum Role {
    ADMIN,
    PARTICIPANT
}

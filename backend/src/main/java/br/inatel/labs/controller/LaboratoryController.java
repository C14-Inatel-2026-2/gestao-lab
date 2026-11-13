package br.inatel.labs.controller;

import br.inatel.labs.dto.LaboratoryRequest;
import br.inatel.labs.dto.LaboratoryResponse;
import br.inatel.labs.service.LaboratoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/labs")
public class LaboratoryController {
    private final LaboratoryService service;

    public LaboratoryController(LaboratoryService service) {
        this.service = service;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<LaboratoryResponse> create(@RequestBody LaboratoryRequest request) {
        return ResponseEntity.status(201).body(LaboratoryResponse.from(service.create(request.name())));
    }

    @GetMapping
    public List<LaboratoryResponse> list() {
        return service.list().stream().map(LaboratoryResponse::from).toList();
    }

    @GetMapping("/{id}")
    public LaboratoryResponse findById(@PathVariable Long id) {
        return LaboratoryResponse.from(service.findById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public LaboratoryResponse update(@PathVariable Long id, @RequestBody LaboratoryRequest request) {
        return LaboratoryResponse.from(service.update(id, request.name()));
    }
}

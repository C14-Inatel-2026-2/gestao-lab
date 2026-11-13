package br.inatel.labs.controller;

import br.inatel.labs.dto.LaboratoryResponse;
import br.inatel.labs.service.LaboratoryService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
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

    @GetMapping
    public List<LaboratoryResponse> list() {
        return service.list().stream().map(LaboratoryResponse::from).toList();
    }

    @GetMapping("/{id}")
    public LaboratoryResponse findById(@PathVariable Long id) {
        return LaboratoryResponse.from(service.findById(id));
    }
}

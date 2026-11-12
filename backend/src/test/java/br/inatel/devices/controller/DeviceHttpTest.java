package br.inatel.devices.controller;

import br.inatel.devices.exception.DeviceNotFoundException;
import br.inatel.devices.exception.InvalidDeviceException;
import br.inatel.devices.model.Device;
import br.inatel.devices.model.DeviceStatus;
import br.inatel.devices.service.DeviceService;
import br.inatel.labs.model.Laboratory;
import br.inatel.labs.service.LaboratoryService;
import br.inatel.users.config.SecurityConfig;
import br.inatel.users.controller.AuthExceptionHandler;
import br.inatel.users.model.Role;
import br.inatel.users.model.User;
import br.inatel.users.service.TokenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Clock;
import java.time.Instant;
import java.util.List;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(DeviceController.class)
@Import({SecurityConfig.class, TokenService.class, AuthExceptionHandler.class, DeviceExceptionHandler.class})
class DeviceHttpTest {

    private static final String VALID_BODY =
            "{\"name\":\"Oscilloscope\",\"description\":\"Digital oscilloscope\",\"laboratoryId\":2}";

    @Autowired MockMvc mvc;
    @Autowired TokenService tokens;
    @MockBean DeviceService deviceService;
    @MockBean LaboratoryService laboratoryService;
    @MockBean Clock clock;

    private Laboratory laboratory;
    private String adminToken;
    private String participantToken;

    @BeforeEach
    void setUp() {
        when(clock.instant()).thenReturn(Instant.parse("2026-01-01T00:00:00Z"));
        User admin = new User("Admin", "admin@inatel.br", "hashed", Role.ADMIN);
        User participant = new User("Ana Silva", "ana@inatel.br", "hashed", Role.PARTICIPANT);
        ReflectionTestUtils.setField(admin, "id", 1L);
        ReflectionTestUtils.setField(participant, "id", 3L);
        laboratory = new Laboratory("Lab IoT");
        ReflectionTestUtils.setField(laboratory, "id", 2L);
        when(laboratoryService.findById(2L)).thenReturn(laboratory);
        adminToken = tokens.issue(admin);
        participantToken = tokens.issue(participant);
    }

    private Device device(long id, String name, DeviceStatus deviceStatus) {
        Device device = new Device(name, "Description of " + name, laboratory);
        ReflectionTestUtils.setField(device, "id", id);
        device.setStatus(deviceStatus);
        return device;
    }

    // ---- POST /api/devices ----

    @Test
    void adminCreatesDeviceAndGetsFlatResponse() throws Exception {
        when(deviceService.create("Oscilloscope", "Digital oscilloscope", laboratory))
                .thenReturn(device(7L, "Oscilloscope", DeviceStatus.AVAILABLE));

        mvc.perform(post("/api/devices").header("Authorization", "Bearer " + adminToken)
                        .contentType("application/json").content(VALID_BODY))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(7))
                .andExpect(jsonPath("$.name").value("Oscilloscope"))
                .andExpect(jsonPath("$.description").value("Description of Oscilloscope"))
                .andExpect(jsonPath("$.status").value("AVAILABLE"))
                .andExpect(jsonPath("$.laboratoryId").value(2))
                .andExpect(jsonPath("$.laboratoryName").value("Lab IoT"))
                .andExpect(jsonPath("$.laboratory").doesNotExist());
    }

    @Test
    void participantCannotCreateDevice() throws Exception {
        mvc.perform(post("/api/devices").header("Authorization", "Bearer " + participantToken)
                        .contentType("application/json").content(VALID_BODY))
                .andExpect(status().isForbidden());

        verifyNoInteractions(deviceService);
    }

    @Test
    void rejectsCreateWithoutToken() throws Exception {
        mvc.perform(post("/api/devices").contentType("application/json").content(VALID_BODY))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(deviceService);
    }

    @Test
    void rejectsMissingName() throws Exception {
        String body = "{\"description\":\"Digital oscilloscope\",\"laboratoryId\":2}";

        mvc.perform(post("/api/devices").header("Authorization", "Bearer " + adminToken)
                        .contentType("application/json").content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Device name must not be blank"));

        verifyNoInteractions(deviceService);
    }

    @Test
    void rejectsMissingLaboratoryId() throws Exception {
        String body = "{\"name\":\"Oscilloscope\"}";

        mvc.perform(post("/api/devices").header("Authorization", "Bearer " + adminToken)
                        .contentType("application/json").content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Laboratory id must not be null"));

        verifyNoInteractions(deviceService);
    }

    @Test
    void returnsBadRequestWithServiceMessageWhenDeviceIsInvalid() throws Exception {
        when(deviceService.create("Oscilloscope", "Digital oscilloscope", laboratory))
                .thenThrow(new InvalidDeviceException("Device name must not be blank"));

        mvc.perform(post("/api/devices").header("Authorization", "Bearer " + adminToken)
                        .contentType("application/json").content(VALID_BODY))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Device name must not be blank"));
    }

    @Test
    void returnsBadRequestWhenLaboratoryDoesNotExist() throws Exception {
        when(laboratoryService.findById(99L))
                .thenThrow(new IllegalArgumentException("Laboratory not found"));
        String body = "{\"name\":\"Oscilloscope\",\"laboratoryId\":99}";

        mvc.perform(post("/api/devices").header("Authorization", "Bearer " + adminToken)
                        .contentType("application/json").content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Laboratory not found"));

        verifyNoInteractions(deviceService);
    }

    @ParameterizedTest
    @ValueSource(strings = {"{", ""})
    void rejectsMalformedOrAbsentBodyOnCreate(String body) throws Exception {
        mvc.perform(post("/api/devices").header("Authorization", "Bearer " + adminToken)
                        .contentType("application/json").content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Malformed request"));

        verifyNoInteractions(deviceService);
    }

    // ---- GET /api/devices ----

    @Test
    void authenticatedParticipantListsDevicesWithStatus() throws Exception {
        when(deviceService.list(null, null)).thenReturn(List.of(
                device(7L, "Oscilloscope", DeviceStatus.AVAILABLE),
                device(8L, "Multimeter", DeviceStatus.BORROWED)));

        mvc.perform(get("/api/devices").header("Authorization", "Bearer " + participantToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].name").value("Oscilloscope"))
                .andExpect(jsonPath("$[0].status").value("AVAILABLE"))
                .andExpect(jsonPath("$[1].name").value("Multimeter"))
                .andExpect(jsonPath("$[1].status").value("BORROWED"))
                .andExpect(jsonPath("$[1].laboratoryName").value("Lab IoT"));
    }

    @Test
    void passesLaboratoryAndStatusFiltersToTheService() throws Exception {
        when(deviceService.list(2L, DeviceStatus.AVAILABLE))
                .thenReturn(List.of(device(7L, "Oscilloscope", DeviceStatus.AVAILABLE)));

        mvc.perform(get("/api/devices?laboratoryId=2&status=AVAILABLE")
                        .header("Authorization", "Bearer " + participantToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(7));

        verify(deviceService).list(2L, DeviceStatus.AVAILABLE);
    }

    @Test
    void rejectsListWithoutToken() throws Exception {
        mvc.perform(get("/api/devices")).andExpect(status().isUnauthorized());

        verifyNoInteractions(deviceService);
    }

    // ---- PATCH /api/devices/{id}/status ----

    @Test
    void adminUpdatesDeviceStatus() throws Exception {
        when(deviceService.updateStatus(7L, DeviceStatus.MAINTENANCE))
                .thenReturn(device(7L, "Oscilloscope", DeviceStatus.MAINTENANCE));

        mvc.perform(patch("/api/devices/7/status").header("Authorization", "Bearer " + adminToken)
                        .contentType("application/json").content("{\"status\":\"MAINTENANCE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(7))
                .andExpect(jsonPath("$.status").value("MAINTENANCE"));
    }

    @Test
    void participantCannotUpdateDeviceStatus() throws Exception {
        mvc.perform(patch("/api/devices/7/status").header("Authorization", "Bearer " + participantToken)
                        .contentType("application/json").content("{\"status\":\"MAINTENANCE\"}"))
                .andExpect(status().isForbidden());

        verifyNoInteractions(deviceService);
    }

    @Test
    void returnsNotFoundWhenUpdatingUnknownDevice() throws Exception {
        when(deviceService.updateStatus(99L, DeviceStatus.BORROWED))
                .thenThrow(new DeviceNotFoundException("Device not found"));

        mvc.perform(patch("/api/devices/99/status").header("Authorization", "Bearer " + adminToken)
                        .contentType("application/json").content("{\"status\":\"BORROWED\"}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Device not found"));
    }

    @Test
    void rejectsMissingStatus() throws Exception {
        mvc.perform(patch("/api/devices/7/status").header("Authorization", "Bearer " + adminToken)
                        .contentType("application/json").content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Device status must not be null"));

        verifyNoInteractions(deviceService);
    }

    @Test
    void rejectsUnknownStatusValue() throws Exception {
        mvc.perform(patch("/api/devices/7/status").header("Authorization", "Bearer " + adminToken)
                        .contentType("application/json").content("{\"status\":\"FOO\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Malformed request"));

        verifyNoInteractions(deviceService);
    }
}

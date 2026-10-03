package br.inatel.devices;

import br.inatel.devices.model.DeviceModel;
import br.inatel.devices.repository.DeviceRepository;
import br.inatel.devices.service.DeviceService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DeviceTest {

    @Mock
    private DeviceRepository deviceRepository;

    @InjectMocks
    private DeviceService deviceService;
    

    @Test
    @DisplayName("Sem Mock 1: Deve criar dispositivo com status DISPONIVEL")
    void deveCriarDispositivoComStatusDisponivel() {
        DeviceModel device = new DeviceModel(1L, "Osciloscopio");

        assertNotNull(device);
        assertEquals(DeviceModel.Status.DISPONIVEL, device.getStatus());
    }

    @Test
    @DisplayName("Sem Mock 2: Deve alterar status do dispositivo")
    void deveAlterarStatusDoDispositivo() {
        DeviceModel device = new DeviceModel(1L, "Multimetro");

        device.setStatus(DeviceModel.Status.MANUTENCAO);

        assertEquals(DeviceModel.Status.MANUTENCAO, device.getStatus());
    }


    @Test
    @DisplayName("Com Mock 1 (Positivo): Deve buscar dispositivo por ID com sucesso")
    void deveBuscarDispositivoPorIdComSucesso() {
        DeviceModel device = new DeviceModel(1L, "Gerador de Sinais");
        when(deviceRepository.findById(1L)).thenReturn(Optional.of(device));

        DeviceModel resultado = deviceService.buscarPorId(1L);

        assertNotNull(resultado);
        assertEquals("Gerador de Sinais", resultado.getNome());
    }

    @Test
    @DisplayName("Com Mock 2 (NEGATIVO): Deve lancar excecao ao buscar ID inexistente")
    void deveLancarExcecaoQuandoDispositivoNaoEncontrado() {
        when(deviceRepository.findById(99L)).thenReturn(Optional.empty());

        RuntimeException excecao = assertThrows(RuntimeException.class, () -> {
            deviceService.buscarPorId(99L);
        });

        assertEquals("Dispositivo não encontrado", excecao.getMessage());
    }
}
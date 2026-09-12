import { addDaysISO, todayISO } from '../../utils/format';

/**
 * Base de dados em memoria usada quando VITE_USE_MOCK=true.
 * Reproduz o modelo relacional previsto para o PostgreSQL:
 * users, labs, lab_members, projects, project_members, devices, loans.
 */
export function createSeedDb() {
  return {
    users: [
      { id: 1, name: 'Solange Ribeiro da Fonseca', email: 'solange@inatel.br', role: 'ADMIN', registration: 'GEC-1001', active: true },
      { id: 2, name: 'Mauro Iwama', email: 'mauro@inatel.br', role: 'ADMIN', registration: 'GEC-1002', active: true },
      { id: 3, name: 'Giovana Franciele Gonçalves Leite', email: 'giovana@inatel.br', role: 'PARTICIPANT', registration: 'GEC-1003', active: true },
      { id: 4, name: 'Igor Nogueira Olivio', email: 'igor@inatel.br', role: 'PARTICIPANT', registration: 'GEC-1004', active: true },
      { id: 5, name: 'Lucas Nolasco Ynoguti', email: 'lucas@inatel.br', role: 'PARTICIPANT', registration: 'GEC-1005', active: true },
      { id: 6, name: 'Ana Beatriz Moura', email: 'ana@inatel.br', role: 'PARTICIPANT', registration: 'GEC-1006', active: false },
    ],

    labs: [
      { id: 1, name: 'Laboratorio de IoT', code: 'LAB-IOT', location: 'Bloco 2 - Sala 204', description: 'Prototipagem de dispositivos conectados e redes de sensores.', active: true },
      { id: 2, name: 'Laboratorio de Redes', code: 'LAB-NET', location: 'Bloco 3 - Sala 110', description: 'Infraestrutura, roteamento e analise de trafego.', active: true },
      { id: 3, name: 'Laboratorio de Robotica', code: 'LAB-ROB', location: 'Bloco 1 - Sala 008', description: 'Sistemas embarcados, atuadores e visao computacional.', active: true },
    ],

    // vinculo usuario <-> laboratorio (perfil vale dentro do laboratorio)
    labMembers: [
      { labId: 1, userId: 1, role: 'ADMIN' },
      { labId: 1, userId: 3, role: 'PARTICIPANT' },
      { labId: 1, userId: 4, role: 'PARTICIPANT' },
      { labId: 2, userId: 2, role: 'ADMIN' },
      { labId: 2, userId: 5, role: 'PARTICIPANT' },
      { labId: 3, userId: 1, role: 'ADMIN' },
      { labId: 3, userId: 3, role: 'PARTICIPANT' },
    ],

    projects: [
      { id: 1, name: 'Estacao Meteorologica IoT', labId: 1, status: 'ACTIVE', startDate: '2026-02-02', endDate: '2026-06-30', description: 'Coleta de temperatura, umidade e pressao com envio via LoRa.' },
      { id: 2, name: 'Monitor de Qualidade do Ar', labId: 1, status: 'ACTIVE', startDate: '2026-03-01', endDate: '2026-08-15', description: 'Sensores de particulado integrados a um dashboard web.' },
      { id: 3, name: 'Laboratorio Virtual de Redes', labId: 2, status: 'PAUSED', startDate: '2026-01-15', endDate: '2026-07-20', description: 'Bancada de testes com switches gerenciaveis e VLANs.' },
      { id: 4, name: 'Braco Robotico Didatico', labId: 3, status: 'ACTIVE', startDate: '2026-02-20', endDate: '2026-11-30', description: 'Manipulador de 4 graus de liberdade com controle PID.' },
      { id: 5, name: 'Trilha de Seguidor de Linha', labId: 3, status: 'FINISHED', startDate: '2025-08-01', endDate: '2025-12-12', description: 'Competicao interna de robos seguidores de linha.' },
    ],

    projectMembers: [
      { projectId: 1, userId: 3 },
      { projectId: 1, userId: 4 },
      { projectId: 2, userId: 4 },
      { projectId: 3, userId: 5 },
      { projectId: 4, userId: 3 },
      { projectId: 4, userId: 5 },
      { projectId: 5, userId: 3 },
    ],

    devices: [
      { id: 1, name: 'Raspberry Pi 4 Model B', tag: 'IOT-0001', category: 'Placa', labId: 1, projectId: 1, status: 'LOANED', specs: '4 GB RAM, Wi-Fi, 2x micro-HDMI', acquiredAt: '2024-05-12' },
      { id: 2, name: 'ESP32 DevKit v1', tag: 'IOT-0002', category: 'Placa', labId: 1, projectId: 1, status: 'AVAILABLE', specs: 'Dual-core 240 MHz, Wi-Fi + BLE', acquiredAt: '2024-05-12' },
      { id: 3, name: 'Sensor BME280', tag: 'IOT-0003', category: 'Sensor', labId: 1, projectId: 2, status: 'AVAILABLE', specs: 'Temperatura, umidade e pressao - I2C', acquiredAt: '2024-08-03' },
      { id: 4, name: 'Modulo LoRa SX1276', tag: 'IOT-0004', category: 'Modulo', labId: 1, projectId: null, status: 'MAINTENANCE', specs: '915 MHz, antena SMA', acquiredAt: '2023-11-20' },
      { id: 5, name: 'Osciloscopio Rigol DS1054Z', tag: 'IOT-0005', category: 'Instrumento', labId: 1, projectId: null, status: 'AVAILABLE', specs: '4 canais, 50 MHz', acquiredAt: '2022-03-15' },
      { id: 6, name: 'Switch Cisco Catalyst 2960', tag: 'NET-0001', category: 'Rede', labId: 2, projectId: 3, status: 'LOANED', specs: '24 portas Gigabit gerenciaveis', acquiredAt: '2021-09-01' },
      { id: 7, name: 'Roteador Mikrotik hEX', tag: 'NET-0002', category: 'Rede', labId: 2, projectId: 3, status: 'AVAILABLE', specs: 'RouterOS, 5 portas Gigabit', acquiredAt: '2023-02-10' },
      { id: 8, name: 'Analisador de Espectro Wi-Fi', tag: 'NET-0003', category: 'Instrumento', labId: 2, projectId: null, status: 'AVAILABLE', specs: '2.4 GHz e 5 GHz, USB', acquiredAt: '2024-01-25' },
      { id: 9, name: 'Servo Motor MG996R', tag: 'ROB-0001', category: 'Atuador', labId: 3, projectId: 4, status: 'LOANED', specs: 'Torque 11 kg-cm, metalico', acquiredAt: '2024-04-18' },
      { id: 10, name: 'Arduino Mega 2560', tag: 'ROB-0002', category: 'Placa', labId: 3, projectId: 4, status: 'AVAILABLE', specs: '54 I/O digitais, 16 analogicas', acquiredAt: '2023-07-07' },
      { id: 11, name: 'Camera OpenMV H7', tag: 'ROB-0003', category: 'Sensor', labId: 3, projectId: null, status: 'AVAILABLE', specs: 'Visao computacional embarcada', acquiredAt: '2025-01-30' },
      { id: 12, name: 'Fonte de Bancada 30V/5A', tag: 'ROB-0004', category: 'Instrumento', labId: 3, projectId: null, status: 'MAINTENANCE', specs: 'Saida ajustavel, display duplo', acquiredAt: '2020-10-05' },
    ],

    loans: [
      {
        id: 1,
        deviceId: 1,
        projectId: 1,
        userId: 3,
        status: 'APPROVED',
        requestedAt: `${addDaysISO(-12)}T09:15:00`,
        decidedAt: `${addDaysISO(-11)}T08:40:00`,
        decidedBy: 1,
        expectedReturnDate: addDaysISO(-2),
        returnedAt: null,
        notes: 'Uso na bancada de testes da estacao meteorologica.',
      },
      {
        id: 2,
        deviceId: 6,
        projectId: 3,
        userId: 5,
        status: 'APPROVED',
        requestedAt: `${addDaysISO(-6)}T14:02:00`,
        decidedAt: `${addDaysISO(-6)}T16:20:00`,
        decidedBy: 2,
        expectedReturnDate: addDaysISO(8),
        returnedAt: null,
        notes: 'Montagem das VLANs do laboratorio virtual.',
      },
      {
        id: 3,
        deviceId: 9,
        projectId: 4,
        userId: 3,
        status: 'APPROVED',
        requestedAt: `${addDaysISO(-3)}T10:30:00`,
        decidedAt: `${addDaysISO(-3)}T11:00:00`,
        decidedBy: 1,
        expectedReturnDate: addDaysISO(4),
        returnedAt: null,
        notes: 'Calibracao das juntas do braco robotico.',
      },
      {
        id: 4,
        deviceId: 2,
        projectId: 2,
        userId: 4,
        status: 'REQUESTED',
        requestedAt: `${todayISO()}T08:05:00`,
        decidedAt: null,
        decidedBy: null,
        expectedReturnDate: addDaysISO(14),
        returnedAt: null,
        notes: 'Preciso do ESP32 para o firmware do monitor de ar.',
      },
      {
        id: 5,
        deviceId: 10,
        projectId: 4,
        userId: 5,
        status: 'RETURNED',
        requestedAt: `${addDaysISO(-30)}T13:00:00`,
        decidedAt: `${addDaysISO(-30)}T15:10:00`,
        decidedBy: 1,
        expectedReturnDate: addDaysISO(-10),
        returnedAt: `${addDaysISO(-11)}T17:45:00`,
        notes: 'Prototipo inicial do controlador.',
      },
      {
        id: 6,
        deviceId: 7,
        projectId: 3,
        userId: 4,
        status: 'REJECTED',
        requestedAt: `${addDaysISO(-8)}T09:00:00`,
        decidedAt: `${addDaysISO(-7)}T09:30:00`,
        decidedBy: 2,
        expectedReturnDate: addDaysISO(6),
        returnedAt: null,
        notes: 'Equipamento reservado para a aula de segunda.',
        rejectionReason: 'Equipamento ja reservado para aula pratica.',
      },
    ],

    // senha unica para o ambiente de demonstracao
    passwords: { default: '123456' },

    sequences: { users: 6, labs: 3, projects: 5, devices: 12, loans: 6 },
  };
}

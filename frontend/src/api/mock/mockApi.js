import { createSeedDb } from './db';
import { ApiError } from '../http';
import { daysLate, matchesSearch } from '../../utils/format';

let db = createSeedDb();

/** Usado pelos testes para garantir isolamento entre cenarios. */
export function resetMockDb() {
  db = createSeedDb();
}

export function getMockDb() {
  return db;
}

const LATENCY = Number(process.env.VITE_MOCK_LATENCY ?? 120);

function delay(result) {
  return new Promise((resolve) => setTimeout(() => resolve(clone(result)), LATENCY));
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function fail(message, status = 400) {
  return Promise.reject(new ApiError(message, status));
}

function nextId(key) {
  db.sequences[key] += 1;
  return db.sequences[key];
}

function findUser(id) {
  return db.users.find((u) => u.id === Number(id));
}
function findLab(id) {
  return db.labs.find((l) => l.id === Number(id));
}
function findProject(id) {
  return db.projects.find((p) => p.id === Number(id));
}
function findDevice(id) {
  return db.devices.find((d) => d.id === Number(id));
}
function findLoan(id) {
  return db.loans.find((l) => l.id === Number(id));
}

// ---------- DTOs (espelham o que o backend deve devolver) ----------

function userDto(user) {
  if (!user) return null;
  const { id, name, email, role, registration, active } = user;
  return { id, name, email, role, registration, active };
}

function labDto(lab) {
  if (!lab) return null;
  const members = db.labMembers.filter((m) => m.labId === lab.id);
  return {
    ...lab,
    memberCount: members.length,
    deviceCount: db.devices.filter((d) => d.labId === lab.id).length,
    projectCount: db.projects.filter((p) => p.labId === lab.id).length,
    availableDevices: db.devices.filter((d) => d.labId === lab.id && d.status === 'AVAILABLE').length,
  };
}

function projectDto(project) {
  if (!project) return null;
  const lab = findLab(project.labId);
  return {
    ...project,
    labName: lab ? lab.name : null,
    memberCount: db.projectMembers.filter((m) => m.projectId === project.id).length,
    deviceCount: db.devices.filter((d) => d.projectId === project.id).length,
    activeLoans: db.loans.filter((l) => l.projectId === project.id && l.status === 'APPROVED').length,
  };
}

function deviceDto(device) {
  if (!device) return null;
  const lab = findLab(device.labId);
  const project = device.projectId ? findProject(device.projectId) : null;
  return {
    ...device,
    labName: lab ? lab.name : null,
    projectName: project ? project.name : null,
  };
}

function loanDto(loan) {
  if (!loan) return null;
  const device = findDevice(loan.deviceId);
  const project = findProject(loan.projectId);
  const user = findUser(loan.userId);
  const late = loan.status === 'APPROVED' ? daysLate(loan.expectedReturnDate) : 0;
  return {
    ...loan,
    status: late > 0 ? 'OVERDUE' : loan.status,
    daysLate: late,
    deviceName: device ? device.name : null,
    deviceTag: device ? device.tag : null,
    labId: device ? device.labId : null,
    labName: device ? (findLab(device.labId) || {}).name : null,
    projectName: project ? project.name : null,
    userName: user ? user.name : null,
  };
}

// ---------- Regras de negocio ----------

function assertDeviceIsFree(deviceId) {
  const open = db.loans.find(
    (l) => l.deviceId === Number(deviceId) && (l.status === 'REQUESTED' || l.status === 'APPROVED'),
  );
  return open || null;
}

export const mockApi = {
  auth: {
    async login(email, password) {
      const user = db.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase().trim());
      if (!user) return fail('Usuario nao encontrado.', 401);
      if (!user.active) return fail('Usuario inativo. Procure um administrador.', 403);
      if (password !== db.passwords.default) return fail('Email ou senha invalidos.', 401);
      return delay({ token: `mock-token-${user.id}`, user: userDto(user) });
    },
    async me() {
      return delay(userDto(db.users[0]));
    },
  },

  users: {
    async list({ q, role } = {}) {
      const result = db.users
        .filter((u) => (role ? u.role === role : true))
        .filter((u) => matchesSearch(q, u.name, u.email, u.registration));
      return delay(result.map(userDto));
    },
    async get(id) {
      const user = findUser(id);
      if (!user) return fail('Usuario nao encontrado.', 404);
      return delay(userDto(user));
    },
    async create(payload) {
      if (db.users.some((u) => u.email.toLowerCase() === String(payload.email).toLowerCase())) {
        return fail('Ja existe um usuario com esse email.', 409);
      }
      const user = { id: nextId('users'), active: true, ...payload };
      db.users.push(user);
      return delay(userDto(user));
    },
    async update(id, payload) {
      const user = findUser(id);
      if (!user) return fail('Usuario nao encontrado.', 404);
      Object.assign(user, payload);
      return delay(userDto(user));
    },
    async remove(id) {
      const hasLoans = db.loans.some(
        (l) => l.userId === Number(id) && (l.status === 'REQUESTED' || l.status === 'APPROVED'),
      );
      if (hasLoans) return fail('Usuario possui emprestimos em aberto.', 409);
      db.users = db.users.filter((u) => u.id !== Number(id));
      db.labMembers = db.labMembers.filter((m) => m.userId !== Number(id));
      db.projectMembers = db.projectMembers.filter((m) => m.userId !== Number(id));
      return delay(null);
    },
  },

  labs: {
    async list({ q } = {}) {
      const result = db.labs.filter((l) => matchesSearch(q, l.name, l.code, l.location));
      return delay(result.map(labDto));
    },
    async get(id) {
      const lab = findLab(id);
      if (!lab) return fail('Laboratorio nao encontrado.', 404);
      return delay(labDto(lab));
    },
    async create(payload) {
      if (db.labs.some((l) => l.code.toLowerCase() === String(payload.code).toLowerCase())) {
        return fail('Ja existe um laboratorio com esse codigo.', 409);
      }
      const lab = { id: nextId('labs'), active: true, ...payload };
      db.labs.push(lab);
      return delay(labDto(lab));
    },
    async update(id, payload) {
      const lab = findLab(id);
      if (!lab) return fail('Laboratorio nao encontrado.', 404);
      Object.assign(lab, payload);
      return delay(labDto(lab));
    },
    async remove(id) {
      if (db.devices.some((d) => d.labId === Number(id))) {
        return fail('Remova ou transfira os dispositivos antes de excluir o laboratorio.', 409);
      }
      db.labs = db.labs.filter((l) => l.id !== Number(id));
      db.labMembers = db.labMembers.filter((m) => m.labId !== Number(id));
      return delay(null);
    },
    async members(id) {
      const members = db.labMembers
        .filter((m) => m.labId === Number(id))
        .map((m) => ({ ...userDto(findUser(m.userId)), labRole: m.role }))
        .filter((m) => m.id);
      return delay(members);
    },
    async addMember(id, { userId, role = 'PARTICIPANT' }) {
      if (!findUser(userId)) return fail('Usuario nao encontrado.', 404);
      if (db.labMembers.some((m) => m.labId === Number(id) && m.userId === Number(userId))) {
        return fail('Usuario ja faz parte deste laboratorio.', 409);
      }
      db.labMembers.push({ labId: Number(id), userId: Number(userId), role });
      return delay({ labId: Number(id), userId: Number(userId), role });
    },
    async removeMember(id, userId) {
      db.labMembers = db.labMembers.filter(
        (m) => !(m.labId === Number(id) && m.userId === Number(userId)),
      );
      return delay(null);
    },
  },

  projects: {
    async list({ labId, status, q } = {}) {
      const result = db.projects
        .filter((p) => (labId ? p.labId === Number(labId) : true))
        .filter((p) => (status ? p.status === status : true))
        .filter((p) => matchesSearch(q, p.name, p.description));
      return delay(result.map(projectDto));
    },
    async get(id) {
      const project = findProject(id);
      if (!project) return fail('Projeto nao encontrado.', 404);
      const members = db.projectMembers
        .filter((m) => m.projectId === project.id)
        .map((m) => userDto(findUser(m.userId)))
        .filter(Boolean);
      const devices = db.devices.filter((d) => d.projectId === project.id).map(deviceDto);
      const loans = db.loans.filter((l) => l.projectId === project.id).map(loanDto);
      return delay({ ...projectDto(project), members, devices, loans });
    },
    async create(payload) {
      if (!findLab(payload.labId)) return fail('Selecione um laboratorio valido.', 400);
      const project = { id: nextId('projects'), status: 'ACTIVE', ...payload, labId: Number(payload.labId) };
      db.projects.push(project);
      return delay(projectDto(project));
    },
    async update(id, payload) {
      const project = findProject(id);
      if (!project) return fail('Projeto nao encontrado.', 404);
      Object.assign(project, payload, { labId: Number(payload.labId ?? project.labId) });
      return delay(projectDto(project));
    },
    async remove(id) {
      const openLoans = db.loans.some(
        (l) => l.projectId === Number(id) && (l.status === 'REQUESTED' || l.status === 'APPROVED'),
      );
      if (openLoans) return fail('Existem emprestimos em aberto vinculados a este projeto.', 409);
      db.projects = db.projects.filter((p) => p.id !== Number(id));
      db.projectMembers = db.projectMembers.filter((m) => m.projectId !== Number(id));
      db.devices.forEach((d) => {
        if (d.projectId === Number(id)) d.projectId = null;
      });
      return delay(null);
    },
    async addMember(id, userId) {
      if (!findUser(userId)) return fail('Usuario nao encontrado.', 404);
      if (db.projectMembers.some((m) => m.projectId === Number(id) && m.userId === Number(userId))) {
        return fail('Participante ja vinculado ao projeto.', 409);
      }
      db.projectMembers.push({ projectId: Number(id), userId: Number(userId) });
      return delay(null);
    },
    async removeMember(id, userId) {
      db.projectMembers = db.projectMembers.filter(
        (m) => !(m.projectId === Number(id) && m.userId === Number(userId)),
      );
      return delay(null);
    },
    async addDevice(id, deviceId) {
      const project = findProject(id);
      const device = findDevice(deviceId);
      if (!project || !device) return fail('Projeto ou dispositivo nao encontrado.', 404);
      if (device.labId !== project.labId) {
        return fail('O dispositivo pertence a outro laboratorio.', 400);
      }
      if (device.projectId && device.projectId !== project.id) {
        return fail('Dispositivo ja vinculado a outro projeto.', 409);
      }
      device.projectId = project.id;
      return delay(deviceDto(device));
    },
    async removeDevice(id, deviceId) {
      const device = findDevice(deviceId);
      if (device && device.projectId === Number(id)) device.projectId = null;
      return delay(null);
    },
  },

  devices: {
    async list({ labId, status, projectId, q } = {}) {
      const result = db.devices
        .filter((d) => (labId ? d.labId === Number(labId) : true))
        .filter((d) => (status ? d.status === status : true))
        .filter((d) => (projectId ? d.projectId === Number(projectId) : true))
        .filter((d) => matchesSearch(q, d.name, d.tag, d.category, d.specs));
      return delay(result.map(deviceDto));
    },
    async get(id) {
      const device = findDevice(id);
      if (!device) return fail('Dispositivo nao encontrado.', 404);
      return delay(deviceDto(device));
    },
    async create(payload) {
      if (db.devices.some((d) => d.tag.toLowerCase() === String(payload.tag).toLowerCase())) {
        return fail('Ja existe um dispositivo com esse patrimonio.', 409);
      }
      const device = {
        id: nextId('devices'),
        status: 'AVAILABLE',
        ...payload,
        labId: Number(payload.labId),
        projectId: payload.projectId ? Number(payload.projectId) : null,
      };
      db.devices.push(device);
      return delay(deviceDto(device));
    },
    async update(id, payload) {
      const device = findDevice(id);
      if (!device) return fail('Dispositivo nao encontrado.', 404);
      Object.assign(device, payload, {
        labId: Number(payload.labId ?? device.labId),
        projectId: payload.projectId ? Number(payload.projectId) : null,
      });
      return delay(deviceDto(device));
    },
    async remove(id) {
      if (assertDeviceIsFree(id)) return fail('Dispositivo possui emprestimo em aberto.', 409);
      db.devices = db.devices.filter((d) => d.id !== Number(id));
      return delay(null);
    },
    async updateStatus(id, status) {
      const device = findDevice(id);
      if (!device) return fail('Dispositivo nao encontrado.', 404);
      if (device.status === 'LOANED' && status !== 'LOANED') {
        return fail('Registre a devolucao do emprestimo antes de mudar o status.', 409);
      }
      if (status === 'LOANED') {
        return fail('O status Emprestado e definido pelo fluxo de emprestimos.', 400);
      }
      device.status = status;
      return delay(deviceDto(device));
    },
  },

  loans: {
    async list({ status, projectId, userId, labId, q } = {}) {
      const result = db.loans
        .map(loanDto)
        .filter((l) => (status ? l.status === status : true))
        .filter((l) => (projectId ? l.projectId === Number(projectId) : true))
        .filter((l) => (userId ? l.userId === Number(userId) : true))
        .filter((l) => (labId ? l.labId === Number(labId) : true))
        .filter((l) => matchesSearch(q, l.deviceName, l.deviceTag, l.projectName, l.userName))
        .sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
      return delay(result);
    },
    async get(id) {
      const loan = findLoan(id);
      if (!loan) return fail('Emprestimo nao encontrado.', 404);
      return delay(loanDto(loan));
    },

    /** Solicitacao de emprestimo: valida projeto, laboratorio e disponibilidade. */
    async create({ deviceId, projectId, userId, expectedReturnDate, notes }) {
      const device = findDevice(deviceId);
      const project = findProject(projectId);
      if (!device) return fail('Dispositivo nao encontrado.', 404);
      if (!project) return fail('Selecione um projeto valido.', 400);
      if (project.status !== 'ACTIVE') return fail('O projeto selecionado nao esta ativo.', 400);
      if (device.labId !== project.labId) {
        return fail('O dispositivo nao pertence ao laboratorio do projeto.', 400);
      }
      if (device.status === 'MAINTENANCE') return fail('Dispositivo em manutencao.', 409);
      const conflict = assertDeviceIsFree(deviceId);
      if (conflict) {
        return fail('Este dispositivo ja possui uma solicitacao ou emprestimo em aberto.', 409);
      }
      if (!expectedReturnDate) return fail('Informe a data prevista de devolucao.', 400);

      const loan = {
        id: nextId('loans'),
        deviceId: Number(deviceId),
        projectId: Number(projectId),
        userId: Number(userId),
        status: 'REQUESTED',
        requestedAt: new Date().toISOString(),
        decidedAt: null,
        decidedBy: null,
        expectedReturnDate,
        returnedAt: null,
        notes: notes || '',
      };
      db.loans.push(loan);
      return delay(loanDto(loan));
    },

    async approve(id, approverId) {
      const loan = findLoan(id);
      if (!loan) return fail('Emprestimo nao encontrado.', 404);
      if (loan.status !== 'REQUESTED') return fail('Somente solicitacoes pendentes podem ser aprovadas.', 409);
      const device = findDevice(loan.deviceId);
      if (device.status !== 'AVAILABLE') return fail('O dispositivo nao esta mais disponivel.', 409);
      loan.status = 'APPROVED';
      loan.decidedAt = new Date().toISOString();
      loan.decidedBy = approverId ? Number(approverId) : null;
      device.status = 'LOANED';
      return delay(loanDto(loan));
    },

    async reject(id, reason, approverId) {
      const loan = findLoan(id);
      if (!loan) return fail('Emprestimo nao encontrado.', 404);
      if (loan.status !== 'REQUESTED') return fail('Somente solicitacoes pendentes podem ser recusadas.', 409);
      loan.status = 'REJECTED';
      loan.decidedAt = new Date().toISOString();
      loan.decidedBy = approverId ? Number(approverId) : null;
      loan.rejectionReason = reason || '';
      return delay(loanDto(loan));
    },

    async markReturn(id) {
      const loan = findLoan(id);
      if (!loan) return fail('Emprestimo nao encontrado.', 404);
      if (loan.status !== 'APPROVED') return fail('Este emprestimo nao esta em uso.', 409);
      loan.status = 'RETURNED';
      loan.returnedAt = new Date().toISOString();
      const device = findDevice(loan.deviceId);
      if (device) device.status = 'AVAILABLE';
      return delay(loanDto(loan));
    },
  },

  reports: {
    async overview() {
      const loans = db.loans.map(loanDto);
      return delay({
        labs: db.labs.length,
        projects: db.projects.length,
        activeProjects: db.projects.filter((p) => p.status === 'ACTIVE').length,
        devices: db.devices.length,
        availableDevices: db.devices.filter((d) => d.status === 'AVAILABLE').length,
        loanedDevices: db.devices.filter((d) => d.status === 'LOANED').length,
        maintenanceDevices: db.devices.filter((d) => d.status === 'MAINTENANCE').length,
        pendingLoans: loans.filter((l) => l.status === 'REQUESTED').length,
        activeLoans: loans.filter((l) => l.status === 'APPROVED').length,
        overdueLoans: loans.filter((l) => l.status === 'OVERDUE').length,
        users: db.users.length,
      });
    },

    async movements({ from, to, labId } = {}) {
      const result = db.loans
        .map(loanDto)
        .filter((l) => (labId ? l.labId === Number(labId) : true))
        .filter((l) => (from ? new Date(l.requestedAt) >= new Date(`${from}T00:00:00`) : true))
        .filter((l) => (to ? new Date(l.requestedAt) <= new Date(`${to}T23:59:59`) : true))
        .sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
      return delay(result);
    },

    async overdue() {
      const result = db.loans
        .map(loanDto)
        .filter((l) => l.status === 'OVERDUE')
        .sort((a, b) => b.daysLate - a.daysLate);
      return delay(result);
    },

    async allocationsByProject() {
      const result = db.projects.map((project) => {
        const devices = db.devices.filter((d) => d.projectId === project.id);
        const loans = db.loans.map(loanDto).filter((l) => l.projectId === project.id);
        return {
          projectId: project.id,
          projectName: project.name,
          labName: (findLab(project.labId) || {}).name,
          status: project.status,
          devices: devices.length,
          activeLoans: loans.filter((l) => l.status === 'APPROVED' || l.status === 'OVERDUE').length,
          overdueLoans: loans.filter((l) => l.status === 'OVERDUE').length,
          totalLoans: loans.length,
        };
      });
      return delay(result);
    },
  },
};

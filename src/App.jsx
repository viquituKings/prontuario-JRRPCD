import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import StatsCards from './components/StatsCards';
import PatientList from './components/PatientList';
import PatientFormModal from './components/PatientFormModal';
import PatientDetailsModal from './components/PatientDetailsModal';
import EvolutionModal from './components/EvolutionModal';
import PrintProntuario from './components/PrintProntuario';
import FirebaseConfigModal from './components/FirebaseConfigModal';
import LoginScreen from './components/LoginScreen';
import ChangePasswordModal from './components/ChangePasswordModal';
import UserManagementModal from './components/UserManagementModal';
import AuditLogsModal from './components/AuditLogsModal';
import ArquivoMortoModal from './components/ArquivoMortoModal';
import MoverParaArquivoMortoModal from './components/MoverParaArquivoMortoModal';
import {
  subscribePacientes,
  salvarPaciente,
  excluirPaciente,
  adicionarEvolucao,
  excluirEvolucao,
  subscribeArquivoMorto,
  moverPacienteParaArquivoMorto,
  salvarArquivoMorto,
  restaurarPacienteDoArquivoMorto,
  importarArquivoMortoLote,
  isFirebaseActive
} from './firebase';
import {
  getUsuarioLogado,
  logout,
  inicializarUsuarios
} from './auth';
import { agruparPacientesPorPessoa } from './types';

const STORAGE_KEY_THEME = 'jrrpcd_theme';

function getInitialDarkMode() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_THEME);
    const isDark = saved === 'dark';
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', isDark);
    }
    return isDark;
  } catch {
    return false;
  }
}

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(getInitialDarkMode);
  const [currentUser, setCurrentUser] = useState(() => getUsuarioLogado());
  const [pacientes, setPacientes] = useState([]);
  const [isFirebase, setIsFirebase] = useState(isFirebaseActive());
  const [isLoading, setIsLoading] = useState(true);

  // Estados de Modais
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [patientToEdit, setPatientToEdit] = useState(null);

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [evolutionTargetPatient, setEvolutionTargetPatient] = useState(null);
  const [printPatient, setPrintPatient] = useState(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Modais de Controle de Acesso e Auditoria
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [isAuditLogsOpen, setIsAuditLogsOpen] = useState(false);

  // Gestão de Arquivo Morto
  const [arquivoMorto, setArquivoMorto] = useState([]);
  const [isArquivoMortoOpen, setIsArquivoMortoOpen] = useState(false);
  const [patientToArchive, setPatientToArchive] = useState(null);
  const [archivedPatientToView, setArchivedPatientToView] = useState(null);

  // Filtro ativo vindo dos Cards de Estatísticas (Serviços)
  const [activeServicoFilter, setActiveServicoFilter] = useState('todos');

  // Sincroniza e persiste o tema escuro/claro no DOM e localStorage
  useEffect(() => {
    try {
      document.documentElement.classList.toggle('dark', isDarkMode);
      localStorage.setItem(STORAGE_KEY_THEME, isDarkMode ? 'dark' : 'light');
    } catch (e) {
      console.warn('Erro ao salvar preferência de tema:', e);
    }
  }, [isDarkMode]);

  // Inicializa a coleção de usuários garantindo que mariacecilia / 12345678 esteja disponível
  useEffect(() => {
    try {
      inicializarUsuarios().catch((err) => {
        console.warn('Aviso não-fatal ao inicializar usuários padrão:', err);
      });
    } catch (e) {
      console.warn('Erro ao disparar inicialização:', e);
    }
  }, []);

  // Assinatura em tempo real dos pacientes (apenas se autenticado)
  useEffect(() => {
    if (!currentUser) return;

    setIsLoading(true);
    const unsubscribe = subscribePacientes((data) => {
      setPacientes(data);
      setIsLoading(false);
      setIsFirebase(isFirebaseActive());

      // Se houver um paciente selecionado, mantém os dados unificados atualizados na tela
      setSelectedPatient((current) => {
        if (!current) return null;
        const unificados = agruparPacientesPorPessoa(data);
        return (
          unificados.find(
            (p) =>
              (current.chaveIdentificacao && p.chaveIdentificacao === current.chaveIdentificacao) ||
              p.id === current.id ||
              (Array.isArray(p.ids) && p.ids.includes(current.id))
          ) || null
        );
      });
    }, (error) => {
      console.warn('Erro na assinatura do Firestore:', error);
      setIsLoading(false);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [currentUser, isFirebase]);

  // Assinatura em tempo real do Arquivo Morto
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeArquivoMorto(
      (data) => {
        setArquivoMorto(data);
      },
      (error) => {
        console.warn('Erro na assinatura do Arquivo Morto:', error);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [currentUser, isFirebase]);

  // Se não estiver logado, exibe tela de login
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={(u) => setCurrentUser(u)} />;
  }

  // Ações de Logout
  const handleLogout = async () => {
    await logout();
    setCurrentUser(null);
  };

  // Ações de Paciente com Carimbo de Auditoria
  const handleNewPatient = () => {
    setPatientToEdit(null);
    setIsFormOpen(true);
  };

  const handleEditPatient = (patient) => {
    setPatientToEdit(patient);
    setIsFormOpen(true);
  };

  const handleSavePatient = async (patientData) => {
    if (Array.isArray(patientData)) {
      for (const item of patientData) {
        await salvarPaciente(item, currentUser);
      }
    } else {
      await salvarPaciente(patientData, currentUser);
    }
  };

  const handleDeletePatient = async (patientIdOrIds) => {
    const ids = Array.isArray(patientIdOrIds) ? patientIdOrIds : [patientIdOrIds];
    for (const id of ids) {
      const paciente = pacientes.find((p) => p.id === id);
      await excluirPaciente(id, paciente?.nome || '', currentUser);
    }
    if (selectedPatient && (ids.includes(selectedPatient.id) || (selectedPatient.ids && selectedPatient.ids.some((id) => ids.includes(id))))) {
      setSelectedPatient(null);
    }
  };

  // Ações de Prontuário / Evolução com Carimbo de Auditoria
  const handleOpenEvolutionModal = (patient) => {
    setEvolutionTargetPatient(patient);
  };

  const handleSaveEvolution = async (patientId, evolucaoData) => {
    const paciente = pacientes.find((p) => p.id === patientId);
    await adicionarEvolucao(patientId, evolucaoData, paciente?.nome || '', currentUser);
  };

  const handleDeleteEvolution = async (patientId, evolucaoId, pacienteNome = '') => {
    const nome = pacienteNome || (pacientes.find((p) => p.id === patientId)?.nome || '');
    await excluirEvolucao(patientId, evolucaoId, nome, currentUser);
  };

  // Importação de Backup com Carimbo
  const handleImportPacientes = async (importedList) => {
    for (const p of importedList) {
      await salvarPaciente(p, currentUser);
    }
    alert(`${importedList.length} prontuários importados com sucesso!`);
  };

  // Ações de Arquivo Morto com Carimbo de Auditoria
  const handleConfirmArchivePatient = async (patient, dadosArquivo) => {
    await moverPacienteParaArquivoMorto(patient, dadosArquivo, currentUser);
    if (
      selectedPatient &&
      (selectedPatient.id === patient.id ||
        (selectedPatient.ids && patient.ids && selectedPatient.ids.some((id) => patient.ids.includes(id))))
    ) {
      setSelectedPatient(null);
    }
  };

  const handleSaveManualArquivoMorto = async (registroData) => {
    await salvarArquivoMorto(registroData, currentUser);
  };

  const handleRestoreFromArquivoMorto = async (arquivoItem) => {
    await restaurarPacienteDoArquivoMorto(arquivoItem, currentUser);
  };

  const handleImportArquivoMortoCsv = async (registros) => {
    return await importarArquivoMortoLote(registros, currentUser);
  };

  const handleViewArchivedHistory = (arquivoItem) => {
    const unificado = arquivoItem?.historico?.pacienteUnificado || {};
    const pacienteParaExibir = {
      ...unificado,
      ...arquivoItem,
      observacoes: arquivoItem.observacoes || '',
      prontuarioObservacoes: arquivoItem.observacoesCadastro || unificado.observacoes || '',
      evolucoes: arquivoItem.evolucoes || unificado.evolucoes || [],
      opm_list: arquivoItem.opm_list || unificado.opm_list || [],
      cid_list: arquivoItem.cid_list || unificado.cid_list || [],
      servicos: arquivoItem.servicos || unificado.servicos || []
    };
    setArchivedPatientToView(pacienteParaExibir);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">

      {/* Cabeçalho */}
      <Header
        isFirebase={isFirebase}
        pacientes={pacientes}
        onNewPatient={handleNewPatient}
        onOpenConfig={() => setIsConfigOpen(true)}
        onImportPacientes={handleImportPacientes}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
        onOpenUserManagement={() => setIsUserManagementOpen(true)}
        onOpenAuditLogs={() => setIsAuditLogsOpen(true)}
        onOpenArquivoMorto={() => setIsArquivoMortoOpen(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
      />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-[1840px] w-full mx-auto px-3 sm:px-5 lg:px-8 xl:px-10 py-5 sm:py-6">

        {/* Banner de Aviso de Modo Local (se Firebase não estiver ativo) */}
        {!isFirebase && (
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <h2 className="text-sm font-bold text-blue-900">
                  Prontuário JRRPCD pronto para uso com Firebase Hosting & Firestore
                </h2>
                <p className="text-xs text-blue-700 mt-0.5">
                  Você está utilizando o modo de demonstração/armazenamento local. Conecte seu projeto Firebase para sincronizar em tempo real e hospedar na nuvem.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsConfigOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm whitespace-nowrap transition"
            >
              Conectar Firebase
            </button>
          </div>
        )}

        {/* Cards de Métricas e Indicadores Rápidos */}
        <StatsCards
          pacientes={pacientes}
          activeFilter={activeServicoFilter}
          onSelectFilter={(filter) => {
            setActiveServicoFilter(activeServicoFilter === filter ? 'todos' : filter);
          }}
        />

        {/* Tabela e Listagem de Pacientes */}
        <PatientList
          pacientes={pacientes}
          onSelectPatient={(p) => setSelectedPatient(p)}
          onEditPatient={handleEditPatient}
          onDeletePatient={handleDeletePatient}
          onArchivePatient={(p) => setPatientToArchive(p)}
          onOpenEvolutionModal={handleOpenEvolutionModal}
          onPrintPatient={(p) => setPrintPatient(p)}
          activeServicoFilter={activeServicoFilter}
          onSelectServicoFilter={setActiveServicoFilter}
        />

      </main>

      {/* Modais de Paciente e Prontuário */}
      <PatientFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSavePatient}
        patientToEdit={patientToEdit}
        existingPatients={pacientes}
      />

      <PatientDetailsModal
        isOpen={!!selectedPatient}
        onClose={() => setSelectedPatient(null)}
        patient={selectedPatient}
        onEditPatient={handleEditPatient}
        onArchivePatient={(p) => setPatientToArchive(p)}
        onOpenEvolutionModal={handleOpenEvolutionModal}
        onDeleteEvolution={handleDeleteEvolution}
        onPrintPatient={(p) => setPrintPatient(p)}
      />

      <PatientDetailsModal
        isOpen={!!archivedPatientToView}
        onClose={() => setArchivedPatientToView(null)}
        patient={archivedPatientToView}
        onPrintPatient={(p) => setPrintPatient(p)}
        isArchived={true}
      />

      <EvolutionModal
        isOpen={!!evolutionTargetPatient}
        onClose={() => setEvolutionTargetPatient(null)}
        onSave={handleSaveEvolution}
        patient={evolutionTargetPatient}
      />

      {printPatient && (
        <PrintProntuario
          patient={printPatient}
          onClose={() => setPrintPatient(null)}
        />
      )}

      <FirebaseConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onConfigSaved={() => setIsFirebase(isFirebaseActive())}
      />

      {/* Modais de Gestão de Acesso e Auditoria */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        currentUser={currentUser}
      />

      <UserManagementModal
        isOpen={isUserManagementOpen}
        onClose={() => setIsUserManagementOpen(false)}
        currentUser={currentUser}
      />

      <AuditLogsModal
        isOpen={isAuditLogsOpen}
        onClose={() => setIsAuditLogsOpen(false)}
      />

      {/* Modais de Arquivo Morto */}
      <MoverParaArquivoMortoModal
        isOpen={!!patientToArchive}
        onClose={() => setPatientToArchive(null)}
        patient={patientToArchive}
        onConfirm={handleConfirmArchivePatient}
      />

      <ArquivoMortoModal
        isOpen={isArquivoMortoOpen}
        onClose={() => setIsArquivoMortoOpen(false)}
        arquivoMorto={arquivoMorto}
        onSaveManual={handleSaveManualArquivoMorto}
        onRestore={handleRestoreFromArquivoMorto}
        onImportCsv={handleImportArquivoMortoCsv}
        onViewHistory={handleViewArchivedHistory}
      />

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import StatsCards from './components/StatsCards';
import PatientList from './components/PatientList';
import PatientFormModal from './components/PatientFormModal';
import PatientDetailsModal from './components/PatientDetailsModal';
import EvolutionModal from './components/EvolutionModal';
import PrintProntuario from './components/PrintProntuario';
import FirebaseConfigModal from './components/FirebaseConfigModal';
import { 
  subscribePacientes, 
  salvarPaciente, 
  excluirPaciente, 
  adicionarEvolucao, 
  excluirEvolucao, 
  isFirebaseActive 
} from './firebase';

export default function App() {
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

  // Filtro ativo vindo dos Cards de Estatísticas (Serviços)
  const [activeServicoFilter, setActiveServicoFilter] = useState('todos');

  // Assinatura em tempo real dos pacientes
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribePacientes((data) => {
      setPacientes(data);
      setIsLoading(false);
      setIsFirebase(isFirebaseActive());

      // Se houver um paciente selecionado, atualiza seus dados na tela
      setSelectedPatient((current) => {
        if (!current) return null;
        return data.find((p) => p.id === current.id) || null;
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
  }, [isFirebase]);

  // Ações de Paciente
  const handleNewPatient = () => {
    setPatientToEdit(null);
    setIsFormOpen(true);
  };

  const handleEditPatient = (patient) => {
    setPatientToEdit(patient);
    setIsFormOpen(true);
  };

  const handleSavePatient = async (patientData) => {
    await salvarPaciente(patientData);
  };

  const handleDeletePatient = async (patientId) => {
    await excluirPaciente(patientId);
    if (selectedPatient?.id === patientId) {
      setSelectedPatient(null);
    }
  };

  // Ações de Evolução
  const handleOpenEvolutionModal = (patient) => {
    setEvolutionTargetPatient(patient);
  };

  const handleSaveEvolution = async (patientId, evolucaoData) => {
    await adicionarEvolucao(patientId, evolucaoData);
  };

  const handleDeleteEvolution = async (patientId, evolucaoId) => {
    await excluirEvolucao(patientId, evolucaoId);
  };

  // Importação de Backup
  const handleImportPacientes = async (importedList) => {
    for (const p of importedList) {
      await salvarPaciente(p);
    }
    alert(`${importedList.length} prontuários importados com sucesso!`);
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
      />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
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
          onOpenEvolutionModal={handleOpenEvolutionModal}
          onPrintPatient={(p) => setPrintPatient(p)}
          activeServicoFilter={activeServicoFilter}
          onSelectServicoFilter={setActiveServicoFilter}
        />

      </main>

      {/* Modais e Painéis */}
      <PatientFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSavePatient}
        patientToEdit={patientToEdit}
      />

      <PatientDetailsModal
        isOpen={!!selectedPatient}
        onClose={() => setSelectedPatient(null)}
        patient={selectedPatient}
        onEditPatient={handleEditPatient}
        onOpenEvolutionModal={handleOpenEvolutionModal}
        onDeleteEvolution={handleDeleteEvolution}
        onPrintPatient={(p) => setPrintPatient(p)}
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

    </div>
  );
}


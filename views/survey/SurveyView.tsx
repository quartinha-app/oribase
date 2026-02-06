
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDiagnosticInsights } from '../../services/geminiService';

import MainLayout from '../../layouts/MainLayout';

const SurveyView: React.FC = () => {
  const { profile } = useParams<{ profile: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    tempo: '',
    formalizacao: 3,
    areas: [] as string[]
  });

  const handleNext = async () => {
    if (step < 2) {
      setStep(s => s + 1);
    } else {
      setIsLoading(true);
      // Simulate Gemini integration during submission
      await getDiagnosticInsights(profile || 'geral', formData);
      setIsLoading(false);
      navigate('/success');
    }
  };

  return (
    <MainLayout
      navbarProps={{
        variant: 'app',
        subtitle: 'Diagnóstico de Gestão'
      }}
    >
      <div className="max-w-4xl mx-auto w-full px-6 py-12">
        <div className="flex justify-between items-end mb-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-accent mb-1">Passo {step} de 2</p>
            <h1 className="text-4xl font-serif font-bold text-text-main">Diagnóstico de Gestão</h1>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-accent">{step === 1 ? '50%' : '100%'} concluído</p>
            <div className="h-2 w-48 bg-gray-200 rounded-full mt-2">
              <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: step === 1 ? '50%' : '100%' }}></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10 space-y-8">
          {step === 1 ? (
            <>
              <div className="space-y-4">
                <label className="block text-lg font-bold text-text-main">Nome do Terreiro / Comunidade</label>
                <input
                  type="text"
                  className="w-full h-14 px-4 rounded-xl border-gray-200 bg-background-light focus:border-accent focus:ring-accent"
                  placeholder="Digite o nome oficial..."
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
              </div>
              <div className="space-y-4">
                <label className="block text-lg font-bold text-text-main">Tempo de existência</label>
                <select
                  className="w-full h-14 px-4 rounded-xl border-gray-200 bg-background-light focus:border-accent focus:ring-accent"
                  value={formData.tempo}
                  onChange={(e) => setFormData({ ...formData, tempo: e.target.value })}
                >
                  <option value="">Selecione o período</option>
                  <option value="1">Menos de 1 ano</option>
                  <option value="5">Entre 1 e 5 anos</option>
                  <option value="10">Entre 5 e 20 anos</option>
                  <option value="50">Mais de 50 anos</option>
                </select>
              </div>
            </>
          ) : (
            <div className="space-y-8 text-center py-10">
              <span className="material-symbols-outlined text-6xl text-accent animate-bounce">verified</span>
              <h2 className="text-2xl font-bold">Quase lá!</h2>
              <p className="text-text-secondary max-w-md mx-auto">Você completou as perguntas básicas para o perfil de {profile}. Deseja enviar seus dados para processamento?</p>
            </div>
          )}

          <div className="flex justify-between pt-6">
            <button
              onClick={() => step > 1 ? setStep(1) : navigate('/select-profile')}
              className="px-8 py-3 rounded-lg font-bold text-text-secondary hover:bg-gray-50 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined">arrow_back</span> Voltar
            </button>
            <button
              onClick={handleNext}
              disabled={isLoading}
              className="px-10 py-3 rounded-lg bg-primary text-white font-bold shadow-lg hover:bg-primary-dark transition-all flex items-center gap-2"
            >
              {isLoading ? 'Enviando...' : (step === 2 ? 'Finalizar' : 'Próximo Passo')}
              {!isLoading && <span className="material-symbols-outlined">arrow_forward</span>}
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default SurveyView;

import React, { useState } from 'react';
import { supabase } from '../../services/supabase';

const CampaignResults: React.FC = () => {
    const [code, setCode] = useState('');
    const [result, setResult] = useState<null | { isWinner: boolean; rewardTitle?: string; position?: string }>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const checkCode = async () => {
        if (!code.trim()) {
            setError('Digite um código válido.');
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);

        const { data, error: fetchError } = await supabase
            .from('reward_redemptions')
            .select(`
                is_winner,
                reward:campaign_rewards(title),
                link:campaign_reward_links(draw_position)
            `)
            .eq('redemption_code', code.trim().toUpperCase())
            .single();

        setLoading(false);

        if (fetchError || !data) {
            setError('Código não encontrado. Verifique e tente novamente.');
            return;
        }

        setResult({
            isWinner: data.is_winner || false,
            rewardTitle: (data.reward as any)?.title,
            position: (data.link as any)?.draw_position
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-6">
            <div className="max-w-md w-full">
                <div className="text-center mb-10">
                    <div className="size-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-4xl text-primary">search</span>
                    </div>
                    <h1 className="text-2xl font-black text-text-main uppercase tracking-tight mb-2">Conferir Resultado</h1>
                    <p className="text-sm text-gray-500 font-bold">Digite seu código de participação para verificar se você foi sorteado.</p>
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-xl shadow-gray-200/50">
                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">Seu Código de Sorteio</label>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            placeholder="Ex: AXE-7F2D"
                            className="flex-1 border-gray-100 bg-gray-50/50 p-5 rounded-2xl focus:ring-4 ring-primary/5 outline-none transition-all font-black text-text-main text-lg tracking-widest uppercase text-center"
                        />
                    </div>

                    {error && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-2xl text-center">
                            <p className="text-xs font-bold text-red-500 uppercase tracking-wider">{error}</p>
                        </div>
                    )}

                    <button
                        onClick={checkCode}
                        disabled={loading}
                        className="w-full mt-6 bg-primary text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
                    >
                        {loading ? 'Verificando...' : 'Verificar Código'}
                    </button>
                </div>

                {result && (
                    <div className={`mt-8 p-8 rounded-3xl border-2 text-center ${result.isWinner ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                        {result.isWinner ? (
                            <>
                                <div className="text-5xl mb-4">🎉</div>
                                <h2 className="text-xl font-black text-green-600 uppercase tracking-tight mb-2">Parabéns, você ganhou!</h2>
                                <p className="text-sm font-bold text-green-500 mb-4">{result.rewardTitle}</p>
                                {result.position && (
                                    <span className="inline-block px-4 py-2 bg-green-100 text-green-600 rounded-full text-xs font-black uppercase tracking-widest">
                                        {result.position}
                                    </span>
                                )}
                                <p className="text-xs text-gray-500 font-bold mt-6">
                                    Entraremos em contato em breve pelos dados informados no momento da participação.
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="text-5xl mb-4">😔</div>
                                <h2 className="text-xl font-black text-gray-500 uppercase tracking-tight mb-2">Não foi dessa vez</h2>
                                <p className="text-sm font-bold text-gray-400">
                                    Seu código é válido, mas não foi sorteado. Continue participando das próximas campanhas!
                                </p>
                            </>
                        )}
                    </div>
                )}
            </div>

            <p className="mt-10 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                OríBase
            </p>
        </div>
    );
};

export default CampaignResults;

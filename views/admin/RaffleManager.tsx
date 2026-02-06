import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import { supabase } from '../../services/supabase';
import { Campaign, RewardRedemption, CampaignReward } from '../../types';
import { getCampaignRewards } from '../../services/admin';

interface ParticipantEntry extends RewardRedemption {
    display_name?: string;
}

const RaffleManager: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [rewards, setRewards] = useState<CampaignReward[]>([]);
    const [participants, setParticipants] = useState<ParticipantEntry[]>([]);
    const [uniqueParticipants, setUniqueParticipants] = useState<ParticipantEntry[]>([]);
    const [duplicatesRemoved, setDuplicatesRemoved] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selectedRewardId, setSelectedRewardId] = useState<string>('');
    const [winner, setWinner] = useState<ParticipantEntry | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawnWinners, setDrawnWinners] = useState<string[]>([]);

    useEffect(() => {
        if (id) loadData();
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        // Fetch campaign
        const { data: campaignData } = await supabase
            .from('campaigns')
            .select('*')
            .eq('id', id)
            .single();

        if (campaignData) {
            setCampaign(campaignData as Campaign);
        }

        // Fetch linked rewards (only draw type)
        const linkedRewards = await getCampaignRewards(id!);
        const drawRewards = linkedRewards.filter(r => r.type === 'draw');
        setRewards(drawRewards as any);

        // Fetch all redemptions for this campaign
        const { data: redemptions } = await supabase
            .from('reward_redemptions')
            .select('*')
            .eq('campaign_id', id);

        if (redemptions) {
            setParticipants(redemptions as ParticipantEntry[]);

            // Deduplicate by user_id, fingerprint_id, contact_email, contact_whatsapp
            const seen = new Map<string, ParticipantEntry>();
            const duplicatesIds: string[] = [];

            for (const r of redemptions as ParticipantEntry[]) {
                const keys = [
                    r.profile_id,
                    r.fingerprint_id,
                    r.contact_email,
                    r.contact_whatsapp
                ].filter(Boolean);

                let isDuplicate = false;
                for (const key of keys) {
                    if (seen.has(key!)) {
                        isDuplicate = true;
                        duplicatesIds.push(r.id);
                        break;
                    }
                }

                if (!isDuplicate) {
                    for (const key of keys) {
                        seen.set(key!, r);
                    }
                }
            }

            const unique = (redemptions as ParticipantEntry[]).filter(r => !duplicatesIds.includes(r.id));
            setUniqueParticipants(unique);
            setDuplicatesRemoved(duplicatesIds.length);

            // Get already drawn winners
            const winners = (redemptions as ParticipantEntry[]).filter(r => r.is_winner).map(r => r.id);
            setDrawnWinners(winners);
        }

        setLoading(false);
    };

    const performDraw = async () => {
        if (!selectedRewardId) {
            alert('Selecione um prêmio para sortear.');
            return;
        }

        // Filter participants for the selected reward, excluding already drawn winners
        const eligibleParticipants = uniqueParticipants.filter(
            p => p.reward_id === selectedRewardId && !drawnWinners.includes(p.id)
        );

        if (eligibleParticipants.length === 0) {
            alert('Não há participantes elegíveis para este sorteio.');
            return;
        }

        setIsDrawing(true);
        setWinner(null);

        // Animation effect
        let iterations = 0;
        const maxIterations = 20;
        const interval = setInterval(() => {
            const randomIndex = Math.floor(Math.random() * eligibleParticipants.length);
            setWinner(eligibleParticipants[randomIndex]);
            iterations++;
            if (iterations >= maxIterations) {
                clearInterval(interval);
                // Final winner
                const finalWinnerIndex = Math.floor(Math.random() * eligibleParticipants.length);
                const finalWinner = eligibleParticipants[finalWinnerIndex];
                setWinner(finalWinner);
                setDrawnWinners(prev => [...prev, finalWinner.id]);

                // Save winner to database
                supabase
                    .from('reward_redemptions')
                    .update({ is_winner: true })
                    .eq('id', finalWinner.id)
                    .then(() => {
                        setIsDrawing(false);
                    });
            }
        }, 100);
    };

    const getDisplayName = (p: ParticipantEntry) => {
        if (p.contact_email) {
            const [name] = p.contact_email.split('@');
            return name.charAt(0).toUpperCase() + '***' + name.slice(-1);
        }
        if (p.contact_whatsapp) {
            return p.contact_whatsapp.slice(0, 4) + '****' + p.contact_whatsapp.slice(-2);
        }
        return p.redemption_code || 'Participante';
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="min-h-screen flex items-center justify-center">
                    <p className="text-gray-400 font-bold uppercase tracking-widest animate-pulse">Carregando sorteador...</p>
                </div>
            </AdminLayout>
        );
    }

    const selectedReward = rewards.find(r => r.id === selectedRewardId);
    const eligibleCount = uniqueParticipants.filter(
        p => p.reward_id === selectedRewardId && !drawnWinners.includes(p.id)
    ).length;

    return (
        <AdminLayout>
            <div className="p-6 lg:p-10 max-w-5xl mx-auto">
                <div className="flex items-center gap-4 mb-10">
                    <button
                        onClick={() => navigate('/admin/campaigns')}
                        className="size-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:text-primary hover:bg-primary/5 transition-all"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-text-main uppercase tracking-tight">Sorteador</h1>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{campaign?.title}</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                        <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Total de Participações</div>
                        <div className="text-3xl font-black text-text-main">{participants.length}</div>
                    </div>
                    <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                        <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Participantes Únicos</div>
                        <div className="text-3xl font-black text-primary">{uniqueParticipants.length}</div>
                    </div>
                    <div className="bg-amber-50 rounded-3xl border border-amber-100 p-6 shadow-sm">
                        <div className="text-[10px] font-black uppercase text-amber-600 tracking-widest mb-2">Duplicatas Removidas</div>
                        <div className="text-3xl font-black text-amber-600">{duplicatesRemoved}</div>
                    </div>
                </div>

                {/* Reward Selector */}
                <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-xl shadow-gray-200/50 mb-10">
                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4">Selecione o Prêmio para Sortear</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {rewards.map(r => (
                            <div
                                key={r.id}
                                onClick={() => setSelectedRewardId(r.id)}
                                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${selectedRewardId === r.id ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'}`}
                            >
                                <div className="size-12 rounded-2xl bg-purple-50 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-purple-500">redeem</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-black text-text-main uppercase tracking-tight text-sm truncate">{r.title}</div>
                                    {r.draw_position && (
                                        <div className="text-[10px] font-bold text-primary uppercase tracking-widest">{r.draw_position}</div>
                                    )}
                                </div>
                                <div className={`size-5 rounded-full border-2 flex items-center justify-center ${selectedRewardId === r.id ? 'bg-primary border-primary' : 'border-gray-200'}`}>
                                    {selectedRewardId === r.id && <span className="material-symbols-outlined text-white text-[12px]">check</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Draw Area */}
                {selectedRewardId && (
                    <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl border border-primary/20 p-10 text-center">
                        <div className="text-[10px] font-black uppercase text-primary/60 tracking-widest mb-4">
                            {selectedReward?.title} {selectedReward?.draw_position && `- ${selectedReward.draw_position}`}
                        </div>
                        <div className="text-xs font-bold text-gray-500 mb-8">
                            {eligibleCount} participante(s) elegível(is)
                        </div>

                        {winner && (
                            <div className={`mb-8 p-8 bg-white rounded-3xl shadow-2xl shadow-primary/20 inline-block transition-all ${isDrawing ? 'animate-pulse scale-95' : 'scale-100'}`}>
                                <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">
                                    {isDrawing ? 'Sorteando...' : '🎉 Ganhador(a)'}
                                </div>
                                <div className="text-2xl font-black text-primary uppercase tracking-tight">
                                    {getDisplayName(winner)}
                                </div>
                                <div className="text-xs font-bold text-gray-400 mt-2">
                                    Código: {winner.redemption_code || 'N/A'}
                                </div>
                            </div>
                        )}

                        <button
                            onClick={performDraw}
                            disabled={isDrawing || eligibleCount === 0}
                            className="bg-primary text-white px-12 py-5 rounded-3xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isDrawing ? 'Sorteando...' : 'Realizar Sorteio'}
                        </button>
                    </div>
                )}

                {/* Already Drawn Winners */}
                {drawnWinners.length > 0 && (
                    <div className="mt-10 bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                        <h3 className="text-sm font-black uppercase text-gray-400 tracking-widest mb-6">Ganhadores Sorteados</h3>
                        <div className="space-y-3">
                            {uniqueParticipants.filter(p => drawnWinners.includes(p.id)).map(p => {
                                const reward = rewards.find(r => r.id === p.reward_id);
                                return (
                                    <div key={p.id} className="flex items-center justify-between p-4 bg-green-50 rounded-2xl border border-green-100">
                                        <div className="flex items-center gap-4">
                                            <span className="material-symbols-outlined text-green-500">emoji_events</span>
                                            <div>
                                                <div className="font-bold text-text-main">{getDisplayName(p)}</div>
                                                <div className="text-[10px] font-bold text-gray-400 uppercase">Código: {p.redemption_code || 'N/A'}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-black text-green-600 uppercase">{reward?.title}</div>
                                            {reward?.draw_position && (
                                                <div className="text-[10px] font-bold text-green-500">{reward.draw_position}</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default RaffleManager;

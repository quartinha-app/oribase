import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../services/supabase';
import { Campaign, SurveySchema, SurveySection, CampaignReward } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import MainLayout from '../../layouts/MainLayout';
import { getFingerprint } from '../../services/fingerprint';
import { recordCampaignVisit } from '../../services/campaign';
import { getCampaignRewards } from '../../services/admin';

const SurveyRenderer: React.FC = () => {
    const params = useParams<any>();
    const slug = params.slug || params.campaignId;
    const navigate = useNavigate();
    const { user, profile } = useAuth();

    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [hasConsented, setHasConsented] = useState(false);
    const [hasResponded, setHasResponded] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedRole, setSelectedRole] = useState<string | null>(null);
    const [answers, setAnswers] = useState<any>({});
    const [fingerprint, setFingerprint] = useState<string>('');
    const [rewards, setRewards] = useState<CampaignReward[]>([]);
    const [redemptionSuccess, setRedemptionSuccess] = useState<string[]>([]);
    const [submittingRedemption, setSubmittingRedemption] = useState<string | null>(null);
    const [showRewards, setShowRewards] = useState(false);
    const [showContactForm, setShowContactForm] = useState<string | null>(null);
    const [redemptionCodes, setRedemptionCodes] = useState<{ [key: string]: string }>({});
    const [luckyNumbers, setLuckyNumbers] = useState<{ [key: string]: string }>({});
    const [contactFormData, setContactFormData] = useState({ whatsapp: '', email: '' });
    const [sensitiveConsent, setSensitiveConsent] = useState(false);
    const [redeemAllSuccess, setRedeemAllSuccess] = useState(false);

    const formatWhatsApp = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        const truncated = numbers.slice(0, 11);
        if (truncated.length <= 2) return truncated.length > 0 ? `(${truncated}` : '';
        if (truncated.length <= 6) return `(${truncated.slice(0, 2)}) ${truncated.slice(2)}`;
        if (truncated.length <= 10) return `(${truncated.slice(0, 2)}) ${truncated.slice(2, 6)}-${truncated.slice(6)}`;
        return `(${truncated.slice(0, 2)}) ${truncated.slice(2, 7)}-${truncated.slice(7)}`;
    };

    const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatWhatsApp(e.target.value);
        setContactFormData(prev => ({ ...prev, whatsapp: formatted }));
    };


    // Load Campaign & Check Duplicates
    useEffect(() => {
        if (slug) fetchData(slug);
        else setLoading(false);
    }, [slug, user]);

    const fetchData = async (slug: string) => {
        setLoading(true);
        console.log('Fetching campaign for slug:', slug);
        try {
            // 1. Get Campaign
            const { data: campaignData, error } = await supabase
                .from('campaigns')
                .select('*')
                .eq('slug', slug)
                .single();

            if (error || !campaignData) {
                console.error('Campaign fetch error:', error);
                setErrorMsg('Campanha não encontrada ou link inválido.');
                return;
            }
            const camp = campaignData as Campaign;
            setCampaign(camp);

            // 2. Get Fingerprint (with timeout safety)
            const fpPromise = getFingerprint().catch(err => {
                console.warn('Fingerprint failed:', err);
                return 'fp-fallback-' + Math.random().toString(36).substr(2, 9);
            });
            const fpTimeout = new Promise<string>((resolve) => setTimeout(() => resolve('anon-' + Math.random().toString(36).substr(2, 9)), 2000));
            const fp = await Promise.race([fpPromise, fpTimeout]);
            setFingerprint(fp);

            // 3. Record Visit (Public analytics)
            recordCampaignVisit(camp.id, fp, user?.id);

            // 4. Check for existing response
            const { data: existing } = await supabase
                .from('survey_responses')
                .select('id')
                .eq('campaign_id', camp.id)
                .or(`fingerprint_id.eq.${fp}${user ? `,user_id.eq.${user.id}` : ''}`)
                .limit(1);

            if (existing && existing.length > 0) {
                setHasResponded(true);
            }

            // 5. Fetch Campaign Rewards
            const campRewards = await getCampaignRewards(camp.id);
            setRewards(campRewards);

            // 6. Fetch Existing Redemptions
            const { data: redemptions } = await supabase
                .from('reward_redemptions')
                .select('*')
                .eq('campaign_id', camp.id)
                .or(`fingerprint_id.eq.${fp}${user ? `,profile_id.eq.${user.id}` : ''}`);

            if (redemptions && redemptions.length > 0) {
                const results: { [key: string]: string } = {};
                const luckyNums: { [key: string]: string } = {};
                const successIds: string[] = [];

                // Single Entry Logic: extract the first valid lucky number/code found
                // Since we now enforce single entry, we just need to find the one active redemption
                let singleLuckyNumber: string | undefined;
                let singleRedemptionCode: string | undefined;

                redemptions.forEach(red => {
                    successIds.push(red.reward_id); // Keep tracking all rewards as "redeemed" for UI state
                    if (red.lucky_number && !singleLuckyNumber) singleLuckyNumber = String(red.lucky_number).padStart(5, '0');
                    if (red.redemption_code && !singleRedemptionCode) singleRedemptionCode = red.redemption_code;
                });

                // Propagate the single code/number to all rewards for display compatibility
                if (singleLuckyNumber) {
                    // Check if there are draw rewards, if so map them
                    const drawRewards = campRewards.filter(r => r.type === 'draw');
                    drawRewards.forEach(r => luckyNums[r.id] = singleLuckyNumber!);
                }
                if (singleRedemptionCode) {
                    const pdfRewards = campRewards.filter(r => r.type === 'pdf');
                    pdfRewards.forEach(r => results[r.id] = singleRedemptionCode!);
                }

                setRedemptionSuccess(successIds);
                setRedemptionCodes(results);
                setLuckyNumbers(luckyNums);

                // If they already have redemptions, we can potentially show them automatically
                // but let's wait for user to click a button if they already responded.
                if (existing && existing.length > 0) {
                    setRedeemAllSuccess(true);
                }
            }
        } catch (e) {
            console.error('Error in fetchData:', e);
        } finally {
            setLoading(false);
        }
    };

    // 1. Determine Effective Role and Test Mode
    const isTest = !!profile; // Logged in users are always in test mode
    const systemRoles = ['admin', 'pesquisador'];

    // Effective role is either the profile role or a manually selected role
    const effectiveRole = selectedRole || profile?.role;

    // For admins/pesquisadores, we force a manual role selection for testing purposes
    const isRoleSelected = !!selectedRole || (!!profile && !systemRoles.includes(profile.role));

    // Check if campaign is within valid date range
    const isCampaignOpen = React.useMemo(() => {
        if (!campaign) return false;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Check start date
        if (campaign.start_date) {
            const startDate = new Date(campaign.start_date);
            if (today < startDate) return false;
        }

        // Check end date
        if (campaign.end_date) {
            const endDate = new Date(campaign.end_date);
            if (today > endDate) return false;
        }

        // Check status
        if (campaign.status === 'ended') return false;
        if (campaign.status === 'draft' && !isTest) return false;

        return true;
    }, [campaign, isTest]);

    // 2. Filter Sections and Flatten Questions
    const activeQuestions = React.useMemo(() => {
        if (!campaign?.form_schema?.sections) return [];

        const filteredSections = campaign.form_schema.sections.filter(s => {
            if (!s.target_roles || s.target_roles.length === 0) return true;
            if (!effectiveRole) return false; // Wait for role selection
            if (effectiveRole === 'admin') return true;
            return s.target_roles.includes(effectiveRole);
        });

        const flattened: any[] = [];
        filteredSections.forEach(section => {
            section.questions.forEach(q => {
                flattened.push({
                    ...q,
                    sectionTitle: section.title,
                    sectionId: section.id
                });
            });
        });
        return flattened;
    }, [campaign, effectiveRole]);

    const totalQuestions = activeQuestions.length;
    const currentQuestion = activeQuestions[currentIndex];
    const mathProgress = totalQuestions > 0 ? Math.round(((currentIndex + 1) / totalQuestions) * 100) : 0;
    const progressPercent = Math.min(mathProgress, 100);

    const isAbsoluteLast = currentIndex === totalQuestions - 1;

    // React Hook Form Setup
    const { register, trigger, getValues, setValue, control, formState: { errors } } = useForm({
        defaultValues: answers
    });

    const watchedValues = useWatch({ control });

    // 3. Helper to check if a question should be visible based on its dependencies
    const isQuestionVisible = (question: any, currentAnswers: any) => {
        if (!question.depends_on || !question.depends_on.question_id) return true;

        const dependentValue = currentAnswers[question.depends_on.question_id];

        // Handle multiple values if question type was multiple_choice (though less common for simple skip)
        if (Array.isArray(dependentValue)) {
            return dependentValue.includes(question.depends_on.value);
        }

        return String(dependentValue) === String(question.depends_on.value);
    };

    const handleNext = async () => {
        if (!currentQuestion) return;

        // If it's an info block, no need to validate
        if (currentQuestion.type !== 'info') {
            const isValid = await trigger(currentQuestion.id);
            if (!isValid) return;
        }

        const data = getValues();
        const updatedAnswers = { ...answers, ...data };
        setAnswers(updatedAnswers);
        localStorage.setItem(`survey_progress_${slug}`, JSON.stringify(updatedAnswers));

        if (isAbsoluteLast) {
            await submitFinal(updatedAnswers);
        } else {
            // Find the next visible question
            let nextIdx = currentIndex + 1;
            while (nextIdx < activeQuestions.length && !isQuestionVisible(activeQuestions[nextIdx], updatedAnswers)) {
                nextIdx++;
            }

            if (nextIdx < activeQuestions.length) {
                setCurrentIndex(nextIdx);
                window.scrollTo(0, 0);
            } else {
                // If we skipped all the way to the end, submit
                await submitFinal(updatedAnswers);
            }
        }
    };

    const handleBack = () => {
        if (currentIndex > 0) {
            // Find the previous visible question
            let prevIdx = currentIndex - 1;
            while (prevIdx >= 0 && !isQuestionVisible(activeQuestions[prevIdx], answers)) {
                prevIdx--;
            }

            if (prevIdx >= 0) {
                setCurrentIndex(prevIdx);
                window.scrollTo(0, 0);
            } else if (selectedRole && !profile) {
                setSelectedRole(null);
            }
        } else if (selectedRole && !profile) {
            setSelectedRole(null);
        }
    };

    const submitFinal = async (finalData: any) => {
        setLoading(true);
        const { error } = await supabase.from('survey_responses').insert({
            campaign_id: campaign!.id,
            user_id: user?.id,
            profile_role: effectiveRole || 'anonymous',
            response_data: finalData,
            fingerprint_id: fingerprint,
            is_test: isTest
        });

        if (error) {
            alert('Erro ao enviar respostas. Tente novamente.');
            setLoading(false);
        } else {
            localStorage.removeItem(`survey_progress_${slug}`);
            setShowRewards(true);
            setLoading(false);
        }
    };

    // Validation Helper
    const validateContactForm = () => {
        let isValid = true;
        const newErrors: { whatsapp?: string; email?: string } = {};

        // WhatsApp Validation: Expected format (XX) XXXXX-XXXX -> 15 characters
        const cleanWhatsapp = contactFormData.whatsapp.replace(/\D/g, '');
        if (!contactFormData.whatsapp) {
            newErrors.whatsapp = 'Preenchimento obrigatório';
            isValid = false;
        } else if (cleanWhatsapp.length < 10 || cleanWhatsapp.length > 11) {
            newErrors.whatsapp = 'Número inválido (mínimo 10 dígitos)';
            isValid = false;
        }

        // Email Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!contactFormData.email) {
            newErrors.email = 'Preenchimento obrigatório';
            isValid = false;
        } else if (!emailRegex.test(contactFormData.email)) {
            newErrors.email = 'Formato de e-mail inválido';
            isValid = false;
        }

        return { isValid, errors: newErrors };
    };

    const [formErrors, setFormErrors] = React.useState<{ whatsapp?: string; email?: string }>({});

    const handleRedeemAll = async () => {
        const hasDraw = rewards.some(r => r.type === 'draw');

        if (hasDraw) {
            const { isValid, errors } = validateContactForm();
            setFormErrors(errors);

            if (!isValid) return;

            if (!sensitiveConsent) {
                alert('É necessário aceitar o termo de consentimento (LGPD) para participar.');
                return;
            }
        }

        setLoading(true);
        try {
            // SINGLE ENTRY LOGIC: Capture one redemption record only.
            // Priority: Draw rewards, then PDF rewards.
            const mainReward = rewards.find(r => r.type === 'draw') || rewards[0];

            if (!mainReward) {
                setLoading(false);
                return;
            }

            const redemptionCode = mainReward.type === 'pdf' && mainReward.type !== 'draw'
                ? 'AXE-' + Math.random().toString(36).substr(2, 4).toUpperCase()
                : null;

            // Check if already redeemed
            const { data: existingRedemption } = await supabase
                .from('reward_redemptions')
                .select('*')
                .eq('campaign_id', campaign!.id)
                .or(`fingerprint_id.eq.${fingerprint}${user ? `,profile_id.eq.${user.id}` : ''}`)
                .limit(1)
                .single();

            let finalLuckyNumber = existingRedemption?.lucky_number;
            let finalRedemptionCode = existingRedemption?.redemption_code;

            if (!existingRedemption) {
                const { data: inserted, error } = await supabase.from('reward_redemptions').insert({
                    reward_id: mainReward.id,
                    campaign_id: campaign!.id,
                    profile_id: user?.id,
                    fingerprint_id: fingerprint,
                    redemption_code: redemptionCode,
                    contact_whatsapp: contactFormData.whatsapp || null,
                    contact_email: contactFormData.email || user?.email || null,
                    metadata: {
                        redeemed_at: new Date().toISOString(),
                        user_email: user?.email,
                        sensitive_consent: sensitiveConsent,
                        single_entry: true // Metadata marker
                    }
                }).select('reward_id, lucky_number, redemption_code').single();

                if (error) {
                    console.error(`Error redeeming:`, error);
                    alert('Erro ao registrar participação. Tente novamente.');
                    setLoading(false);
                    return;
                }
                finalLuckyNumber = inserted.lucky_number;
                finalRedemptionCode = inserted.redemption_code;
            }

            const luckyNums: { [key: string]: string } = {};
            const results: { [key: string]: string } = {};

            // Map the SINGLE lucky number to ALL draw rewards for display purposes
            if (finalLuckyNumber) {
                rewards.forEach(r => {
                    if (r.type === 'draw') luckyNums[r.id] = String(finalLuckyNumber).padStart(5, '0');
                });
            }
            if (finalRedemptionCode) {
                rewards.forEach(r => {
                    if (r.type === 'pdf') results[r.id] = finalRedemptionCode!;
                });
            }

            setRedemptionSuccess(rewards.map(r => r.id)); // mark all as success
            setRedemptionCodes(results);
            setLuckyNumbers(luckyNums);

            // Auto-open PDFs
            rewards.forEach(r => {
                if (r.type === 'pdf' && r.file_url) {
                    window.open(r.file_url, '_blank');
                }
            });

            setRedeemAllSuccess(true);
        } catch (err) {
            console.error('Error in redeem all:', err);
            alert('Ocorreu um erro ao processar os incentivos.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
            <div className="size-12 border-4 border-gray-100 border-t-primary rounded-full animate-spin" />
            <p className="font-bold text-gray-400">Carregando pesquisa...</p>
        </div>
    );

    if (errorMsg) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="size-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-4xl">error</span>
            </div>
            <h1 className="text-xl font-bold text-text-main">{errorMsg}</h1>
            <button onClick={() => navigate('/')} className="mt-4 px-6 py-2 bg-primary text-white font-bold rounded-lg">
                Voltar ao Início
            </button>
        </div>
    );
    if (!campaign || (totalQuestions === 0 && !hasResponded && effectiveRole)) return <div className="p-8 text-center">Pesquisa não encontrada ou não disponível para seu perfil.</div>;

    // Campaign is closed (outside date range or ended status)
    if (!isCampaignOpen && !isTest) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const hasNotStarted = campaign.start_date && today < new Date(campaign.start_date);
        const hasEnded = campaign.end_date && today > new Date(campaign.end_date);

        return (
            <MainLayout navbarProps={{ variant: 'app', subtitle: campaign.title }}>
                <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
                    <div className={`size-20 rounded-full flex items-center justify-center mb-6 ${hasNotStarted ? 'bg-blue-50 text-blue-500' : 'bg-amber-50 text-amber-500'}`}>
                        <span className="material-symbols-outlined text-4xl">
                            {hasNotStarted ? 'schedule' : 'event_busy'}
                        </span>
                    </div>
                    <h1 className="text-2xl font-black text-text-main uppercase tracking-tight mb-2">
                        {hasNotStarted ? 'Pesquisa ainda não iniciou' : 'Pesquisa Encerrada'}
                    </h1>
                    <p className="text-gray-500 max-w-md mb-4">
                        {hasNotStarted
                            ? `Esta pesquisa estará disponível a partir de ${new Date(campaign.start_date!).toLocaleDateString('pt-BR')}.`
                            : hasEnded
                                ? `Esta pesquisa foi encerrada em ${new Date(campaign.end_date!).toLocaleDateString('pt-BR')}.`
                                : 'Esta pesquisa não está mais recebendo respostas.'
                        }
                    </p>
                    {hasEnded && (
                        <button
                            onClick={() => navigate('/resultados')}
                            className="mt-4 px-8 py-3 bg-primary text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:scale-105 transition-all flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-lg">search</span>
                            Conferir Resultados do Sorteio
                        </button>
                    )}
                    <button
                        onClick={() => navigate('/')}
                        className="mt-4 px-8 py-3 bg-gray-100 text-gray-500 font-bold rounded-xl hover:bg-gray-200 transition-all"
                    >
                        Voltar ao Início
                    </button>
                </div>
            </MainLayout>
        );
    }

    if (showRewards) {
        // Extract the single lucky number if available (from the map, taking any value)
        const displayLuckyNumber = Object.values(luckyNumbers)[0];
        const hasDrawReward = rewards.some(r => r.type === 'draw');

        return (
            <MainLayout navbarProps={{ variant: 'app', subtitle: campaign.title }}>
                <div className="max-w-4xl mx-auto px-6 py-12 animate-in fade-in zoom-in duration-700">
                    <div className="text-center mb-12">
                        <div className="size-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-100/50">
                            <span className="material-symbols-outlined text-4xl">celebration</span>
                        </div>
                        <h1 className="text-4xl font-black text-text-main tracking-tight uppercase mb-4 leading-tight">Obrigado pela sua contribuição!</h1>
                        <p className="text-gray-500 max-w-2xl mx-auto text-lg leading-relaxed font-medium">
                            Sua voz é fundamental para fortalecermos nossa comunidade.
                        </p>
                    </div>

                    {/* NEW: Single Validation Code / Lucky Number Display */}
                    {redeemAllSuccess && displayLuckyNumber && (
                        <div className="mb-12">
                            <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 rounded-[40px] p-10 text-center text-white relative overflow-hidden shadow-2xl shadow-primary/30">
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <span className="material-symbols-outlined text-9xl">confirmation_number</span>
                                </div>
                                <p className="text-sm font-bold uppercase tracking-widest text-primary-100 mb-4">Seu Número da Sorte</p>
                                <div className="flex items-center justify-center gap-4 mb-2">
                                    <span className="text-5xl sm:text-6xl md:text-8xl font-black tracking-widest font-mono drop-shadow-md break-all">{displayLuckyNumber}</span>
                                    <button
                                        onClick={() => {
                                            if (navigator.clipboard) navigator.clipboard.writeText(displayLuckyNumber as string);
                                            alert('Número copiado!');
                                        }}
                                        className="size-12 bg-white/20 hover:bg-white/30 rounded-2xl flex items-center justify-center transition-all backdrop-blur-sm"
                                    >
                                        <span className="material-symbols-outlined">content_copy</span>
                                    </button>
                                </div>
                                <p className="text-sm font-medium text-primary-100 max-w-md mx-auto">
                                    Guarde este número com você. Ele é sua chave única para concorrer a todos os prêmios desta campanha.
                                </p>
                            </div>
                        </div>
                    )}

                    {rewards.length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-xl font-black text-text-main uppercase tracking-tight mb-6 flex items-center gap-3">
                                <span className="size-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center text-sm">
                                    <span className="material-symbols-outlined">trophy</span>
                                </span>
                                Prêmios que você está concorrendo
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {rewards.map((reward, index) => (
                                    <div key={reward.id} className="bg-white rounded-[24px] border border-gray-100 p-6 flex items-center gap-4 shadow-sm relative overflow-hidden group">
                                        {/* Position Badge */}
                                        <div className="absolute -right-3 -top-3 size-12 bg-gray-50 rounded-bl-3xl flex items-end justify-center pb-2 pl-2 shadow-inner z-10">
                                            <span className="text-xs font-black text-gray-300">{index + 1}º</span>
                                        </div>

                                        <div className={`size-16 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden ${reward.type === 'pdf' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'} border border-gray-100 shadow-sm relative z-0`}>
                                            {reward.image_url ? (
                                                <img src={reward.image_url} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                                <span className="material-symbols-outlined text-2xl">
                                                    {reward.type === 'pdf' ? 'picture_as_pdf' : 'redeem'}
                                                </span>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[9px] font-black uppercase rounded-md tracking-wider">
                                                    {reward.type === 'pdf' ? 'Bônus' : `${index + 1}º Prêmio`}
                                                </span>
                                                {redeemAllSuccess && (
                                                    <span className="px-2 py-0.5 bg-green-100 text-green-600 text-[9px] font-black uppercase rounded-md tracking-wider flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[10px]">check_circle</span>
                                                        Participando
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="font-black text-text-main uppercase text-sm truncate leading-tight mb-1">{reward.title}</h3>
                                            {reward.type === 'draw' && reward.draw_at && (
                                                <p className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                                                    Sorteio: {new Date(reward.draw_at).toLocaleDateString('pt-BR')}
                                                </p>
                                            )}
                                            {reward.type === 'pdf' && redeemAllSuccess && (
                                                <button
                                                    onClick={() => reward.file_url && window.open(reward.file_url, '_blank')}
                                                    className="mt-2 text-[10px] font-black uppercase text-primary hover:underline flex items-center gap-1"
                                                >
                                                    <span className="material-symbols-outlined text-[12px]">download</span>
                                                    Baixar Arquivo
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!redeemAllSuccess && rewards.length > 0 ? (
                        <div className="bg-white rounded-[40px] border border-primary/10 p-8 md:p-12 shadow-2xl shadow-primary/5">
                            {hasDrawReward && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">WhatsApp para Contato *</label>
                                        <input
                                            type="tel"
                                            value={contactFormData.whatsapp}
                                            onChange={(e) => {
                                                handleWhatsAppChange(e);
                                                if (formErrors.whatsapp) setFormErrors(prev => ({ ...prev, whatsapp: undefined }));
                                            }}
                                            placeholder="(99) 99999-9999"
                                            className={`w-full border-gray-100 bg-gray-50/50 p-4 rounded-2xl focus:ring-4 outline-none transition-all font-bold text-text-main ${formErrors.whatsapp ? 'ring-red-100 border-red-200' : 'ring-primary/5'}`}
                                        />
                                        {formErrors.whatsapp && <p className="text-red-500 text-xs mt-1 font-bold">{formErrors.whatsapp}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">E-mail para Sorteio *</label>
                                        <input
                                            type="email"
                                            value={contactFormData.email}
                                            onChange={(e) => {
                                                setContactFormData(prev => ({ ...prev, email: e.target.value }));
                                                if (formErrors.email) setFormErrors(prev => ({ ...prev, email: undefined }));
                                            }}
                                            placeholder="seu@email.com"
                                            className={`w-full border-gray-100 bg-gray-50/50 p-4 rounded-2xl focus:ring-4 outline-none transition-all font-bold text-text-main ${formErrors.email ? 'ring-red-100 border-red-200' : 'ring-primary/5'}`}
                                        />
                                        {formErrors.email && <p className="text-red-500 text-xs mt-1 font-bold">{formErrors.email}</p>}
                                    </div>
                                </div>
                            )}


                            <div className="space-y-6">
                                <label className="flex items-start gap-4 p-6 bg-gray-50 rounded-2xl border border-gray-100 cursor-pointer hover:bg-white transition-all group">
                                    <input
                                        type="checkbox"
                                        checked={sensitiveConsent}
                                        onChange={(e) => setSensitiveConsent(e.target.checked)}
                                        className="size-6 mt-1 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <div className="text-sm font-medium text-text-secondary leading-relaxed">
                                        <span className="font-black text-text-main uppercase text-[10px] block mb-1">Consentimento de Dados Sensíveis</span>
                                        Concordo com a coleta e armazenamento dos meus dados de contato (WhatsApp e E-mail) exclusivamente para fins de comunicação sobre os prêmios e sorteios desta campanha, conforme as normas de proteção de dados (LGPD).
                                    </div>
                                </label>

                                <button
                                    onClick={handleRedeemAll}
                                    disabled={loading}
                                    className="w-full py-6 bg-primary text-white rounded-[30px] font-black uppercase tracking-widest text-sm shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {loading ? (
                                        <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined font-black">
                                                {rewards.some(r => r.type === 'draw') ? 'confirmation_number' : 'download'}
                                            </span>
                                            {rewards.some(r => r.type === 'draw') && rewards.some(r => r.type === 'pdf')
                                                ? 'Baixar Material e Participar do Sorteio'
                                                : rewards.some(r => r.type === 'draw')
                                                    ? 'Participar do Sorteio'
                                                    : 'Fazer Download'
                                            }
                                        </>
                                    )}
                                </button>

                                {!loading && (
                                    <button
                                        onClick={() => navigate('/')}
                                        className="w-full py-5 bg-gray-50 text-gray-400 rounded-[25px] font-black uppercase text-[10px] tracking-widest hover:bg-gray-100 transition-all"
                                    >
                                        Não tenho interesse / Voltar para o Início
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                            <button
                                onClick={() => navigate('/')}
                                className="px-10 py-4 bg-gray-100/50 text-gray-500 font-bold rounded-2xl hover:bg-white hover:shadow-lg hover:text-primary transition-all border border-gray-100 active:scale-95 uppercase text-xs tracking-widest"
                            >
                                Voltar ao Início
                            </button>
                        </div>
                    )}

                </div >
            </MainLayout >
        );
    }

    if (hasResponded) {
        return (
            <MainLayout navbarProps={{ variant: 'app', subtitle: campaign.title }}>
                <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
                    <div className="size-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6">
                        <span className="material-symbols-outlined text-4xl">task_alt</span>
                    </div>
                    <h1 className="text-2xl font-bold text-text-main mb-2">Você já participou!</h1>
                    <p className="text-gray-500 max-w-md">
                        Agradecemos seu interesse. Esta pesquisa permite apenas uma resposta por participante para garantir a integridade dos dados.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 mt-8">
                        {rewards.length > 0 && (
                            <button
                                onClick={() => setShowRewards(true)}
                                className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined">redeem</span>
                                Ver meus Prêmios / Sorteio
                            </button>
                        )}
                        <button
                            onClick={() => navigate('/')}
                            className="px-8 py-3 bg-gray-100 text-gray-500 font-bold rounded-xl hover:bg-gray-200 transition-all"
                        >
                            Voltar ao Início
                        </button>
                    </div>
                </div>
            </MainLayout>
        );
    }

    if (isRoleSelected && activeQuestions.length === 0) {
        return (
            <MainLayout navbarProps={{ variant: 'app', subtitle: campaign.title }}>
                <div className="max-w-3xl mx-auto px-6 py-12">
                    <div className="bg-white p-12 text-center rounded-3xl border border-gray-100 shadow-xl">
                        <div className="size-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-outlined text-4xl">info</span>
                        </div>
                        <h2 className="text-xl font-bold text-text-main mb-2">Nenhuma Questão Disponível</h2>
                        <p className="text-gray-500 mb-8">
                            Não há perguntas configuradas para o seu perfil nesta pesquisa.
                        </p>
                        <div className="flex flex-col gap-3">
                            {!profile && (
                                <button
                                    onClick={() => setSelectedRole(null)}
                                    className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all"
                                >
                                    Trocar Perfil
                                </button>
                            )}
                            <button
                                onClick={() => navigate('/')}
                                className="px-8 py-3 text-text-secondary font-bold rounded-xl hover:bg-gray-50 transition-all border border-gray-100"
                            >
                                Voltar para o Início
                            </button>
                        </div>
                    </div>
                </div>
            </MainLayout>
        );
    }

    const theme = campaign.theme || { primary_color: '#8B0000', secondary_color: '#FFD700' };

    if (campaign.consent_text && !hasConsented) {
        return (
            <MainLayout navbarProps={{ variant: 'app', subtitle: campaign.title }}>
                <div className="max-w-3xl mx-auto px-6 py-12">
                    {campaign.image_url && (
                        <div className="mb-8 rounded-[32px] overflow-hidden shadow-2xl shadow-gray-200/50 border border-gray-100 aspect-video md:aspect-[21/9] w-full bg-gray-50">
                            <img src={campaign.image_url} alt={campaign.title} className="w-full h-full object-cover" />
                        </div>
                    )}
                    <div className="bg-white p-8 md:p-12 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50">
                        <div className="mb-8">
                            <span className="text-xs font-black uppercase tracking-widest text-text-secondary opacity-50 block mb-2">Consentimento e Termos</span>
                            <h1 className="text-3xl font-black text-text-main tracking-tight uppercase leading-none">Termos de Participação</h1>
                        </div>

                        <div className="prose prose-sm max-w-none text-text-secondary mb-10 bg-gray-50 p-6 rounded-2xl border border-gray-100 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                            {campaign.consent_text}
                        </div>

                        <div className="space-y-4">
                            <button
                                onClick={() => setHasConsented(true)}
                                className="w-full py-4 rounded-2xl font-bold text-white shadow-xl transition-all hover:scale-[1.02] active:scale-95 text-lg"
                                style={{
                                    backgroundColor: theme.primary_color,
                                    boxShadow: `0 10px 25px -5px ${theme.primary_color}40`
                                }}
                            >
                                Li e Aceito os Termos
                            </button>
                            <button
                                onClick={() => navigate('/')}
                                className="w-full py-4 rounded-2xl font-bold text-text-secondary hover:bg-gray-50 transition-all"
                            >
                                Não Aceito / Voltar
                            </button>
                        </div>
                    </div>
                </div>
            </MainLayout>
        );
    }

    if (!isRoleSelected) {
        const potentialRoles = [
            { id: 'lider_terreiro', label: 'Liderança de Terreiro', icon: 'account_balance' },
            { id: 'medium', label: 'Médium / Filho(a) de Santo', icon: 'diversity_1' },
            { id: 'consulente', label: 'Consulente / Simpatizante', icon: 'favorite' },
        ];

        // Filter roles that have at least one question associated with them
        const roles = potentialRoles.filter(role => {
            return campaign.form_schema.sections.some(section => {
                const targetRoles = section.target_roles || [];
                return targetRoles.length === 0 || targetRoles.includes(role.id);
            });
        });

        const selectionTitle = (profile && systemRoles.includes(profile.role))
            ? "Selecione um Perfil para Teste"
            : "Como você se define?";

        return (
            <MainLayout navbarProps={{ variant: 'app', subtitle: campaign.title }}>
                <div className="max-w-3xl mx-auto px-6 py-12">
                    <div className="bg-white p-8 md:p-12 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50">
                        <div className="mb-8">
                            <span className="text-xs font-black uppercase tracking-widest text-text-secondary opacity-50 block mb-2">Identificação</span>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="size-1.5 bg-primary rounded-full" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Passo 1 de 2</span>
                            </div>
                            <h1 className="text-3xl font-black text-text-main tracking-tight uppercase leading-none">{selectionTitle}</h1>
                            <p className="mt-4 text-gray-500">
                                {profile && systemRoles.includes(profile.role)
                                    ? "Como você é um usuário do sistema, selecione um perfil para visualizar a pesquisa como um participante."
                                    : "Para mostrarmos as perguntas corretas, precisamos saber seu papel na comunidade."}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 mb-10">
                            {roles.map(role => (
                                <button
                                    key={role.id}
                                    onClick={() => setSelectedRole(role.id)}
                                    className="flex items-center gap-6 p-6 rounded-3xl border-2 border-gray-100 hover:border-primary hover:bg-primary/5 transition-all text-left group"
                                >
                                    <div className="size-14 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                        <span className="material-symbols-outlined text-3xl">{role.icon}</span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg text-text-main">{role.label}</h3>
                                        <p className="text-sm text-gray-400">Clique para selecionar</p>
                                    </div>
                                    <span className="material-symbols-outlined text-gray-200 group-hover:text-primary group-hover:translate-x-1 transition-all">arrow_forward_ios</span>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setHasConsented(false)}
                            className="w-full py-4 rounded-2xl font-bold text-text-secondary hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-sm">arrow_back</span>
                            Voltar aos Termos
                        </button>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout navbarProps={{ variant: 'app', subtitle: campaign.title }}>
            {isTest && (
                <div className="bg-amber-500 text-white text-[10px] font-black uppercase tracking-[0.2em] py-2 text-center sticky top-0 z-50">
                    Ambiente de Demonstração • Respostas Marcadas como Teste
                </div>
            )}
            <div className="max-w-3xl mx-auto px-6 py-12">
                {campaign.image_url && (
                    <div className="mb-8 rounded-[32px] overflow-hidden shadow-2xl shadow-gray-200/50 border border-gray-100 aspect-video md:aspect-[21/9] w-full bg-gray-50">
                        <img src={campaign.image_url} alt={campaign.title} className="w-full h-full object-cover" />
                    </div>
                )}

                <div className="mb-8">
                    <div className="flex justify-between items-end mb-4">
                        <div className="flex-1 min-w-0 mr-4">
                            <span className="text-xs font-black uppercase tracking-widest text-text-secondary opacity-50 block mb-1">
                                {currentQuestion.sectionTitle} • Questão {currentIndex + 1} de {totalQuestions}
                            </span>
                        </div>
                        <div className="text-right shrink-0">
                            <span className="text-lg font-black text-primary">
                                {progressPercent}%
                            </span>
                        </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full transition-all duration-500"
                            style={{
                                width: `${progressPercent}%`,
                                backgroundColor: theme.primary_color
                            }}
                        />
                    </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 min-h-[400px] flex flex-col">
                    <div className="flex-1">
                        <div className="space-y-6">
                            {currentQuestion && (
                                <div key={currentQuestion.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <h2 className="text-2xl font-black text-text-main tracking-tight uppercase mb-6 leading-tight">
                                        {currentQuestion?.label || 'Informação'}
                                    </h2>

                                    {currentQuestion.description && (
                                        <p className="text-base text-text-secondary leading-relaxed opacity-80 mb-8 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                            {currentQuestion.description}
                                        </p>
                                    )}

                                    <div className="pt-2">
                                        {(currentQuestion.type === 'short_text' || currentQuestion.type === 'text') && (
                                            <input
                                                {...register(currentQuestion.id, { required: currentQuestion.required })}
                                                autoFocus
                                                className="w-full border-2 border-gray-100 rounded-2xl p-5 text-lg focus:ring-0 transition-all outline-none"
                                                style={{ borderColor: errors[currentQuestion.id] ? '#ef4444' : undefined }}
                                                placeholder="Sua resposta aqui..."
                                                onFocus={(e: any) => e.target.style.borderColor = theme.primary_color}
                                                onBlur={(e: any) => e.target.style.borderColor = (errors[currentQuestion.id] ? '#ef4444' : '#f3f4f6')}
                                            />
                                        )}

                                        {currentQuestion.type === 'long_text' && (
                                            <textarea
                                                {...register(currentQuestion.id, { required: currentQuestion.required })}
                                                autoFocus
                                                rows={6}
                                                className="w-full border-2 border-gray-100 rounded-2xl p-5 text-lg focus:ring-0 transition-all outline-none resize-none"
                                                style={{ borderColor: errors[currentQuestion.id] ? '#ef4444' : undefined }}
                                                placeholder="Descreva detalhadamente..."
                                                onFocus={(e: any) => e.target.style.borderColor = theme.primary_color}
                                                onBlur={(e: any) => e.target.style.borderColor = (errors[currentQuestion.id] ? '#ef4444' : '#f3f4f6')}
                                            />
                                        )}

                                        {currentQuestion.type === 'single_choice' && (
                                            <div className="grid grid-cols-1 gap-4">
                                                {currentQuestion.options?.map((opt: any) => {
                                                    const label = typeof opt === 'string' ? opt : opt.label;
                                                    const value = typeof opt === 'string' ? opt : opt.value;
                                                    return (
                                                        <label key={value} className="flex items-center gap-4 p-5 border-2 border-gray-100 rounded-3xl cursor-pointer hover:bg-gray-50 transition-all group has-[:checked]:border-primary" style={{ borderColor: watchedValues[currentQuestion.id] === value ? theme.primary_color : undefined }}>
                                                            <input
                                                                type="radio"
                                                                value={value}
                                                                {...register(currentQuestion.id, { required: currentQuestion.required })}
                                                                className="size-6 border-2"
                                                                style={{ accentColor: theme.primary_color }}
                                                            />
                                                            <span className="text-lg font-bold text-text-main">{label}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {currentQuestion.type === 'multiple_choice' && (
                                            <div className="grid grid-cols-1 gap-4">
                                                {currentQuestion.options?.map((opt: any) => {
                                                    const label = typeof opt === 'string' ? opt : opt.label;
                                                    const value = typeof opt === 'string' ? opt : opt.value;
                                                    return (
                                                        <label key={value} className="flex items-center gap-4 p-5 border-2 border-gray-100 rounded-3xl cursor-pointer hover:bg-gray-50 transition-all group has-[:checked]:border-primary">
                                                            <input
                                                                type="checkbox"
                                                                value={value}
                                                                {...register(currentQuestion.id, { required: currentQuestion.required })}
                                                                className="size-6 border-2"
                                                                style={{ accentColor: theme.primary_color }}
                                                            />
                                                            <span className="text-lg font-bold text-text-main">{label}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {currentQuestion.type === 'scale' && (
                                            <div className="flex flex-wrap justify-between gap-3">
                                                {Array.from(
                                                    { length: (currentQuestion.max || 5) - (currentQuestion.min || 1) + 1 },
                                                    (_, i) => (currentQuestion.min || 1) + i
                                                ).map(val => (
                                                    <label key={val} className="flex-1 min-w-[60px] flex flex-col items-center gap-3 p-5 border-2 border-gray-100 rounded-3xl cursor-pointer hover:bg-gray-50 transition-all has-[:checked]:border-primary" style={{ borderColor: Number(watchedValues[currentQuestion.id]) === val ? theme.primary_color : undefined }}>
                                                        <input
                                                            type="radio"
                                                            value={val}
                                                            {...register(currentQuestion.id, { required: currentQuestion.required })}
                                                            className="size-6"
                                                            style={{ accentColor: theme.primary_color }}
                                                        />
                                                        <span className="text-xl font-black">{val}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}

                                        {currentQuestion.type === 'info' && (
                                            <div className="bg-primary/5 p-8 rounded-3xl border border-primary/10">
                                                <div className="flex items-center gap-4 mb-4 text-primary">
                                                    <span className="material-symbols-outlined text-3xl">info</span>
                                                    <h3 className="font-black uppercase tracking-tight text-xl">{currentQuestion.label}</h3>
                                                </div>
                                                <div className="text-text-secondary leading-relaxed text-lg whitespace-pre-wrap">
                                                    {currentQuestion.help_text}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {errors[currentQuestion.id] && (
                                        <div className="mt-6 flex items-center gap-2 text-red-500 bg-red-50 px-4 py-2 rounded-xl border border-red-100">
                                            <span className="material-symbols-outlined text-sm">error</span>
                                            <span className="text-xs font-bold uppercase tracking-widest">
                                                Por favor, responda esta pergunta para continuar
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-between pt-10 border-t border-gray-100 mt-12">
                        <button
                            type="button"
                            onClick={handleBack}
                            disabled={currentIndex === 0 && !!profile}
                            className="px-8 py-4 rounded-2xl font-bold text-text-secondary hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                            Anterior
                        </button>
                        <button
                            type="button"
                            onClick={handleNext}
                            className="px-12 py-4 rounded-2xl font-bold text-white shadow-xl transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2"
                            style={{
                                backgroundColor: theme.primary_color,
                                boxShadow: `0 10px 25px -5px ${theme.primary_color}40`
                            }}
                        >
                            {isAbsoluteLast ? 'Finalizar Pesquisa' : 'Próxima'}
                            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                        </button>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default SurveyRenderer;

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm, useFieldArray, useWatch, Control, UseFormRegister } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import AdminLayout from '../../layouts/AdminLayout';
import { supabase } from '../../services/supabase';
import { Campaign, SurveySchema, CampaignReward, Partner } from '../../types';
import { getRewards, getCampaignRewards, createReward, updateReward, deleteReward, getPartners } from '../../services/admin';
import ImageUpload from '../../components/forms/ImageUpload';
import SidePanel from '../../components/layout/SidePanel';

// --- Schema ---
const surveyBuilderSchema = z.object({
    title: z.string().min(3, "Mínimo 3 caracteres"),
    slug: z.string().min(3, "Slug inválido"),
    description: z.string().optional(),
    consent_text: z.string().optional(),
    status: z.enum(['draft', 'active', 'ended']),
    image_url: z.string().optional().nullable(),
    theme: z.object({
        primary_color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Cor inválida"),
        secondary_color: z.string().optional().nullable()
    }).optional(),
    goal_amount: z.number().min(0).optional().nullable(),
    start_date: z.string().optional().nullable(),
    end_date: z.string().optional().nullable(),
    sponsors: z.array(z.object({
        name: z.string().min(1, "Nome do patrocinador obrigatório"),
        logo_url: z.string().optional(),
        url: z.string().optional()
    })).optional(),
    sections: z.array(z.object({
        id: z.string(),
        title: z.string().min(1, "Título da seção obrigatório"),
        description: z.string().optional(),
        target_roles: z.array(z.string()).optional(),
        questions: z.array(z.object({
            id: z.string(),
            type: z.enum(['short_text', 'long_text', 'single_choice', 'multiple_choice', 'scale', 'info']),
            label: z.string().min(1, "Pergunta obrigatória"),
            help_text: z.string().optional(),
            required: z.boolean().optional(),
            min: z.number().optional(),
            max: z.number().optional(),
            options: z.array(z.object({
                label: z.string(),
                value: z.string()
            })).optional(),
            depends_on: z.object({
                question_id: z.string().optional().nullable(),
                value: z.string().optional().nullable()
            }).optional().nullable()
        }))
    }))
});

type SurveyBuilderForm = z.infer<typeof surveyBuilderSchema>;

// --- Components ---

const SortableItem = (props: { children: React.ReactNode, id: string, className?: string, [key: string]: any }) => {
    const { children, id, className } = props;
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className={`${className} flex items-center gap-2`}>
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded shrink-0">
                <span className="material-symbols-outlined text-gray-400 select-none block">drag_indicator</span>
            </div>
            <div className="flex-1 min-w-0">
                {children}
            </div>
        </div>
    );
};

const SectionNavItem = ({ section, index, isActive, onClick, onRemove }: any) => {
    return (
        <div
            onClick={onClick}
            className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border-2 ${isActive
                ? 'bg-primary/5 border-primary text-primary shadow-sm'
                : 'border-transparent hover:bg-gray-50 text-gray-600'
                }`}
        >
            <div className="flex items-center gap-3 overflow-hidden">
                <span className="text-xs font-black bg-gray-100 text-gray-400 size-5 flex items-center justify-center rounded-full shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    {index + 1}
                </span>
                <span className="font-bold truncate text-sm">
                    {section.title || `Seção ${index + 1}`}
                </span>
            </div>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Excluir esta seção e todas as suas perguntas?')) onRemove();
                }}
                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-1"
            >
                <span className="material-symbols-outlined text-sm">delete</span>
            </button>
        </div>
    );
};

const QuestionItem = ({ question, index, sectionIndex, register, onRemove, watch, control }: any) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const type = watch(`sections.${sectionIndex}.questions.${index}.type`);

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
            <div className={`p-4 flex items-center justify-between transition-colors ${isExpanded ? 'bg-gray-50/50 border-b border-gray-50' : ''}`}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary/50 bg-primary/5 px-2 py-0.5 rounded">
                                {type?.replace('_', ' ') || 'texto'}
                            </span>
                            <h4 className="font-bold text-sm text-text-main truncate">
                                {question?.label || "Pergunta sem título"}
                            </h4>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                        className="p-1.5 text-gray-400 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm">
                            {isExpanded ? 'expand_less' : 'expand_more'}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Tem certeza que deseja excluir esta pergunta?')) onRemove();
                        }}
                        className="p-1.5 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                </div>
            </div>

            {isExpanded && (
                <div className="p-5 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-1">
                            <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">Título da Pergunta</label>
                            <input
                                {...register(`sections.${sectionIndex}.questions.${index}.label`)}
                                className="w-full border-gray-200 rounded-xl text-sm focus:border-primary focus:ring-primary/20"
                                placeholder="Ex: Qual sua experiência?"
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">Tipo de Resposta</label>
                            <select
                                {...register(`sections.${sectionIndex}.questions.${index}.type`)}
                                className="w-full border-gray-200 rounded-xl text-sm focus:border-primary focus:ring-primary/20"
                            >
                                <option value="short_text">Texto Curto</option>
                                <option value="long_text">Texto Longo</option>
                                <option value="single_choice">Múltipla Escolha (Radio)</option>
                                <option value="multiple_choice">Seleção Múltipla (Checkbox)</option>
                                <option value="scale">Escala (Nota)</option>
                                <option value="info">Bloco Informativo</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                {...register(`sections.${sectionIndex}.questions.${index}.required`)}
                                className="rounded text-primary focus:ring-primary/20 border-gray-300"
                            />
                            <span className="text-xs font-bold text-gray-500 group-hover:text-text-main transition-colors">Resposta Obrigatória</span>
                        </label>
                    </div>

                    {(type === 'single_choice' || type === 'multiple_choice') && (
                        <OptionsEditor sectionIndex={sectionIndex} questionIndex={index} register={register} watch={watch} control={control} />
                    )}

                    {type === 'scale' && (
                        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">Mínimo</label>
                                <input type="number" {...register(`sections.${sectionIndex}.questions.${index}.min`, { valueAsNumber: true })} className="w-full border-gray-200 rounded-xl text-sm" placeholder="Ex: 1" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">Máximo</label>
                                <input type="number" {...register(`sections.${sectionIndex}.questions.${index}.max`, { valueAsNumber: true })} className="w-full border-gray-200 rounded-xl text-sm" placeholder="Ex: 10" />
                            </div>
                        </div>
                    )}

                    {/* Conditional Logic - Hidden for the first question of the entire survey */}
                    {!(sectionIndex === 0 && index === 0) && (
                        <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm text-primary/40">input</span>
                                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Lógica Condicional (Opcional)</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 mb-1">Depende da Pergunta:</label>
                                    <select
                                        {...register(`sections.${sectionIndex}.questions.${index}.depends_on.question_id`)}
                                        className="w-full border-gray-200 rounded-xl text-xs focus:border-primary focus:ring-primary/20"
                                    >
                                        <option value="">Nenhuma (Sempre visível)</option>
                                        {watch(`sections`)
                                            ?.slice(0, sectionIndex + 1) // Only current and previous sections
                                            ?.flatMap((s: any, sIdx: number) =>
                                                s.questions
                                                    .filter((q: any, qIdx: number) => {
                                                        // If it's a previous section, allow all questions
                                                        if (sIdx < sectionIndex) return true;
                                                        // If it's the current section, only allow previous questions
                                                        return qIdx < index;
                                                    })
                                                    .map((q: any) => (
                                                        <option key={q.id} value={q.id}>
                                                            {s.title}: {q.label || q.id}
                                                        </option>
                                                    ))
                                            )}
                                    </select>
                                </div>
                                {watch(`sections.${sectionIndex}.questions.${index}.depends_on.question_id`) && (
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 mb-1">Mostrar se o Valor for:</label>
                                        <input
                                            {...register(`sections.${sectionIndex}.questions.${index}.depends_on.value`)}
                                            className="w-full border-gray-200 rounded-xl text-xs focus:border-primary focus:ring-primary/20"
                                            placeholder="Ex: sim"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const OptionsEditor = ({ sectionIndex, questionIndex, register, watch, control }: any) => {
    const path = `sections.${sectionIndex}.questions.${questionIndex}.options`;
    const { fields: options, append, remove } = useFieldArray({
        control,
        name: path
    });

    return (
        <div className="space-y-3 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Opções de Resposta</span>
            </div>
            {options.map((item, idx) => (
                <div key={item.id} className="flex gap-2 group">
                    <input
                        {...register(`${path}.${idx}.label`)}
                        className="flex-1 border-gray-200 rounded-xl text-xs"
                        placeholder="Rótulo (ex: Sim)"
                    />
                    <input
                        {...register(`${path}.${idx}.value`)}
                        className="flex-1 border-gray-200 rounded-xl text-xs"
                        placeholder="Valor (ex: sim)"
                    />
                    <button
                        type="button"
                        onClick={() => remove(idx)}
                        className="text-red-300 hover:text-red-500 p-1"
                    >
                        <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                </div>
            ))}
            <button
                type="button"
                onClick={() => append({ label: '', value: '' })}
                className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-[10px] font-black uppercase text-gray-400 hover:border-primary/30 hover:text-primary transition-all"
            >
                + Adicionar Opção
            </button>
        </div>
    );
};


// --- Main Page ---

const AdminCampaignBuilder: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [activeSectionIndex, setActiveSectionIndex] = useState(0);
    const [allRewards, setAllRewards] = useState<CampaignReward[]>([]);
    const [selectedRewards, setSelectedRewards] = useState<{ id: string, draw_position: string }[]>([]);
    const [isCampaignActive, setIsCampaignActive] = useState(false);
    const [forceEdit, setForceEdit] = useState(false);

    // Reward Management State
    const [isRewardPanelOpen, setIsRewardPanelOpen] = useState(false);
    const [partners, setPartners] = useState<Partner[]>([]);
    const [rewardLoading, setRewardLoading] = useState(false);
    const [newItemName, setNewItemName] = useState('');

    const rewardForm = useForm<CampaignReward>({
        defaultValues: {
            active: true,
            type: 'pdf',
            image_url: '',
            file_url: '',
            items: [],
            draw_at: ''
        }
    });

    const currentRewardItems = rewardForm.watch('items') || [];

    const handleAddRewardItem = () => {
        if (!newItemName.trim()) return;
        rewardForm.setValue('items', [...currentRewardItems, newItemName.trim()]);
        setNewItemName('');
    };

    const handleRemoveRewardItem = (index: number) => {
        rewardForm.setValue('items', currentRewardItems.filter((_, i) => i !== index));
    };

    const handleSaveReward = async (data: CampaignReward) => {
        if (!id || id === 'new') {
            alert('Por favor, salve a campanha primeiro antes de adicionar prêmios.');
            return;
        }

        try {
            setRewardLoading(true);
            console.log('Reward data from form:', data);
            const { partner, created_at, updated_at, ...cleanData } = data as any;
            const rewardData = { ...cleanData, campaign_id: id };

            // Cleanup empty strings and non-column fields to prevent DB errors
            if (!rewardData.id) delete rewardData.id;
            if (!rewardData.partner_id || rewardData.partner_id === "") delete rewardData.partner_id;
            if (!rewardData.draw_at || rewardData.draw_at === "") delete rewardData.draw_at;
            if (!rewardData.file_url || rewardData.file_url === "") delete rewardData.file_url;
            if (!rewardData.image_url || rewardData.image_url === "") delete rewardData.image_url;
            if (!rewardData.draw_position || rewardData.draw_position === "") delete rewardData.draw_position;

            if (rewardData.type === 'pdf') delete rewardData.draw_at;
            if (rewardData.type === 'draw') {
                delete rewardData.file_url;
                if (rewardData.draw_at) {
                    try {
                        rewardData.draw_at = new Date(rewardData.draw_at).toISOString();
                    } catch (e) {
                        console.error('Invalid date format:', rewardData.draw_at);
                    }
                }
            }

            console.log('Sanitized reward data to save:', rewardData);

            if (rewardData.id) {
                await updateReward(rewardData.id, rewardData);
            } else {
                await createReward(rewardData);
            }

            setIsRewardPanelOpen(false);
            rewardForm.reset({ active: true, type: 'pdf', image_url: '', file_url: '', items: [], draw_at: '' });
            fetchCampaign(); // Refresh rewards
        } catch (e: any) {
            console.error('Error saving reward:', e);
            alert('Erro ao salvar prêmio: ' + (e?.message || e?.error_description || 'Erro desconhecido'));
        } finally {
            setRewardLoading(false);
        }
    };

    const handleEditReward = (reward: CampaignReward) => {
        const formattedReward = { ...reward };
        if (formattedReward.draw_at) {
            // Format to YYYY-MM-DDTHH:mm for datetime-local
            const date = new Date(formattedReward.draw_at);
            const tzOffset = date.getTimezoneOffset() * 60000;
            formattedReward.draw_at = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
        }
        rewardForm.reset(formattedReward);
        setIsRewardPanelOpen(true);
    };

    const handleDeleteReward = async (rewardId: string) => {
        if (!confirm('Excluir este prêmio permanentemente?')) return;
        try {
            await deleteReward(rewardId);
            fetchCampaign();
        } catch (e) {
            console.error(e);
            alert('Erro ao excluir');
        }
    };

    const { register, control, handleSubmit, reset, watch, setValue } = useForm<SurveyBuilderForm>({
        resolver: zodResolver(surveyBuilderSchema),
        defaultValues: {
            status: 'draft',
            sections: [],
            consent_text: '',
            theme: { primary_color: '#8B0000', secondary_color: '#FFD700' },
            sponsors: []
        }
    });

    const { fields: sections, append: appendSection, remove: removeSection, move: moveSection } = useFieldArray({
        control,
        name: "sections"
    });

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        if (id === 'new') {
            loadInitialData();
            return;
        }
        fetchCampaign();
    }, [id]);

    const loadInitialData = async () => {
        const [rewards, partnersData] = await Promise.all([
            getRewards(id === 'new' ? undefined : id),
            getPartners()
        ]);
        setAllRewards(rewards);
        setPartners(partnersData);
        setLoading(false);
    };

    const fetchCampaign = async () => {
        const { data, error } = await supabase
            .from('campaigns')
            .select('*')
            .eq('id', id)
            .single();

        if (data) {
            const campaign = data as Campaign;
            reset({
                title: campaign.title,
                slug: campaign.slug || '',
                description: campaign.description,
                consent_text: campaign.consent_text || '',
                status: campaign.status,
                image_url: campaign.image_url || '',
                theme: campaign.theme || { primary_color: '#8B0000', secondary_color: '#FFD700' },
                goal_amount: campaign.goal_amount ? Number(campaign.goal_amount) : 0,
                start_date: campaign.start_date || '',
                end_date: campaign.end_date || '',
                sponsors: campaign.sponsors || [],
                sections: campaign.form_schema?.sections || []
            });

            setIsCampaignActive(campaign.status === 'active');

            const campaignRewards = await getCampaignRewards(id);
            setAllRewards(campaignRewards);
        }

        const partnersData = await getPartners();
        setPartners(partnersData);
        setLoading(false);
    };

    const handleSectionDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = sections.findIndex((s) => s.id === active.id);
            const newIndex = sections.findIndex((s) => s.id === over.id);
            moveSection(oldIndex, newIndex);

            if (activeSectionIndex === oldIndex) setActiveSectionIndex(newIndex);
            else if (activeSectionIndex > oldIndex && activeSectionIndex <= newIndex) setActiveSectionIndex(prev => prev - 1);
            else if (activeSectionIndex < oldIndex && activeSectionIndex >= newIndex) setActiveSectionIndex(prev => prev + 1);
        }
    };

    const onSubmit = async (data: SurveyBuilderForm) => {
        setLoading(true);
        console.log('Original form data:', data);
        const { sections, ...rest } = data;
        const payload = {
            ...rest,
            start_date: rest.start_date || null,
            end_date: rest.end_date || null,
            form_schema: { sections }
        };

        console.log('Payload being sent to Supabase:', payload);

        const { error, data: campaignData } = id === 'new'
            ? await supabase.from('campaigns').insert(payload).select().single()
            : await supabase.from('campaigns').update(payload).eq('id', id).select().single();

        if (error) {
            console.error('Supabase error saving campaign:', error);
            alert('Erro ao salvar campanha: ' + (error.message || 'Erro desconhecido'));
        } else if (campaignData) {
            console.log('Campaign saved successfully:', campaignData);
            navigate('/admin/campaigns');
        }
        setLoading(false);
    };

    if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-400">Preparando ferramenta de construção...</div>;

    const currentSection = sections[activeSectionIndex];

    return (
        <AdminLayout>
            <div className="min-h-screen bg-gray-50/50">
                <form onSubmit={handleSubmit(onSubmit, (errors) => {
                    console.error('Validation errors:', errors);
                    const errorFields = Object.keys(errors).map(field => {
                        const err = (errors as any)[field];
                        return `${field}: ${err?.message || 'Erro'}`;
                    }).join('\n');
                    alert('Erro de validação no formulário:\n' + errorFields);
                })}>
                    <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-40 shadow-sm shadow-gray-100/50">
                        <div className="flex items-center gap-6">
                            <button
                                type="button"
                                onClick={() => navigate('/admin/campaigns')}
                                className="size-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:text-primary hover:bg-primary/5 transition-all"
                            >
                                <span className="material-symbols-outlined">arrow_back</span>
                            </button>
                            <div>
                                <h1 className="text-xl font-black text-text-main tracking-tight uppercase leading-none">
                                    {id === 'new' ? 'Nova Campanha' : 'Editar Campanha'}
                                </h1>
                                <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                                    {isCampaignActive ? (
                                        <span className={`${forceEdit ? 'text-blue-500' : 'text-amber-500'} flex items-center gap-1`}>
                                            <span className="material-symbols-outlined text-[12px]">{forceEdit ? 'lock_open' : 'lock'}</span>
                                            Campanha Ativa - {forceEdit ? 'Edição Liberada' : 'Edição Restrita'}
                                        </span>
                                    ) : 'Configuração Técnica e Estrutural'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            {isCampaignActive && (
                                <button
                                    type="button"
                                    onClick={() => setForceEdit(!forceEdit)}
                                    className={`px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all border-2 ${forceEdit
                                        ? 'bg-blue-50 border-blue-200 text-blue-600'
                                        : 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100'
                                        }`}
                                >
                                    {forceEdit ? 'Travar Edição' : 'Desbloquear Edição'}
                                </button>
                            )}
                            {(!isCampaignActive || forceEdit) && (
                                <button
                                    type="submit"
                                    className="bg-primary text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                                >
                                    Salvar Projeto
                                </button>
                            )}
                        </div>
                    </header>

                    {isCampaignActive && (
                        <div className="bg-amber-50 border-b border-amber-100 p-3 text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-sm">warning</span>
                                Esta campanha está ativa e coletando respostas. Os campos foram bloqueados para preservar a integridade dos dados.
                            </p>
                        </div>
                    )}

                    <main className="max-w-[1600px] mx-auto grid grid-cols-12 gap-8 p-8 h-[calc(100vh-80px)] overflow-hidden">
                        <aside className="col-span-3 flex flex-col gap-6 h-full overflow-hidden">
                            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xl shadow-gray-200/50 flex flex-col h-full">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-sm font-black text-text-main uppercase tracking-widest">Roteiro / Seções</h2>
                                    <div className="flex items-center gap-2">
                                        <label className="size-8 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center hover:bg-blue-100 hover:scale-110 active:scale-95 transition-all cursor-pointer" title="Importar JSON">
                                            <span className="material-symbols-outlined text-sm">upload_file</span>
                                            <input
                                                type="file"
                                                accept=".json"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;

                                                    const reader = new FileReader();
                                                    reader.onload = (event) => {
                                                        try {
                                                            const json = JSON.parse(event.target?.result as string);
                                                            if (json.sections && Array.isArray(json.sections)) {
                                                                if (sections.length > 0 && !window.confirm('Isso substituirá as seções atuais. Deseja continuar?')) {
                                                                    return;
                                                                }
                                                                setValue('sections', json.sections);
                                                                setActiveSectionIndex(0);
                                                                alert('Estrutura importada com sucesso!');
                                                            } else {
                                                                alert('JSON inválido. O arquivo deve conter um objeto com a propriedade "sections" (array).');
                                                            }
                                                        } catch (err) {
                                                            console.error(err);
                                                            alert('Erro ao ler o arquivo JSON.');
                                                        }
                                                        // Reset input
                                                        e.target.value = '';
                                                    };
                                                    reader.readAsText(file);
                                                }}
                                            />
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                appendSection({
                                                    id: Math.random().toString(36).substr(2, 9),
                                                    title: 'Nova Seção',
                                                    questions: [],
                                                    target_roles: ['consulente']
                                                });
                                                setActiveSectionIndex(sections.length);
                                            }}
                                            className="size-8 bg-accent text-white rounded-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                                            title="Adicionar Seção"
                                        >
                                            <span className="material-symbols-outlined text-sm">add</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                                    <DndContext
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragEnd={handleSectionDragEnd}
                                    >
                                        <SortableContext
                                            items={sections.map(s => s.id)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            {sections.map((section, index) => (
                                                <SortableItem key={section.id} id={section.id}>
                                                    <SectionNavItem
                                                        section={section}
                                                        index={index}
                                                        isActive={activeSectionIndex === index}
                                                        onClick={() => setActiveSectionIndex(index)}
                                                        onRemove={() => {
                                                            removeSection(index);
                                                            if (activeSectionIndex >= index && activeSectionIndex > 0) setActiveSectionIndex(prev => prev - 1);
                                                        }}
                                                    />
                                                </SortableItem>
                                            ))}
                                        </SortableContext>
                                    </DndContext>
                                </div>
                            </div>
                        </aside>

                        <section className="col-span-9 flex flex-col gap-8 h-full overflow-y-auto pr-4 custom-scrollbar">
                            <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-xl shadow-gray-200/50">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="size-10 bg-primary/5 text-primary rounded-xl flex items-center justify-center">
                                        <span className="material-symbols-outlined">settings</span>
                                    </div>
                                    <h3 className="text-xl font-black text-text-main tracking-tight uppercase">Configurações Gerais</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="col-span-2">
                                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">Título da Campanha</label>
                                        <input {...register("title")} className="w-full border-gray-200 rounded-2xl p-4 text-sm" placeholder="Ex: Censo Nacional de Terreiros" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">Identificador (Slug)</label>
                                        <input {...register("slug")} className="w-full border-gray-200 rounded-2xl p-4 text-sm" placeholder="censo-2024" />
                                    </div>
                                    <div className="col-span-3">
                                        <ImageUpload
                                            label="Capa da Campanha"
                                            value={watch('image_url') || ''}
                                            onChange={(url) => setValue('image_url', url)}
                                            folder="campaign-covers"
                                            guideline="Resolução recomendada: 1200x630px ou 1600x900px (Proporção 16:9)"
                                        />
                                    </div>

                                    <div className="md:col-span-1">
                                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">Status Inicial</label>
                                        <select {...register("status")} className="w-full border-gray-200 rounded-2xl p-4 text-sm font-bold">
                                            <option value="draft">Rascunho</option>
                                            <option value="active">Ativa</option>
                                            <option value="ended">Encerrada</option>
                                        </select>
                                    </div>

                                    <div className="md:col-span-1">
                                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">Cor de Destaque (Principal)</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={watch('theme.primary_color') || '#8B0000'}
                                                onChange={(e) => setValue('theme.primary_color', e.target.value)}
                                                className="size-12 rounded-xl border-none cursor-pointer p-0 overflow-hidden"
                                            />
                                            <input {...register("theme.primary_color")} className="flex-1 border-gray-200 rounded-2xl px-4 text-sm uppercase" />
                                        </div>
                                    </div>

                                    <div className="md:col-span-1">
                                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">Cor Secundária / Accent</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={watch('theme.secondary_color') || '#FFD700'}
                                                onChange={(e) => setValue('theme.secondary_color', e.target.value)}
                                                className="size-12 rounded-xl border-none cursor-pointer p-0 overflow-hidden"
                                            />
                                            <input {...register("theme.secondary_color")} className="flex-1 border-gray-200 rounded-2xl px-4 text-sm uppercase" />
                                        </div>
                                    </div>

                                    <div className="md:col-span-1">
                                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">Data de Início</label>
                                        <input
                                            type="date"
                                            {...register("start_date")}
                                            disabled={isCampaignActive && !forceEdit}
                                            className="w-full border-gray-200 rounded-2xl p-4 text-sm font-bold disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        />
                                    </div>

                                    <div className="md:col-span-1">
                                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">Data de Término</label>
                                        <input
                                            type="date"
                                            {...register("end_date")}
                                            disabled={isCampaignActive && !forceEdit}
                                            className="w-full border-gray-200 rounded-2xl p-4 text-sm font-bold disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        />
                                        <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase tracking-wider">A campanha será encerrada automaticamente nesta data</p>
                                    </div>

                                    <div className="col-span-3">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <span className="material-symbols-outlined text-primary/40 text-[20px]">handshake</span>
                                                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Patrocinadores da Campanha</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const currentSponsors = watch('sponsors') || [];
                                                    setValue('sponsors', [...currentSponsors, { name: '', logo_url: '', url: '' }]);
                                                }}
                                                className="bg-primary/5 text-primary px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 transition-all flex items-center gap-2"
                                            >
                                                <span className="material-symbols-outlined text-sm">add</span>
                                                Novo Patrocinador
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {(watch('sponsors') || []).map((sponsor, sIdx) => (
                                                <div key={sIdx} className="p-6 bg-gray-50/50 rounded-3xl border border-gray-100 flex flex-col gap-4">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-black uppercase text-gray-400">Patrocinador #{sIdx + 1}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const currentSponsors = watch('sponsors') || [];
                                                                setValue('sponsors', currentSponsors.filter((_, i) => i !== sIdx));
                                                            }}
                                                            className="text-red-400 hover:text-red-600"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">delete</span>
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-[8px] font-black uppercase text-gray-400 mb-1">Nome</label>
                                                            <input
                                                                {...register(`sponsors.${sIdx}.name` as const)}
                                                                className="w-full border-gray-100 bg-white p-3 rounded-xl text-xs font-bold"
                                                                placeholder="Ex: Banco X"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[8px] font-black uppercase text-gray-400 mb-1">URL</label>
                                                            <input
                                                                {...register(`sponsors.${sIdx}.url` as const)}
                                                                className="w-full border-gray-100 bg-white p-3 rounded-xl text-xs font-bold"
                                                                placeholder="https://..."
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="pt-2">
                                                        <ImageUpload
                                                            label="Logo"
                                                            value={sponsor.logo_url}
                                                            onChange={(url) => {
                                                                const currentSponsors = watch('sponsors') || [];
                                                                const updated = [...currentSponsors];
                                                                updated[sIdx].logo_url = url;
                                                                setValue('sponsors', updated);
                                                            }}
                                                            folder="campaign-sponsors"
                                                            guideline="Resolução recomendada: 400x400px"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                            {(watch('sponsors')?.length === 0) && (
                                                <div className="col-span-2 p-8 border-2 border-dashed border-gray-100 rounded-3xl text-center">
                                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Nenhum patrocinador específico vinculado</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="col-span-3">
                                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">Termos de Consentimento</label>
                                        <textarea
                                            {...register("consent_text")}
                                            className="w-full border-gray-200 rounded-2xl p-4 text-sm h-32 font-mono"
                                            placeholder="Descreva aqui os termos de uso e consentimento da pesquisa..."
                                        />
                                    </div>

                                    <div className="col-span-3">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <span className="material-symbols-outlined text-primary/40 text-[20px]">card_giftcard</span>
                                                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Incentivos & Recompensas</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (!id || id === 'new') {
                                                        alert('Salve a campanha antes de adicionar incentivos.');
                                                        return;
                                                    }
                                                    rewardForm.reset({ active: true, type: 'pdf', image_url: '', file_url: '', items: [], draw_at: '' });
                                                    setIsRewardPanelOpen(true);
                                                }}
                                                className="bg-primary/5 text-primary px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 transition-all flex items-center gap-2"
                                            >
                                                <span className="material-symbols-outlined text-sm">add</span>
                                                Novo Incentivo
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {allRewards.map(reward => (
                                                <div
                                                    key={reward.id}
                                                    className="p-5 rounded-3xl border-2 border-gray-50 bg-gray-50/30 transition-all flex flex-col gap-4 group relative"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="size-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                                                            {reward.image_url ? (
                                                                <img src={reward.image_url} className="w-full h-full object-cover" alt="" />
                                                            ) : (
                                                                <span className="material-symbols-outlined text-gray-300">
                                                                    {reward.type === 'pdf' ? 'picture_as_pdf' : 'redeem'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-xs font-black text-text-main uppercase tracking-tight truncate">{reward.title}</div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">{reward.type === 'pdf' ? 'Material Digital' : 'Sorteio'}</div>
                                                                {reward.draw_at && (
                                                                    <div className="text-[8px] text-amber-500 font-black uppercase tracking-widest flex items-center gap-0.5">
                                                                        <span className="material-symbols-outlined text-[10px]">event</span>
                                                                        {new Date(reward.draw_at).toLocaleDateString('pt-BR')}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleEditReward(reward)}
                                                                className="size-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-primary hover:bg-primary/5 shadow-sm"
                                                            >
                                                                <span className="material-symbols-outlined text-sm">edit</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteReward(reward.id)}
                                                                className="size-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-red-400 hover:bg-red-50 shadow-sm"
                                                            >
                                                                <span className="material-symbols-outlined text-sm">delete</span>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {reward.type === 'draw' && (
                                                        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                                                            <span className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Posição:</span>
                                                            <span className="text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/5 rounded-lg">{reward.draw_position || 'Não def.'}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {allRewards.length === 0 && (
                                                <div className="col-span-3 p-8 border-2 border-dashed border-gray-100 rounded-3xl text-center">
                                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Nenhum incentivo cadastrado para esta campanha</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {currentSection ? (
                                <div key={activeSectionIndex} className="bg-white rounded-3xl border border-primary/20 p-8 shadow-2xl shadow-primary/5 border-l-[12px]">
                                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b border-gray-100">
                                        <div className="flex-1 min-w-0">
                                            <span className="text-[10px] font-black text-primary uppercase tracking-widest mb-2 block">Editando Seção {activeSectionIndex + 1}</span>
                                            <input
                                                {...register(`sections.${activeSectionIndex}.title`)}
                                                className="w-full font-black text-3xl text-text-main border-none p-0 focus:ring-0 uppercase tracking-tight"
                                                placeholder="Nome da Seção"
                                            />
                                        </div>
                                        <div className="w-full md:w-64">
                                            <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">Perfis Permitidos nesta Seção</label>
                                            <select multiple {...register(`sections.${activeSectionIndex}.target_roles`)} className="w-full text-xs border-gray-200 rounded-xl h-24">
                                                <option value="lider_terreiro">Lid. de Terreiro</option>
                                                <option value="medium">Médium</option>
                                                <option value="consulente">Consulente</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <QuestionsEditorList
                                            key={activeSectionIndex}
                                            sectionIndex={activeSectionIndex}
                                            control={control}
                                            register={register}
                                            watch={watch}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border-2 border-dashed border-gray-100 opacity-50">
                                    <span className="material-symbols-outlined text-6xl text-gray-200 mb-4">view_quilt</span>
                                    <p className="font-bold text-gray-400 uppercase tracking-widest text-xs">Selecione ou crie uma seção</p>
                                </div>
                            )}
                        </section>
                    </main>
                </form>

                <SidePanel
                    isOpen={isRewardPanelOpen}
                    onClose={() => setIsRewardPanelOpen(false)}
                    title={rewardForm.watch('id') ? "Editar Incentivo" : "Novo Incentivo"}
                >
                    <form onSubmit={rewardForm.handleSubmit(handleSaveReward, (errs) => {
                        console.error('Reward validation errors:', errs);
                        alert('Por favor, preencha todos os campos obrigatórios do prêmio.');
                    })} className="space-y-8">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">Título do Prêmio / Material</label>
                                <input
                                    {...rewardForm.register('title', { required: true })}
                                    className="w-full border-gray-100 bg-gray-50/50 p-5 rounded-[20px] focus:ring-4 ring-primary/5 outline-none transition-all font-bold text-text-main"
                                    placeholder="Ex: E-book: Guia do Axé"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">Descrição Curta</label>
                                <textarea
                                    {...rewardForm.register('description')}
                                    className="w-full border-gray-100 bg-gray-50/50 p-5 rounded-[20px] focus:ring-4 ring-primary/5 outline-none transition-all font-bold text-text-main"
                                    placeholder="Explique o que o usuário vai ganhar..."
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">Tipo</label>
                                    <select
                                        {...rewardForm.register('type', { required: true })}
                                        className="w-full border-gray-100 bg-gray-50/50 p-5 rounded-[20px] focus:ring-4 ring-primary/5 outline-none transition-all font-bold text-text-main appearance-none"
                                    >
                                        <option value="pdf">Material Rico (PDF)</option>
                                        <option value="draw">Sorteio</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">Parceiro (Opcional)</label>
                                    <select
                                        {...rewardForm.register('partner_id')}
                                        className="w-full border-gray-100 bg-gray-50/50 p-5 rounded-[20px] focus:ring-4 ring-primary/5 outline-none transition-all font-bold text-text-main appearance-none"
                                    >
                                        <option value="">Próprio / PNA</option>
                                        {partners.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {rewardForm.watch('type') === 'pdf' && (
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">Link do PDF / Arquivo</label>
                                    <input
                                        {...rewardForm.register('file_url')}
                                        className="w-full border-gray-100 bg-gray-50/50 p-5 rounded-[20px] focus:ring-4 ring-primary/5 outline-none transition-all font-bold text-text-main"
                                        placeholder="https://sua-url-do-arquivo.pdf"
                                    />
                                    <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-wider">O usuário poderá baixar este arquivo após concluir a pesquisa.</p>
                                </div>
                            )}

                            {rewardForm.watch('type') === 'draw' && (
                                <>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">Classificação (ex: 1º Lugar)</label>
                                        <input
                                            {...rewardForm.register('draw_position')}
                                            className="w-full border-gray-100 bg-gray-50/50 p-5 rounded-[20px] focus:ring-4 ring-primary/5 outline-none transition-all font-bold text-text-main"
                                            placeholder="Ex: Primeiro Lugar"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">Data e Hora do Sorteio (Loteria Federal)</label>
                                        <input
                                            type="datetime-local"
                                            {...rewardForm.register('draw_at')}
                                            className="w-full border-gray-100 bg-gray-50/50 p-5 rounded-[20px] focus:ring-4 ring-primary/5 outline-none transition-all font-bold text-text-main"
                                        />
                                        <p className="text-[9px] text-gray-400 font-bold mt-2 uppercase tracking-tight">O sorteio será realizado com base nos números bilhetes nesta data.</p>
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">Itens Inclusos / Composição do Kit</label>
                                <div className="flex gap-2 mb-4">
                                    <input
                                        value={newItemName}
                                        onChange={(e) => setNewItemName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRewardItem())}
                                        className="flex-1 border-gray-100 bg-gray-50/50 p-4 rounded-2xl focus:ring-4 ring-primary/5 outline-none transition-all font-bold text-text-main text-sm"
                                        placeholder="Ex: Camiseta PNA"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddRewardItem}
                                        className="size-14 bg-primary text-white rounded-2xl flex items-center justify-center hover:scale-105 transition-all outline-none"
                                    >
                                        <span className="material-symbols-outlined">add</span>
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {currentRewardItems.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl font-bold text-text-main text-sm">
                                            <span>{item}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveRewardItem(idx)}
                                                className="text-red-400 hover:text-red-600 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-lg">delete</span>
                                            </button>
                                        </div>
                                    ))}
                                    {currentRewardItems.length === 0 && (
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider text-center py-4 bg-gray-50/30 rounded-2xl border border-dashed border-gray-100">
                                            Nenhum item adicionado
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <ImageUpload
                                    label="Imagem de Capa do Prêmio"
                                    value={rewardForm.watch('image_url') || ''}
                                    onChange={(url) => rewardForm.setValue('image_url', url)}
                                    folder="reward-assets"
                                    guideline="Resolução recomendada: 800x600px ou 1200x900px"
                                />
                            </div>

                            <div className="flex items-center gap-3 p-5 bg-gray-50/50 rounded-[20px] border border-gray-100">
                                <input type="checkbox" {...rewardForm.register('active')} className="size-5 rounded-lg border-gray-300 text-primary focus:ring-primary outline-none" />
                                <span className="text-[10px] font-black uppercase text-text-main tracking-widest">Prêmio Disponível</span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={rewardLoading}
                            className="w-full bg-primary text-white py-5 rounded-[25px] font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
                        >
                            {rewardForm.watch('id') ? "Salvar Alterações" : "Criar Prêmio"}
                        </button>
                    </form>
                </SidePanel>
            </div>
        </AdminLayout>
    );
};

const QuestionsEditorList = ({ sectionIndex, control, register, watch }: any) => {
    const { fields: questions, append, remove, move } = useFieldArray({
        control,
        name: `sections.${sectionIndex}.questions`
    });

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = questions.findIndex((q) => q.id === active.id);
            const newIndex = questions.findIndex((q) => q.id === over.id);
            move(oldIndex, newIndex);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest">Perguntas da Seção</h4>
                <span className="text-xs font-bold text-primary/40">{questions.length} Questões</span>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={questions.map(q => q.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {questions.map((q, qIndex) => (
                        <SortableItem key={q.id} id={q.id}>
                            <div className="flex-1">
                                <QuestionItem
                                    question={q}
                                    index={qIndex}
                                    sectionIndex={sectionIndex}
                                    register={register}
                                    watch={watch}
                                    control={control}
                                    onRemove={() => remove(qIndex)}
                                />
                            </div>
                        </SortableItem>
                    ))}
                </SortableContext>
            </DndContext>

            <button
                type="button"
                onClick={() => append({
                    id: Math.random().toString(36).substr(2, 9),
                    type: 'short_text',
                    label: '',
                    required: false
                })}
                className="w-full py-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl flex items-center justify-center gap-3 text-gray-400 font-black uppercase text-[10px] tracking-widest hover:bg-primary/5 hover:border-primary/20 hover:text-primary transition-all group"
            >
                <span className="material-symbols-outlined text-sm group-hover:scale-125 transition-transform">add_circle</span>
                Adicionar Nova Pergunta
            </button>
        </div>
    );
};

export default AdminCampaignBuilder;
